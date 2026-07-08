import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function getSecret(): string {
  return process.env.SESSION_SECRET || 'dev-secret-not-for-production';
}

export interface SessionPayload {
  userId: string;
  exp: number;
}

export function createSessionToken(userId: string): string {
  const payload: SessionPayload = { userId, exp: Date.now() + SESSION_MAX_AGE_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', getSecret()).update(encoded).digest('hex');
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;
    const expected = crypto.createHmac('sha256', getSecret()).update(encoded).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const payload: SessionPayload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest | Request): SessionPayload | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const token = match.substring(`${SESSION_COOKIE}=`.length);
  return verifySessionToken(token);
}

export function setSessionCookie(response: NextResponse, userId: string): void {
  const token = createSessionToken(userId);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS / 1000,
    path: '/',
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export class AuthError extends Error {
  constructor(message = 'No autorizado') {
    super(message);
    this.name = 'AuthError';
  }
}

export function handleApiError(error: unknown, context?: string): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: 'Formato de datos inválido' }, { status: 400 });
  }
  const tag = context ? `[${context}] ` : '';
  console.error(`${tag}API Error:`, error);
  const message = error instanceof Error ? error.message : 'Error interno del servidor';
  return NextResponse.json({ error: message }, { status: 500 });
}
