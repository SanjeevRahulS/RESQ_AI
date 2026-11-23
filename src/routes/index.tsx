import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";

import { ReportFlow } from "@/components/report/ReportFlow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Report an Emergency — RESQ AI" },
      {
        name: "description",
        content: "Report an emergency by text, voice or photo. No login needed — responders see it on the live map instantly.",
      },
      { property: "og:title", content: "Report an Emergency — RESQ AI" },
      {
        property: "og:description",
        content: "Report an emergency by text, voice or photo. No login needed — responders see it instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  return (
    <div className="bg-command-grid flex-1">
      <div className="mx-auto w-full max-w-2xl px-3 py-6 sm:px-6 sm:py-10">
        <header className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Emergency report</p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Report an emergency</h1>
          <p className="text-muted-foreground">
            Tell us what's happening. No account needed. Our AI reads your report so responders can act faster.
          </p>
          <p className="flex items-center gap-2 text-sm text-sev-high">
            <Phone aria-hidden className="size-4" /> Life-threatening? Call 112 first.
          </p>
        </header>
        <ReportFlow />
      </div>
    </div>
  );
}
