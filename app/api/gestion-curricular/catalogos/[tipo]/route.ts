import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { getSessionFromRequest, handleApiError } from '@/lib/auth';

export async function POST(req: NextRequest, props: { params: Promise<{ tipo: string }> }) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const data = await req.json();
    const params = await props.params;
    const tipo = params.tipo;

    let result;

    switch (tipo) {
      case 'facultad':
        if (!data.id_facultad) data.id_facultad = `FAC-${crypto.randomUUID().substring(0, 8)}`;
        result = await prisma.facultad.create({ data: { ...data, id_usuario: session.userId } });
        break;
      case 'carrera':
        if (!data.id_carrera) data.id_carrera = `CAR-${crypto.randomUUID().substring(0, 8)}`;
        result = await prisma.carrera.create({ data: { ...data, id_usuario: session.userId } });
        break;
      case 'ciclo':
        if (!data.id_ciclo) {
          const maxCiclo = await prisma.ciclo.aggregate({ _max: { id_ciclo: true } });
          data.id_ciclo = (maxCiclo._max.id_ciclo || 0) + 1;
        } else {
          data.id_ciclo = parseInt(data.id_ciclo);
        }
        result = await prisma.ciclo.create({
          data: {
            id_ciclo: data.id_ciclo,
            nom_ciclo: data.nom_ciclo,
            id_usuario: session.userId,
          }
        });
        break;
      case 'plan-estudio':
        if (!data.id_plan) data.id_plan = `PLAN-${crypto.randomUUID().substring(0, 8)}`;
        result = await prisma.plan_estudio.create({
          data: {
            id_plan: data.id_plan,
            nom_plan: data.nom_plan,
            id_carrera: data.id_carrera,
            id_usuario: session.userId,
          }
        });
        break;
      case 'tipo-sesion':
        if (!data.id_tipo_sesion) data.id_tipo_sesion = `SES-${crypto.randomUUID().substring(0, 8)}`;
        result = await prisma.tipo_sesion.create({
          data: {
            id_tipo_sesion: data.id_tipo_sesion,
            nom_tipo_sesion: data.nom_tipo_sesion,
            id_usuario: session.userId,
          }
        });
        break;
      default:
        return NextResponse.json({ error: 'Tipo de catálogo no válido' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, `POST catalogos`);
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ tipo: string }> }) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const data = await req.json();
    const params = await props.params;
    const tipo = params.tipo;

    let result;
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido para actualizar' }, { status: 400 });
    }

    switch (tipo) {
      case 'facultad':
        delete updateData.id_facultad;
        result = await prisma.facultad.update({
          where: { id_facultad: id, id_usuario: session.userId },
          data: updateData
        });
        break;
      case 'carrera':
        delete updateData.id_carrera;
        result = await prisma.carrera.update({
          where: { id_carrera: id, id_usuario: session.userId },
          data: updateData
        });
        break;
      case 'ciclo':
        delete updateData.id_ciclo;
        result = await prisma.ciclo.update({
          where: { id_ciclo: parseInt(id), id_usuario: session.userId },
          data: { nom_ciclo: updateData.nom_ciclo }
        });
        break;
      case 'plan-estudio':
        delete updateData.id_plan;
        const { id_carrera, nom_plan } = updateData;
        result = await prisma.plan_estudio.update({
          where: { id_plan: id, id_usuario: session.userId },
          data: {
            nom_plan,
            ...(id_carrera ? { carrera: { connect: { id_carrera } } } : {})
          }
        });
        break;
      case 'tipo-sesion':
        delete updateData.id_tipo_sesion;
        result = await prisma.tipo_sesion.update({
          where: { id_tipo_sesion: id, id_usuario: session.userId },
          data: updateData
        });
        break;
      default:
        return NextResponse.json({ error: 'Tipo de catálogo no válido' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, `PUT catalogos`);
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ tipo: string }> }) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const params = await props.params;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const tipo = params.tipo;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    let result;

    switch (tipo) {
      case 'facultad':
        result = await prisma.facultad.delete({ where: { id_facultad: id, id_usuario: session.userId } });
        break;
      case 'carrera':
        result = await prisma.carrera.delete({ where: { id_carrera: id, id_usuario: session.userId } });
        break;
      case 'ciclo':
        result = await prisma.ciclo.delete({ where: { id_ciclo: parseInt(id), id_usuario: session.userId } });
        break;
      case 'plan-estudio':
        result = await prisma.plan_estudio.delete({ where: { id_plan: id, id_usuario: session.userId } });
        break;
      case 'tipo-sesion':
        result = await prisma.tipo_sesion.delete({ where: { id_tipo_sesion: id, id_usuario: session.userId } });
        break;
      default:
        return NextResponse.json({ error: 'Tipo de catálogo no válido' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, `DELETE catalogos`);
  }
}
