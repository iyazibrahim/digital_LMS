import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
  Role,
  hasRole,
} from "./constants";

const accessSecret = () =>
  new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me");
const refreshSecret = () =>
  new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me");

export interface AuthPayload {
  sub: string;
  email: string;
  name: string;
  roles: Role[];
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Plain JSON-safe claims — Mongoose arrays / ObjectIds cause DataCloneError in jose/Next. */
function jwtClaims(payload: AuthPayload) {
  return {
    sub: String(payload.sub),
    email: String(payload.email),
    name: String(payload.name),
    roles: Array.from(payload.roles || []).map(String),
  };
}

export async function signAccessToken(payload: AuthPayload) {
  return new SignJWT(jwtClaims(payload))
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret());
}

export async function signRefreshToken(payload: AuthPayload) {
  return new SignJWT(jwtClaims(payload))
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(refreshSecret());
}

export async function verifyAccessToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret());
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      roles: (payload.roles as Role[]) || [],
    };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret());
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      roles: (payload.roles as Role[]) || [],
    };
  } catch {
    return null;
  }
}

function cookieSecure() {
  if (process.env.COOKIE_SECURE === "1") return true;
  if (process.env.COOKIE_SECURE === "0") return false;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  return appUrl.startsWith("https://");
}

function cookieBase() {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax" as const,
    path: "/",
  };
}

export function setAuthCookies(res: NextResponse, access: string, refresh: string) {
  const base = cookieBase();
  res.cookies.set(ACCESS_COOKIE, access, { ...base, maxAge: ACCESS_MAX_AGE });
  res.cookies.set(REFRESH_COOKIE, refresh, { ...base, maxAge: REFRESH_MAX_AGE });
}

export function clearAuthCookies(res: NextResponse) {
  const base = cookieBase();
  res.cookies.set(ACCESS_COOKIE, "", { ...base, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...base, maxAge: 0 });
}

/** Safe relative redirect path from ?next= */
export function safeNextPath(next: string | null | undefined, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export async function getSession(): Promise<AuthPayload | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (access) {
    const payload = await verifyAccessToken(access);
    if (payload) return payload;
  }
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;
  return verifyRefreshToken(refresh);
}

export async function requireSession(allowed?: Role[]) {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }
  if (allowed && !hasRole(session.roles, allowed)) {
    throw new AuthError("Forbidden", 403);
  }
  return session;
}

export function getSessionFromRequest(req: NextRequest): Promise<AuthPayload | null> {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  if (access) return verifyAccessToken(access);
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refresh) return verifyRefreshToken(refresh);
  return Promise.resolve(null);
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function jsonError(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
