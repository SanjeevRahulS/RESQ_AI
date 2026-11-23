import { Link } from "@tanstack/react-router";
import { FileText, LayoutDashboard, LogIn, LogOut, Map, Phone, Search, Shield } from "lucide-react";

import { useSessionUser } from "@/hooks/useSession";
import { useSignOut } from "@/hooks/useSignOut";

import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Report Emergency", short: "Report", icon: FileText },
  { to: "/track", label: "Track a report", short: "Track", icon: Search },
  { to: "/map", label: "Live Map", short: "Map", icon: Map },
  { to: "/dashboard", label: "Command Dashboard", short: "Dashboard", icon: LayoutDashboard },
] as const;

export function AppHeader() {
  const user = useSessionUser();
  const signOut = useSignOut();
  const item =
    "flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex-row sm:gap-1.5 sm:px-2.5 sm:py-2 sm:text-sm";
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="border-b bg-surface">
        <p className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-2 px-3 py-1 text-xs text-muted-foreground sm:px-6">
          <Phone aria-hidden className="size-3 text-primary" />
          <span className="font-semibold text-foreground">Emergency?</span>
          <a href="tel:112" className="font-mono text-foreground underline-offset-2 hover:underline">Call 112</a>
          <span aria-hidden>·</span>
          <a href="tel:108" className="font-mono underline-offset-2 hover:underline">Ambulance 108</a>
          <span aria-hidden>·</span>
          <a href="tel:101" className="font-mono underline-offset-2 hover:underline">Fire 101</a>
        </p>
      </div>
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 rounded-md font-bold tracking-tight">
          <Shield aria-hidden className="size-5 fill-primary text-primary" />
          <span className="whitespace-nowrap font-serif text-lg font-semibold tracking-wide">RESQ</span>
        </Link>
        <nav aria-label="Main" className="ml-auto">
          <ul className="flex items-center gap-1">
            {NAV.map(({ to, label, short, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeOptions={{ exact: true }}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex-row sm:gap-1.5 sm:px-2.5 sm:py-2 sm:text-sm",
                  )}
                  activeProps={{ className: "bg-secondary text-foreground shadow-[inset_0_-2px_0_var(--color-primary)]", "aria-current": "page" }}
                >
                  <Icon aria-hidden className="size-4" />
                  <span className="hidden md:inline">{label}</span>
                  <span className="md:hidden">{short}</span>
                </Link>
              </li>
            ))}
            <li>
              {user ? (
                <button type="button" onClick={() => void signOut()} className={item} aria-label={`Sign out ${user.email ?? ""}`}>
                  <LogOut aria-hidden className="size-4" />
                  <span>Sign out</span>
                </button>
              ) : (
                <Link to="/auth" className={item}>
                  <LogIn aria-hidden className="size-4" />
                  <span>Staff</span>
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
