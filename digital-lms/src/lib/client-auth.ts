"use client";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
} from "@/lib/constants";

const SS_ACCESS = "dp_access";
const SS_REFRESH = "dp_refresh";

/** Persist tokens so API calls work even when Set-Cookie is stripped by the proxy. */
export function persistAuthTokens(access: string, refresh: string) {
  try {
    sessionStorage.setItem(SS_ACCESS, access);
    sessionStorage.setItem(SS_REFRESH, refresh);
  } catch {
    /* private mode */
  }

  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  // Non-httpOnly fallback cookies — readable by document + sent on navigations/fetch
  document.cookie = `${ACCESS_COOKIE}=${access}; Path=/; Max-Age=${ACCESS_MAX_AGE}; SameSite=Lax${secure}`;
  document.cookie = `${REFRESH_COOKIE}=${refresh}; Path=/; Max-Age=${REFRESH_MAX_AGE}; SameSite=Lax${secure}`;
}

export function clearAuthTokens() {
  try {
    sessionStorage.removeItem(SS_ACCESS);
    sessionStorage.removeItem(SS_REFRESH);
  } catch {
    /* ignore */
  }
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ACCESS_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  document.cookie = `${REFRESH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem(SS_ACCESS);
  } catch {
    return null;
  }
}

/** fetch() that always sends Bearer + cookies */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
    cache: init.cache || "no-store",
  });
}
