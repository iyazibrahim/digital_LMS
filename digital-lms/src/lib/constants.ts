export const ROLES = ["admin", "instructor", "evaluator", "student"] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: Role[] = ["admin", "instructor", "evaluator"];
export const PRIVILEGED_ROLES: Role[] = ["admin", "instructor"];

export const ACCESS_COOKIE = "dp_access";
export const REFRESH_COOKIE = "dp_refresh";

export const ACCESS_TTL = "7d";
export const REFRESH_TTL = "30d";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 7;
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export function hasRole(userRoles: string[] | undefined, allowed: Role[]): boolean {
  if (!userRoles?.length) return false;
  return userRoles.some((r) => allowed.includes(r as Role));
}

export function isStaff(roles: string[] | undefined): boolean {
  return hasRole(roles, STAFF_ROLES);
}
