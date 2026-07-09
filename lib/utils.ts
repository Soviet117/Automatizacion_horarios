import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeTipoCurso(type: string): string {
  const t = String(type ?? '').trim().toLowerCase();
  if (['theoretical', 'programming', 'electronics', 'nursing'].includes(t)) return t;
  if (t.includes('teoric') || t.includes('obligatorio') || t.includes('general')) return 'theoretical';
  if (t.includes('program') || t.includes('computa')) return 'programming';
  if (t.includes('electron')) return 'electronics';
  if (t.includes('enferm')) return 'nursing';
  return 'theoretical';
}

export function mapProgramToCarreraId(program: string): string {
  if (!program) return "C01";
  const norm = program.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (norm.includes("computa")) return "C02";
  if (norm.includes("electron")) return "C03";
  if (norm.includes("enferm")) return "C04";
  return "C01";
}

export function formatDocenteDisponibilidad(d: any) {
  if (!d) return null;
  const availability: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  d.disponibilidad_docente?.forEach((dd: any) => {
    if (availability[dd.id_dia]) availability[dd.id_dia].push(dd.id_bloque);
  });
  return {
    id_docente: d.id_docente,
    dni_docente: d.dni_docente,
    nom_docente: d.nom_docente,
    ape_docente: d.ape_docente,
    nom_especialidad: d.nom_especialidad,
    disponibilidad: availability,
  };
}
