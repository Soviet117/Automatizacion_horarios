# Informe Técnico de Estado: Proyecto Horarios Universitarios (Módulo de Escenarios y Optimizador CSP)

**Fecha:** 20 de Junio de 2026
**Contexto General:** Se está desarrollando una plataforma monolítica en Next.js (con Prisma + PostgreSQL) para la gestión académica y programación de horarios. Actualmente se está trabajando en la integración de un solucionador CSP (Constraint Satisfaction Problem) en Python para autogenerar horarios sin cruces.

---

## 1. Arquitectura y Flujo Actual Implementado
Se ha finalizado la integración estructural del **Módulo de Escenarios** (`escenario`), el cual funciona como un sistema de control de versiones para los horarios:
- La tabla `horario_sesion` ahora posee una llave foránea opcional `id_escenario`.
- Esto permite guardar múltiples simulaciones sin violar restricciones de unicidad de aula/docente/tiempo en la BD.
- En la UI (`app/dashboard/escenarios`), al hacer clic en **"Re-optimizar (CSP)"** se ejecuta un Server Action (`runOptimizationForEscenario`) que llama al servicio TypeScript `SchedulerService.optimizeSchedule`.

## 2. El Bug Actual ("Faltan datos maestros")
Al ejecutar la re-optimización, el servicio aborta la ejecución con el siguiente error:
> *"Faltan datos maestros (Docentes, Aulas o Asignaciones) para generar el horario."*

### Diagnóstico Exacto
El error se dispara en `lib/schedulerService.ts` porque el array de `asignacionesDB` está vacío (`length === 0`). 
Al hacer un recuento directo en la base de datos (PostgreSQL), el estado de la data maestra es:
- **Docentes registrados:** 3
- **Aulas registradas:** 4
- **Asignaciones registradas:** 0 🔴

**¿Por qué hay 0 Asignaciones?**
En refactorizaciones anteriores del esquema, la tabla `materia_cohorte` fue eliminada y reemplazada por un nuevo modelo llamado `asignacion`. La tabla `asignacion` es la que vincula un `Curso`, un `Docente` y un `Periodo_Academico`. 
Actualmente, la UI del módulo "Gestión Curricular" o "Recursos" probablemente no está guardando registros en la tabla `asignacion`, o bien los datos fueron limpiados durante un `db push` y no han vuelto a ser cargados.

## 3. Requerimientos para la Otra IA (Siguientes Pasos)
Para resolver definitivamente este bloqueo y hacer que el CSP Solver de Python funcione, la próxima IA debe enfocarse en lo siguiente:

1. **Revisar el Flujo de Asignaciones (Gestión Curricular):**
   Debe verificar el código de frontend y backend del módulo donde se le asigna un Docente a un Curso. Asegurarse de que al guardar, se realice un `prisma.asignacion.create()` o `upsert()`, uniendo el `id_curso` y el `id_docente` bajo el `id_periodo` correspondiente (ej. "Actual").

2. **Crear Data Seed de Prueba (Opcional):**
   Si la UI de Asignaciones aún no está construida o está rota, debe crear un script de `seed` rápido (o inyectar por consola) al menos 1 o 2 `asignacion` ficticias para poder darle "gasolina" al algoritmo CSP y probar que la integración de Escenarios funciona del inicio al fin.

3. **Verificar Schema Prisma de Asignacion:**
   Recordar que el modelo en `schema.prisma` es:
   ```prisma
   model asignacion {
     id_asignacion  String           @id @db.VarChar
     id_docente     String?          @db.VarChar
     id_curso       String           @db.VarChar
     id_periodo     String           @db.VarChar
     // relaciones...
   }
   ```
   *Nota: Sin asignaciones, el motor CSP no tiene clases/materias que posicionar en el tiempo y espacio.*
