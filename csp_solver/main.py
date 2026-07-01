import traceback
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict
from ortools.sat.python import cp_model

app = FastAPI(title="Scheduling CSP Optimization API")

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

class Room(BaseModel):
    id: str
    capacity: int

class OptimizationRequest(BaseModel):
    teachers: List[Teacher]
    classes: List[CohortClass]
    rooms: List[Room]
    days: int = 5
    slots_per_day: int = 5

class AssignedSession(BaseModel):
    class_id: str
    teacher_id: str
    room_id: str
    day: int
    slot: int

class OptimizationResponse(BaseModel):
    status: str
    sessions: List[AssignedSession]
    message: str = ""

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    print("UNHANDLED EXCEPTION:", tb)
    return JSONResponse(
        status_code=500,
        content={"status": "ERROR", "message": str(exc), "traceback": tb}
    )

@app.get("/health")
def health():
    return {"status": "ok", "version": "3.0"}

@app.post("/optimize")
def optimize_schedule(req: OptimizationRequest):
    try:
        model = cp_model.CpModel()

        # Pre-compute teacher availability sets
        teacher_avail: Dict[str, set] = {}
        for t in req.teachers:
            teacher_avail[t.id] = set((a["day"], a["slot"]) for a in t.availabilities)

        max_cap = max((r.capacity for r in req.rooms), default=0)

        assign = {}
        unresolvable = []

        # Convert teachers to dict for quick access
        teachers_dict = {t.id: t for t in req.teachers}

        for c in req.classes:
            t = teachers_dict.get(c.teacher_id)
            if not t:
                unresolvable.append(c.course_id)
                continue

            eligible_rooms = [r for r in req.rooms if r.capacity >= c.students_count]
            if not eligible_rooms:
                eligible_rooms = [r for r in req.rooms if r.capacity == max_cap]

            for r in eligible_rooms:
                for d in range(req.days):
                    for s in range(req.slots_per_day):
                        if (d, s) in teacher_avail[t.id]:
                            key = (c.id, t.id, r.id, d, s)
                            assign[key] = model.NewBoolVar(
                                f"a_{c.id[:6]}_{t.id[:6]}_{r.id[:6]}_{d}_{s}"
                            )

        if unresolvable:
            return {
                "status": "INFEASIBLE",
                "sessions": [],
                "message": f"Los siguientes cursos tienen un docente asignado que no existe o no se envió al solver: {', '.join(set(unresolvable))}."
            }

        if not assign:
            return {"status": "INFEASIBLE", "sessions": [],
                    "message": "No hay combinaciones válidas de docente/aula/bloque."}

        # CONSTRAINT 1: Each class scheduled exactly required_hours times
        for c in req.classes:
            class_vars = [v for k, v in assign.items() if k[0] == c.id]
            if not class_vars:
                return {"status": "INFEASIBLE", "sessions": [],
                        "message": f"Sin combinaciones para clase {c.id[:8]}"}
            hours = min(c.required_hours, len(class_vars))
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

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 60.0
        status_code = solver.Solve(model)

        if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE):
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
            label = "OPTIMAL" if status_code == cp_model.OPTIMAL else "FEASIBLE"
            return {
                "status": "SUCCESS",
                "sessions": sessions,
                "message": f"Horario generado ({label}). {len(sessions)} sesiones."
            }
        elif status_code == cp_model.INFEASIBLE:
            return {"status": "INFEASIBLE", "sessions": [],
                    "message": "No existe combinación factible. Revisa disponibilidades y capacidades."}
        else:
            return {"status": "TIMEOUT", "sessions": [],
                    "message": "El solver agotó el tiempo límite."}

    except Exception as e:
        tb = traceback.format_exc()
        print("ERROR EN /optimize:", tb)
        return JSONResponse(
            status_code=500,
            content={"status": "ERROR", "message": str(e), "traceback": tb}
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
