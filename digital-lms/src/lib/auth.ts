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
    .setExpirationTime("7d")
    .sign(accessSecret());
}

export async function signRefreshToken(payload: AuthPayload) {
  return new SignJWT(jwtClaims(payload))
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(refreshSecret());
}

export function normalizeRoles(roles: unknown): Role[] {
  if (Array.isArray(roles)) {
    return roles.map(String).filter(Boolean) as Role[];
  }
  if (typeof roles === "string" && roles) {
    return roles
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean) as Role[];
  }
  return [];
}

export async function verifyAccessToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret());
    return {
      sub: String(payload.sub),
      email: String(payload.email || ""),
      name: String(payload.name || ""),
      roles: normalizeRoles(payload.roles),
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
      email: String(payload.email || ""),
      name: String(payload.name || ""),
      roles: normalizeRoles(payload.roles),
    };
  } catch {
    return null;
  }
}

/** Prefer COOKIE_SECURE env; default secure in production behind HTTPS public URL. */
export function cookieSecure(req?: NextRequest | null) {
  if (process.env.COOKIE_SECURE === "1") return true;
  if (process.env.COOKIE_SECURE === "0") return false;
  const proto = req?.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (proto === "https") return true;
  if (proto === "http") return false;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  if (appUrl.startsWith("https://")) return true;
  return process.env.NODE_ENV === "production";
}

export function setAuthCookies(
  res: NextResponse,
  access: string,
  refresh: string,
  req?: NextRequest | null
) {
  const secure = cookieSecure(req);
  const base = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
  };
  res.cookies.set(ACCESS_COOKIE, access, { ...base, maxAge: ACCESS_MAX_AGE });
  res.cookies.set(REFRESH_COOKIE, refresh, { ...base, maxAge: REFRESH_MAX_AGE });
  res.headers.set("Cache-Control", "no-store");
}

/** Clear both secure and non-secure variants (avoids sticky mismatched cookies). */
export function clearAuthCookies(res: NextResponse) {
  for (const secure of [true, false]) {
    const base = {
      httpOnly: true,
      secure,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    };
    res.cookies.set(ACCESS_COOKIE, "", base);
    res.cookies.set(REFRESH_COOKIE, "", base);
  }
  res.headers.set("Cache-Control", "no-store");
}

export function safeNextPath(next: string | null | undefined, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

async function hydratePayload(payload: AuthPayload): Promise<AuthPayload> {
  if (payload.roles.length && payload.name) return payload;
  try {
    const { connectDB } = await import("@/lib/db");
    const { User } = await import("@/models/User");
    await connectDB();
    const user = await User.findById(payload.sub).select("roles name email isActive").lean();
    if (!user) return payload;
    if (user.isActive === false) {
      return payload; // caller may still treat as logged-in; requireSession can check later
    }
    return {
      sub: String(user._id),
      email: String(user.email),
      name: String(user.name),
      roles: normalizeRoles(user.roles),
    };
  } catch (err) {
    console.error("[hydratePayload]", err);
    return payload;
  }
}

export async function resolveSessionFromTokenPair(
  access?: string,
  refresh?: string
): Promise<AuthPayload | null> {
  let payload: AuthPayload | null = null;
  if (access) payload = await verifyAccessToken(access);
  if (!payload && refresh) payload = await verifyRefreshToken(refresh);
  if (!payload) return null;
  return hydratePayload(payload);
}

export async function getSession(): Promise<AuthPayload | null> {
  const jar = await cookies();
  return resolveSessionFromTokenPair(
    jar.get(ACCESS_COOKIE)?.value,
    jar.get(REFRESH_COOKIE)?.value
  );
}

export async function getSessionFromRequest(req: NextRequest): Promise<AuthPayload | null> {
  return resolveSessionFromTokenPair(
    req.cookies.get(ACCESS_COOKIE)?.value,
    req.cookies.get(REFRESH_COOKIE)?.value
  );
}

export async function attachSessionCookies(
  res: NextResponse,
  payload: AuthPayload,
  req?: NextRequest | null
) {
  const access = await signAccessToken(payload);
  const refresh = await signRefreshToken(payload);
  setAuthCookies(res, access, refresh, req);
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
