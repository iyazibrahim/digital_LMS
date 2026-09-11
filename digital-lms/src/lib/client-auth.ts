"use client";

/**
 * Cookie-only client auth helpers.
 * JWTs live in httpOnly cookies set by the server — never sessionStorage / document.cookie.
 */

/** No-op kept for call sites that previously cleared JS-readable token copies. */
export function clearAuthTokens() {
  /* tokens are httpOnly cookies cleared by /api/auth/logout */
}

/** fetch() that always sends cookies (httpOnly session). */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    credentials: "include",
    cache: init.cache || "no-store",
  });
}
