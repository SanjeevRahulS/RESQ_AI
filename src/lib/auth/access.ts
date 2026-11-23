/** Who may hold command-staff access, and the guards around changing it. */
export const STAFF_ROLES = ["admin", "responder"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  admin: "Admin",
  responder: "Responder",
};

/** Temporary password the admin sets when creating a staff account. */
export const MIN_STAFF_PASSWORD = 10;

export function isAcceptableStaffPassword(password: string): boolean {
  return password.length >= MIN_STAFF_PASSWORD;
}

/** The first admin can only be claimed while the command has no admin at all. */
export function canClaimFirstAdmin(adminCount: number): boolean {
  return adminCount === 0;
}

/** The command must never be left without an admin: the last admin cannot be removed or demoted. */
export function canChangeAdminRole(adminCount: number): boolean {
  return adminCount > 1;
}
