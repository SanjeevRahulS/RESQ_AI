const LAST_UPDATED = "2026-11-23 08:00 IST";

export function AppFooter() {
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-3 py-6 text-sm text-muted-foreground sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-md space-y-1">
          <p className="font-serif font-semibold text-foreground">RESQ</p>
          <p>Emergency reporting for Chennai. Reports are reviewed by responders.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <details>
                <summary className="cursor-pointer rounded-sm hover:text-foreground">About</summary>
                <p className="mt-2 max-w-xs">RESQ routes public emergency reports to authorized responders, who verify and dispatch help.</p>
              </details>
            </li>
            <li>
              <details>
                <summary className="cursor-pointer rounded-sm hover:text-foreground">Privacy</summary>
                <p className="mt-2 max-w-xs">Your contact number is only shown to authorized responders. Photos are stored privately.</p>
              </details>
            </li>
            <li>
              <details>
                <summary className="cursor-pointer rounded-sm hover:text-foreground">Contact</summary>
                <p className="mt-2 max-w-xs">For emergencies always call <a className="font-mono text-foreground" href="tel:112">112</a>.</p>
              </details>
            </li>
          </ul>
        </nav>
        <p className="label-caps">
          Last updated <time className="font-mono normal-case tracking-normal">{LAST_UPDATED}</time>
        </p>
      </div>
    </footer>
  );
}
