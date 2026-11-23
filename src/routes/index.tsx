import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";

import { ReportFlow } from "@/components/report/ReportFlow";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Report an Emergency — RESQ" },
      {
        name: "description",
        content: "Report an emergency by text, voice or photo. No login needed Reports are reviewed by responders.",
      },
      { property: "og:title", content: "Report an Emergency — RESQ" },
      {
        property: "og:description",
        content: "Report an emergency by text, voice or photo. No login needed Reports are reviewed by responders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  return (
    <div className="flex-1">
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-3 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <header className="mb-8 space-y-3 border-b pb-6">
            <p className="label-caps">Public emergency report</p>
            <h1 className="text-3xl sm:text-4xl">Report an emergency</h1>
            <p className="max-w-prose text-muted-foreground">
              Tell us what is happening and where. No account is needed. Reports are reviewed by responders.
            </p>
            <p className="flex items-center gap-2 text-sm text-sev-high">
              <Phone aria-hidden className="size-4" /> If a life is at risk, call 112 first.
            </p>
          </header>
          <ReportFlow />
        </div>
        <aside className="space-y-6 text-sm lg:border-l lg:pl-8" aria-label="About reporting">
          <section className="space-y-3">
            <h2 className="label-caps">What happens after you report</h2>
            <ol className="space-y-3">
              <li><span className="font-medium text-foreground">Received.</span> <span className="text-muted-foreground">Your report is logged with a time and location.</span></li>
              <li><span className="font-medium text-foreground">Reviewed.</span> <span className="text-muted-foreground">Responders check the details and set a priority.</span></li>
              <li><span className="font-medium text-foreground">Dispatched.</span> <span className="text-muted-foreground">The nearest available team is sent if help is needed.</span></li>
            </ol>
          </section>
          <section className="space-y-2 border-t pt-6">
            <h2 className="label-caps">Privacy</h2>
            <p className="text-muted-foreground">Your contact number is only shown to authorized responders.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
