import { describe, expect, it } from "vitest";

import { activeAdvisories, isAdvisoryActive } from "@/lib/advisories/rules";
import { INCIDENT_TYPES } from "@/lib/incidents/constants";
import { EMERGENCY_NUMBERS, safetyStepsFor } from "@/lib/incidents/safety";
import {
  TRACKING_ALPHABET,
  generalArea,
  generateTrackingCode,
  normalizeTrackingCode,
  publicStatus,
} from "@/lib/incidents/tracking";

describe("tracking codes", () => {
  it("look like RQ- followed by five unambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateTrackingCode()).toMatch(/^RQ-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/);
    }
    expect(TRACKING_ALPHABET).not.toMatch(/[01OIL]/);
  });

  it("are built from the random values given", () => {
    expect(generateTrackingCode((arr) => arr.fill(0))).toBe("RQ-22222");
  });

  it("accept lowercase, spaces and a missing prefix", () => {
    expect(normalizeTrackingCode("rq-7k3m9")).toBe("RQ-7K3M9");
    expect(normalizeTrackingCode(" RQ 7K3M9 ")).toBe("RQ-7K3M9");
    expect(normalizeTrackingCode("7K3M9")).toBe("RQ-7K3M9");
  });

  it("reject codes of the wrong length or with ambiguous characters", () => {
    expect(normalizeTrackingCode("RQ-7K3M")).toBeNull();
    expect(normalizeTrackingCode("RQ-7K3M90")).toBeNull();
    expect(normalizeTrackingCode("RQ-OK3M9")).toBeNull();
    expect(normalizeTrackingCode("")).toBeNull();
  });
});

describe("public report status", () => {
  it("shows only received, verified, dispatched or resolved", () => {
    expect(publicStatus("new")).toBe("received");
    expect(publicStatus("needs_review")).toBe("received");
    expect(publicStatus("verified")).toBe("verified");
    expect(publicStatus("dispatched")).toBe("dispatched");
    expect(publicStatus("resolved")).toBe("resolved");
  });
});

describe("general area", () => {
  it("drops house and street numbers and keeps the neighbourhood", () => {
    expect(generalArea("12th Street, Adyar, Chennai", 13.0, 80.25)).toBe("Adyar, Chennai");
    expect(generalArea("Flat 4B, 22 Lake View Road, Velachery, Chennai 600042", null, null)).toBe("Velachery");
  });

  it("falls back to coordinates rounded to about 1 km", () => {
    expect(generalArea(null, 13.04751, 80.23972)).toBe("Near 13.05, 80.24");
    expect(generalArea("221", 13.04751, 80.23972)).toBe("Near 13.05, 80.24");
  });

  it("is empty when there is no address or location", () => {
    expect(generalArea(null, null, null)).toBeNull();
  });
});

describe("safety guidance", () => {
  it("has a short checklist for every incident type", () => {
    for (const type of INCIDENT_TYPES) {
      const steps = safetyStepsFor(type);
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps.length).toBeLessThanOrEqual(5);
    }
  });

  it("uses the general checklist when the type is unknown", () => {
    expect(safetyStepsFor(null)).toEqual(safetyStepsFor("other"));
  });

  it("links 112, 108 and 101", () => {
    expect(EMERGENCY_NUMBERS.map((n) => n.number)).toEqual(["112", "108", "101"]);
  });
});

describe("advisories", () => {
  const now = new Date("2026-11-23T10:00:00Z");

  it("stay active with no expiry, or until the expiry time", () => {
    expect(isAdvisoryActive({ expires_at: null }, now)).toBe(true);
    expect(isAdvisoryActive({ expires_at: "2026-11-23T10:00:01Z" }, now)).toBe(true);
    expect(isAdvisoryActive({ expires_at: "2026-11-23T10:00:00Z" }, now)).toBe(false);
    expect(isAdvisoryActive({ expires_at: "2026-11-22T10:00:00Z" }, now)).toBe(false);
  });

  it("show expired ones never, most severe first", () => {
    const list = [
      { id: "a", severity: "low" as const, created_at: "2026-11-23T09:00:00Z", expires_at: null },
      { id: "b", severity: "critical" as const, created_at: "2026-11-23T08:00:00Z", expires_at: null },
      { id: "c", severity: "critical" as const, created_at: "2026-11-23T09:30:00Z", expires_at: "2026-11-23T09:59:00Z" },
    ];
    expect(activeAdvisories(list, now).map((a) => a.id)).toEqual(["b", "a"]);
  });
});
