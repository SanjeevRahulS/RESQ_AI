import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Phone, Search, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  EMERGENCY_CONTACT_GROUPS,
  EMERGENCY_CONTACT_SOURCES,
  EMERGENCY_CONTACTS_CHECKED_ON,
} from "@/lib/contacts/emergency-contacts";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency Contacts — RESQ" },
      {
        name: "description",
        content:
          "Real emergency phone numbers for Chennai and Tamil Nadu: 112, 108, 101, flood rescue and more. No sign-in needed.",
      },
      { property: "og:title", content: "Emergency Contacts — RESQ" },
      {
        property: "og:description",
        content:
          "Tap-to-call emergency numbers for Chennai, plus a way to track a report you already sent.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmergencyContactsPage,
});

function EmergencyContactsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-3 py-8 sm:px-6 sm:py-12">
      <header className="mb-8 space-y-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-md border bg-surface">
            <Shield aria-hidden className="size-6 fill-primary text-primary" />
          </span>
          <div className="min-w-0">
            <p className="label-caps">RESQ · Public emergency information</p>
            <h1 className="text-3xl sm:text-4xl">Emergency contacts</h1>
          </div>
        </div>

        <p className="max-w-prose text-muted-foreground">
          Phone numbers you can call right now from Chennai and Tamil Nadu. Tap a number to dial it.
          This page is open to everyone — no account, no sign-in.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="lg">
            <a href="tel:112">
              <Phone aria-hidden className="size-4" /> Call 112 now
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/track">
              <Search aria-hidden className="size-4" /> Track a report
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/">
              <FileText aria-hidden className="size-4" /> Report an emergency
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        {EMERGENCY_CONTACT_GROUPS.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`contact-group-${group.id}`}
            className="rounded-md border bg-surface p-4"
          >
            <h2 id={`contact-group-${group.id}`} className="label-caps">
              {group.title}
            </h2>
            {group.note && (
              <p className="mt-1.5 text-xs text-muted-foreground">{group.note}</p>
            )}
            <ul className="mt-2 divide-y divide-border">
              {group.contacts.map((contact) => (
                <li key={contact.tel}>
                  <a
                    href={`tel:${contact.tel}`}
                    className="-mx-2 flex items-baseline gap-2.5 rounded-sm px-2 py-2.5 hover:bg-accent"
                  >
                    <Phone
                      aria-hidden
                      className="size-3.5 shrink-0 translate-y-0.5 text-primary"
                    />
                    <span className="min-w-0">
                      <span className="block text-lg font-semibold leading-tight">
                        {contact.number}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {contact.name} · {contact.service}
                      </span>
                      {contact.note && (
                        <span className="block text-xs text-muted-foreground">
                          {contact.note}
                        </span>
                      )}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-8 space-y-3 border-t pt-6 text-sm" aria-labelledby="after-report-heading">
        <h2 id="after-report-heading" className="label-caps">
          If you already sent a report
        </h2>
        <p className="max-w-prose text-muted-foreground">
          You were given a tracking code like RQ-7K3M9. Enter it on the{" "}
          <Link to="/track" className="underline underline-offset-2 hover:text-foreground">
            Track a report
          </Link>{" "}
          page to see the status, the last update time and the general area. Contact details and
          photos are never shown there.
        </p>
      </section>

      <section className="mt-6 border-t pt-4 text-xs text-muted-foreground" aria-labelledby="sources-heading">
        <h2 id="sources-heading" className="label-caps">
          Numbers checked {EMERGENCY_CONTACTS_CHECKED_ON} against
        </h2>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {EMERGENCY_CONTACT_SOURCES.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2">
          Helplines change from time to time. If a number does not answer, call 112.
        </p>
      </section>
    </div>
  );
}
