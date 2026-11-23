import { describe, expect, it } from "vitest";

import { matchesFilters, DEFAULT_FILTERS } from "@/lib/incidents/filters";
import {
  compareQueue,
  decideDuplicate,
  findDuplicateCandidates,
  haversineMeters,
  raiseSeverity,
  shouldEscalate,
} from "@/lib/incidents/rules";
import { computeStats } from "@/lib/incidents/stats";

const now = new Date("2026-11-22T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();
const base = { incident_type: "flood", latitude: 13.0, longitude: 80.2, status: "new", duplicate_of: null };

describe("duplicate candidates", () => {
  const report = { ...base, id: "r", created_at: hoursAgo(0) };

  it("includes a same-type incident within 300 m from the last 6 hours", () => {
    const near = { ...base, id: "a", latitude: 13.0018, created_at: hoursAgo(1) }; // ~200 m
    expect(findDuplicateCandidates(report, [near], now).map((c) => c.id)).toEqual(["a"]);
  });

  it("excludes incidents further than 300 m", () => {
    const far = { ...base, id: "b", latitude: 13.0036, created_at: hoursAgo(1) }; // ~400 m
    expect(findDuplicateCandidates(report, [far], now)).toHaveLength(0);
  });

  it("excludes a different incident type", () => {
    const fire = { ...base, id: "c", incident_type: "fire", created_at: hoursAgo(1) };
    expect(findDuplicateCandidates(report, [fire], now)).toHaveLength(0);
  });

  it("excludes incidents older than 6 hours and resolved ones", () => {
    const old = { ...base, id: "d", created_at: hoursAgo(7) };
    const resolved = { ...base, id: "e", status: "resolved", created_at: hoursAgo(1) };
    expect(findDuplicateCandidates(report, [old, resolved], now)).toHaveLength(0);
  });

  it("measures distance with Haversine", () => {
    expect(Math.round(haversineMeters({ latitude: 13, longitude: 80.2 }, { latitude: 13.001, longitude: 80.2 }))).toBe(111);
  });
});

describe("duplicate decision", () => {
  it("links at similarity 0.75 or more", () => {
    expect(decideDuplicate({ is_duplicate: true, similarity: 0.75 })).toBe("link");
  });
  it("sends 0.5 to under 0.75 to review", () => {
    expect(decideDuplicate({ is_duplicate: true, similarity: 0.6 })).toBe("review");
  });
  it("treats below 0.5 as new", () => {
    expect(decideDuplicate({ is_duplicate: true, similarity: 0.49 })).toBe("new");
  });
  it("never auto-links when the AI is uncertain", () => {
    expect(decideDuplicate({ is_duplicate: false, similarity: 0.9 })).toBe("review");
  });
});

describe("escalation", () => {
  it("escalates when the report count reaches 3", () => {
    expect(shouldEscalate(2, 3)).toBe(true);
    expect(shouldEscalate(3, 4)).toBe(false);
  });
  it("raises severity one level, capped at critical", () => {
    expect(raiseSeverity("medium")).toBe("high");
    expect(raiseSeverity("critical")).toBe("critical");
  });
});

describe("dashboard", () => {
  it("sorts the queue by severity, then oldest first", () => {
    const rows = [
      { id: "low", severity: "low" as const, created_at: hoursAgo(5) },
      { id: "crit-new", severity: "critical" as const, created_at: hoursAgo(1) },
      { id: "crit-old", severity: "critical" as const, created_at: hoursAgo(3) },
    ];
    expect(rows.sort(compareQueue).map((r) => r.id)).toEqual(["crit-old", "crit-new", "low"]);
  });

  it("counts active, critical and needs review, ignoring linked duplicates", () => {
    const row = (o: Partial<Parameters<typeof computeStats>[0][number]>) => ({
      severity: "low" as const,
      status: "new",
      duplicate_of: null,
      created_at: hoursAgo(4),
      resolved_at: null,
      ...o,
    });
    const stats = computeStats([
      row({ severity: "critical" }),
      row({ severity: "critical", duplicate_of: "x" }),
      row({ status: "needs_review" }),
      row({ status: "resolved", resolved_at: hoursAgo(2) }),
    ]);
    expect(stats.active).toBe(2);
    expect(stats.critical).toBe(1);
    expect(stats.needsReview).toBe(1);
    expect(stats.avgResolveHours).toBe(2);
  });

  it("filters by time range", () => {
    const item = { severity: "low" as const, incident_type: "fire" as const, status: "new" as const, created_at: hoursAgo(2) };
    expect(matchesFilters(item, { ...DEFAULT_FILTERS, range: "1h" }, now)).toBe(false);
    expect(matchesFilters(item, { ...DEFAULT_FILTERS, range: "6h" }, now)).toBe(true);
  });
});
