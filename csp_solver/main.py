from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import json
from typing import List, Dict, Any, Optional
from ortools.sat.python import cp_model

app = FastAPI(title="Scheduling CSP Optimization API")

from pydantic import BaseModel

class Teacher(BaseModel):
    id: str
    max_hours: int
    availabilities: List[Dict[str, int]]
    competencies: List[str]

class CohortClass(BaseModel):
    id: str
    course_id: str
    cohort_id: str
    required_hours: int
    students_count: int
    teacher_id: str
    tipo_sesion: str = 'Teoría'

class Room(BaseModel):
    id: str
    capacity: int
    tipo_aula: str = 'TA01'

class OptimizationRequest(BaseModel):
    teachers: List[Teacher]
    classes: List[CohortClass]
    rooms: List[Room]
    days: int = 5
    slots_per_day: int = 5
    relaxed: bool = False
    tipo_aula_map: Dict[str, List[str]] = {}
    timeout_segundos: int = 60
    sesiones_max_por_dia_profesor: int = 1

class AssignedSession(BaseModel):
    class_id: str
    teacher_id: str
    room_id: str
    day: int
    slot: int

class UnassignedClass(BaseModel):
    class_id: str
    course_id: str
    teacher_id: str
    reason: str
    required_hours: int

class OptimizationResponse(BaseModel):
    status: str
    sessions: List[AssignedSession]
    unassigned: List[UnassignedClass] = []
    message: str = ""
    coverage: Optional[float] = None

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    tb = traceback.format_exc()
    print("UNHANDLED EXCEPTION:", tb)
    return JSONResponse(
        status_code=500,
        content={"status": "ERROR", "message": str(exc), "traceback": tb}
    )

@app.get("/")
def root():
    return {"status": "ok", "service": "csp-solver"}

@app.get("/health")
def health():
    return {"status": "ok", "version": "4.0"}

def build_model(req: OptimizationRequest):
    model = cp_model.CpModel()

    teacher_avail: Dict[str, set] = {}
    for t in req.teachers:
        teacher_avail[t.id] = set((a["day"], a["slot"]) for a in t.availabilities)

    max_cap = max((r.capacity for r in req.rooms), default=0)

    assign = {}
    unresolvable = []

    teachers_dict = {t.id: t for t in req.teachers}

    for c in req.classes:
        t = teachers_dict.get(c.teacher_id)
        if not t:
            unresolvable.append(UnassignedClass(
                class_id=c.id, course_id=c.course_id,
                teacher_id=c.teacher_id, reason="no_teacher_assigned",
                required_hours=c.required_hours
            ))
            continue
        if c.course_id not in t.competencies:
            unresolvable.append(UnassignedClass(
                class_id=c.id, course_id=c.course_id,
                teacher_id=c.teacher_id, reason="no_teacher_competent",
                required_hours=c.required_hours
            ))
            continue

        tipos_permitidos = req.tipo_aula_map.get(c.tipo_sesion, ['TA01'])
        eligible_rooms = [r for r in req.rooms if r.capacity >= c.students_count and r.tipo_aula in tipos_permitidos]
        if not eligible_rooms:
            eligible_rooms = [r for r in req.rooms if r.capacity == max_cap]
            if not eligible_rooms:
                unresolvable.append(UnassignedClass(
                    class_id=c.id, course_id=c.course_id,
                    teacher_id=c.teacher_id, reason="no_room_available",
                    required_hours=c.required_hours
                ))
                continue

        has_any_available = False
        for r in eligible_rooms:
            for d in range(req.days):
                for s in range(req.slots_per_day):
                    if (d, s) in teacher_avail[t.id]:
                        has_any_available = True
                        key = (c.id, t.id, r.id, d, s)
                        assign[key] = model.NewBoolVar(
                            f"a_{c.id[:6]}_{t.id[:6]}_{r.id[:6]}_{d}_{s}"
                        )
        if not has_any_available:
            unresolvable.append(UnassignedClass(
                class_id=c.id, course_id=c.course_id,
                teacher_id=c.teacher_id, reason="no_teacher_availability",
                required_hours=c.required_hours
            ))

    return model, assign, unresolvable, teacher_avail, teachers_dict

def add_constraints(model, assign, req, relaxed, sesiones_max_por_dia):
    # CONSTRAINT 1: Each class scheduled required_hours times
    for c in req.classes:
        class_vars = [v for k, v in assign.items() if k[0] == c.id]
        if not class_vars:
            continue
        hours = min(c.required_hours, len(class_vars))
        if relaxed:
            model.Add(sum(class_vars) <= hours)
        else:
            model.Add(sum(class_vars) == hours)

    # CONSTRAINT 2: Teacher can only be in one place per slot
    for t in req.teachers:
        for d in range(req.days):
            for s in range(req.slots_per_day):
                tvars = [v for k, v in assign.items() if k[1] == t.id and k[3] == d and k[4] == s]
                if len(tvars) > 1:
                    model.AddAtMostOne(tvars)

    # CONSTRAINT 3: Room can only hold one class per slot
    for r in req.rooms:
        for d in range(req.days):
            for s in range(req.slots_per_day):
                rvars = [v for k, v in assign.items() if k[2] == r.id and k[3] == d and k[4] == s]
                if len(rvars) > 1:
                    model.AddAtMostOne(rvars)

    # CONSTRAINT 4: Cohort can't have two classes at same time
    cohorts = set(c.cohort_id for c in req.classes)
    for cohort_id in cohorts:
        c_ids = [c.id for c in req.classes if c.cohort_id == cohort_id]
        for d in range(req.days):
            for s in range(req.slots_per_day):
                cvars = [v for k, v in assign.items() if k[0] in c_ids and k[3] == d and k[4] == s]
                if len(cvars) > 1:
                    model.AddAtMostOne(cvars)

    # CONSTRAINT 5: Teacher max hours
    for t in req.teachers:
        tvars = [v for k, v in assign.items() if k[1] == t.id]
        if tvars:
            model.Add(sum(tvars) <= t.max_hours)

    # CONSTRAINT 6: Professor at most N sessions per day
    for t in req.teachers:
        for d in range(req.days):
            tvars = [v for k, v in assign.items() if k[1] == t.id and k[3] == d]
            if tvars:
                model.Add(sum(tvars) <= sesiones_max_por_dia)

    # If relaxed mode, add objective to maximize assigned hours
    if relaxed:
        all_vars = list(assign.values())
        if all_vars:
            model.Maximize(sum(all_vars))

def extract_sessions(assign, solver, req):
    sessions = []
    for k, v in assign.items():
        if solver.Value(v) == 1:
            sessions.append({
                "class_id": k[0],
                "teacher_id": k[1],
                "room_id": k[2],
                "day": k[3],
                "slot": k[4]
            })
    return sessions

def compute_coverage(sessions, req):
    if not req.classes:
        return 100.0
    assigned_hours = {}
    for s in sessions:
        cid = s["class_id"]
        assigned_hours[cid] = assigned_hours.get(cid, 0) + 1
    total_required = sum(c.required_hours for c in req.classes)
    total_assigned = sum(assigned_hours.values())
    if total_required == 0:
        return 100.0
    return round(total_assigned / total_required * 100, 1)

@app.post("/optimize")
async def optimize_schedule(request: Request):
    try:
        body = await request.json()

        try:
            req = OptimizationRequest(**body)
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"status": "ERROR", "message": f"Request validation failed: {str(e)}"}
            )

        # Build model
        model, assign, unresolvable, teacher_avail, teachers_dict = build_model(req)

        # Collect unresolvable class_ids for filtering
        unresolvable_ids = {u.class_id for u in unresolvable}

        if unresolvable:
            if req.relaxed:
                # In relaxed mode, exclude unresolvable classes and continue
                req.classes = [c for c in req.classes if c.id not in unresolvable_ids]
                model, assign, _, _, _ = build_model(req)
                if not assign or not req.classes:
                    return OptimizationResponse(
                        status="INFEASIBLE",
                        sessions=[],
                        unassigned=unresolvable,
                        message=f"Cursos sin solución: {', '.join(set(u.course_id for u in unresolvable))}",
                        coverage=0.0
                    ).model_dump()
            else:
                return OptimizationResponse(
                    status="INFEASIBLE",
                    sessions=[],
                    unassigned=unresolvable,
                    message=f"No se pueden asignar los siguientes cursos. Verifica que tengan un docente con la competencia habilitada.",
                    coverage=0.0
                ).model_dump()

        if not assign:
            return OptimizationResponse(
                status="INFEASIBLE", sessions=[], unassigned=unresolvable,
                message="No hay combinaciones válidas de docente/aula/bloque.",
                coverage=0.0
            ).model_dump()

        # Add constraints
        add_constraints(model, assign, req, req.relaxed, req.sesiones_max_por_dia_profesor)

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = req.timeout_segundos
        status_code = solver.Solve(model)

        if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            sessions = extract_sessions(assign, solver, req)
            coverage = compute_coverage(sessions, req)
            label = "OPTIMAL" if status_code == cp_model.OPTIMAL else "FEASIBLE"
            status = "SUCCESS" if coverage >= 100.0 else "PARTIAL"

            # Track partially assigned classes
            assigned_hours = {}
            for s in sessions:
                assigned_hours[s["class_id"]] = assigned_hours.get(s["class_id"], 0) + 1
            for c in req.classes:
                assigned = assigned_hours.get(c.id, 0)
                if assigned < c.required_hours:
                    unresolvable.append(UnassignedClass(
                        class_id=c.id, course_id=c.course_id,
                        teacher_id=c.teacher_id, reason="partially_assigned",
                        required_hours=c.required_hours
                    ))

            return OptimizationResponse(
                status=status,
                sessions=sessions,
                unassigned=unresolvable,
                coverage=coverage,
                message=f"Horario generado ({label}). {len(sessions)} sesiones asignadas, cobertura: {coverage}%."
            ).model_dump()
        elif status_code == cp_model.INFEASIBLE:
            if not req.relaxed:
                return OptimizationResponse(
                    status="INFEASIBLE", sessions=[], unassigned=unresolvable,
                    message="No existe combinación factible. Revisa disponibilidades y capacidades.",
                    coverage=0.0
                ).model_dump()
            else:
                return OptimizationResponse(
                    status="INFEASIBLE", sessions=[], unassigned=unresolvable,
                    message="No se pudo generar ningún horario incluso en modo relajado.",
                    coverage=0.0
                ).model_dump()
        else:
            return OptimizationResponse(
                status="TIMEOUT", sessions=[], unassigned=unresolvable,
                message="El solver agotó el tiempo límite.",
                coverage=0.0
            ).model_dump()

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print("ERROR EN /optimize:", tb)
        return JSONResponse(
            status_code=500,
            content={"status": "ERROR", "message": str(e), "traceback": tb}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
