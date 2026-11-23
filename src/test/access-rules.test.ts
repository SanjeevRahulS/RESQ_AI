import { describe, expect, it } from "vitest";

import {
  MIN_STAFF_PASSWORD,
  canChangeAdminRole,
  canClaimFirstAdmin,
  isAcceptableStaffPassword,
} from "@/lib/auth/access";

describe("first admin bootstrap", () => {
  it("allows the first admin only while no admin exists", () => {
    expect(canClaimFirstAdmin(0)).toBe(true);
    expect(canClaimFirstAdmin(1)).toBe(false);
    expect(canClaimFirstAdmin(7)).toBe(false);
  });
});

describe("keeping command access recoverable", () => {
  it("refuses to remove or demote the last admin", () => {
    expect(canChangeAdminRole(1)).toBe(false);
    expect(canChangeAdminRole(0)).toBe(false);
  });

  it("allows changes once another admin remains", () => {
    expect(canChangeAdminRole(2)).toBe(true);
  });
});

describe("temporary staff passwords", () => {
  it("rejects anything shorter than the minimum length", () => {
    expect(MIN_STAFF_PASSWORD).toBe(10);
    expect(isAcceptableStaffPassword("responder")).toBe(false);
  });

  it("accepts a password at the minimum length", () => {
    expect(isAcceptableStaffPassword("responder1")).toBe(true);
  });
});
