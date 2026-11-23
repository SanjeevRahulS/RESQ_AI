import { Link } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function TrackingCodeCard({ code }: { code: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Tracking code copied");
    } catch {
      toast.error("Couldn't copy. Please write the code down.");
    }
  };
  return (
    <section aria-labelledby="tracking-heading" className="w-full rounded-md border bg-background p-5">
      <h2 id="tracking-heading" className="label-caps">Your tracking code</h2>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <p className="font-mono text-3xl font-medium tracking-[0.12em] sm:text-4xl" aria-live="polite">
          {code}
        </p>
        <Button type="button" variant="outline" onClick={() => void copy()} aria-label={`Copy tracking code ${code}`}>
          <Copy aria-hidden className="size-4" /> Copy
        </Button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Keep this code to check progress on the{" "}
        <Link to="/track" search={{ code }} className="text-foreground underline underline-offset-2">
          Track a report
        </Link>{" "}
        page.
      </p>
    </section>
  );
}
