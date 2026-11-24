import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import {
  EMERGENCY_CONTACT_GROUPS,
  allEmergencyContacts,
} from "@/lib/contacts/emergency-contacts";

const numbers = allEmergencyContacts().map((contact) => contact.number);

describe("Public emergency contacts page", () => {
  it("opens for anyone: /emergency is not behind the staff gate", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/emergency");

    expect(matches.at(-1)?.routeId).toBe("/emergency");
    expect(matches.some((match) => match.routeId.startsWith("_authenticated"))).toBe(false);
  });

  it("lists the national and Chennai numbers people need first", () => {
    for (const needed of ["112", "108", "101", "100", "1913", "1091", "1098", "1930"]) {
      expect(numbers).toContain(needed);
    }
  });

  it("dials exactly the number it shows", () => {
    for (const contact of allEmergencyContacts()) {
      expect(contact.tel).toBe(contact.number.replace(/\s/g, ""));
      expect(contact.tel).toMatch(/^[0-9]+$/);
    }
  });

  it("keeps every contact group titled and non-empty", () => {
    expect(EMERGENCY_CONTACT_GROUPS.length).toBeGreaterThan(0);
    for (const group of EMERGENCY_CONTACT_GROUPS) {
      expect(group.title.length).toBeGreaterThan(0);
      expect(group.contacts.length).toBeGreaterThan(0);
    }
  });
});
