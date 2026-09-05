import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Briefcase,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Map as MapIcon,
  Route as RouteIcon,
  User,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { usePathly } from "@/lib/pathly-store";
import { useAuth } from "@/lib/auth";
import { BackBar } from "@/components/pathly/BackBar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/career-gap", label: "Career Gap", icon: RouteIcon },
  { to: "/applications", label: "Applications", icon: Briefcase },
  { to: "/learning", label: "Learning", icon: GraduationCap },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="grid size-7 place-items-center rounded-[10px] bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path
            d="M6 19c0-4 3-5 6-6s5-2.5 5-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="6" cy="19" r="2" fill="currentColor" />
          <circle cx="17" cy="7" r="2" fill="currentColor" />
        </svg>
      </span>
      <span className="text-[17px] font-semibold tracking-tight">Pathly</span>
    </span>
  );
}

export function AppShell({
  children,
  bare = false,
}: {
  children: ReactNode;
  bare?: boolean;
}) {
  const { pathname } = useRouterState({ select: (s) => s.location });
  const { profile, gapAnalysis, profileReady } = usePathly();
  const { session, isGuest, loading, signOut, displayName } = useAuth();
  const navigate = useNavigate();
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  // Everything in the app needs either an account or guest mode.
  useEffect(() => {
    if (!loading && !session && !isGuest)
      navigate({ to: "/auth", replace: true });
  }, [loading, session, isGuest, navigate]);

  // New members walk through onboarding once before reaching the rest of the app.
  useEffect(() => {
    if (loading || isGuest || !session || !profileReady) return;
    if (!profile.onboardingCompleted && pathname !== "/onboarding") {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [
    loading,
    session,
    isGuest,
    profileReady,
    profile.onboardingCompleted,
    pathname,
    navigate,
  ]);

  if (!loading && !session && !isGuest) {
    return <div className="min-h-screen bg-background" />;
  }

  const awaitingMemberProfile =
    !isGuest && !!session && !profileReady && pathname !== "/onboarding";
  const awaitingOnboardingRedirect =
    !isGuest &&
    !!session &&
    profileReady &&
    !profile.onboardingCompleted &&
    pathname !== "/onboarding";
  if (awaitingMemberProfile || awaitingOnboardingRedirect) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-6 px-4 sm:px-6">
          <Link to="/dashboard" className="shrink-0">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              to="/dashboard"
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                pathname === "/dashboard" && "bg-accent text-foreground",
              )}
            >
              Dashboard
            </Link>
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  pathname === n.to && "bg-accent text-foreground",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to="/employer"
              className="hidden rounded-full border border-border px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Post a job
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="relative grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <Bell className="size-4" />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-strong" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 rounded-2xl">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex-col items-start gap-0.5">
                  <span className="text-[13px] font-medium">
                    {gapAnalysis.strongCount} strong matches near you
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Updated this morning
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex-col items-start gap-0.5">
                  <span className="text-[13px] font-medium">
                    {gapAnalysis.gaps[0]?.skill ?? "Power BI"} is your biggest
                    opportunity gap
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Open Career Gap to simulate
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="grid size-9 place-items-center rounded-full bg-secondary text-[12px] font-semibold text-secondary-foreground">
                {isGuest ? <User className="size-4" /> : initials}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium">
                    {displayName ?? profile.name}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {isGuest
                      ? "Guest session — not saved"
                      : (session?.user.email ?? "Signed in")}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="size-4" /> Your profile
                  </Link>
                </DropdownMenuItem>
                {isGuest ? (
                  <DropdownMenuItem asChild>
                    <Link to="/auth" className="cursor-pointer">
                      <LogIn className="size-4" /> Sign in / create account
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => {
                      await signOut();
                      navigate({ to: "/auth", replace: true });
                    }}
                  >
                    <LogOut className="size-4" /> Sign out
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {pathname !== "/dashboard" && !bare && (
        <div className="mx-auto w-full max-w-[1600px] px-4 pt-4 sm:px-6">
          <BackBar />
        </div>
      )}

      <main className={cn("flex-1", bare ? "" : "pb-24 md:pb-10")}>
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-5">
          {[
            { to: "/dashboard", label: "Home", icon: LayoutDashboard } as const,
            ...NAV.slice(0, 4),
          ].map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground transition-colors",
                pathname === n.to && "text-foreground",
              )}
            >
              <n.icon className="size-[18px]" />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
