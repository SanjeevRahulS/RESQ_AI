import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogIn, LogOut, Map, Siren } from "lucide-react";

import { useSessionUser } from "@/hooks/useSession";
import { useSignOut } from "@/hooks/useSignOut";

import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Report Emergency", short: "Report", icon: Siren },
  { to: "/map", label: "Live Map", short: "Map", icon: Map },
  { to: "/dashboard", label: "Command Dashboard", short: "Dashboard", icon: LayoutDashboard },
] as const;

export function AppHeader() {
  const user = useSessionUser();
  const signOut = useSignOut();
  const item =
    "flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex-row sm:gap-1.5 sm:px-2.5 sm:py-2 sm:text-sm";
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 rounded-md font-bold tracking-tight">
          <span className="grid size-8 place-items-center rounded-md bg-sev-critical text-background">
            <Siren aria-hidden className="size-4" />
          </span>
          <span className="whitespace-nowrap text-base sm:text-lg">
            RESQ <span className="text-primary">AI</span>
          </span>
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
                  activeProps={{ className: "bg-secondary text-foreground", "aria-current": "page" }}
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
