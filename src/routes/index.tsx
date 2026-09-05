import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Briefcase, GraduationCap, MapPin, Target } from "lucide-react";
import { CITIES, JOBS } from "@/data/jobs";
import { Wordmark } from "@/components/pathly/AppShell";
import { HeroMapBackdrop } from "@/components/pathly/HeroMapBackdrop";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pathly — Australian opportunities, mapped around you" },
      {
        name: "description",
        content:
          "Discover jobs around you, see how strongly your skills match, and learn exactly what to study to unlock more Australian opportunities.",
      },
      { property: "og:title", content: "Pathly — Your career, mapped." },
      {
        property: "og:description",
        content:
          "An interactive demo map of Australian jobs with profile-based match scores, skill gap analysis and a career simulator.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: MapPin,
    title: "Opportunity map",
    copy: "Every curated Australian role, plotted on a map so you can see what's actually near you.",
  },
  {
    icon: Target,
    title: "Transparent match scores",
    copy: "Pathly shows exactly why a role is a strong match, a potential fit, or a skill gap for you.",
  },
  {
    icon: GraduationCap,
    title: "Skill gap simulator",
    copy: "Pick a skill you're considering learning and see how many more roles light up for you.",
  },
  {
    icon: Briefcase,
    title: "Application tracker",
    copy: "Keep every saved role and application organised in one board, from applied to offer.",
  },
];

const STEPS = [
  { title: "Discover", copy: "Explore a curated demo map of Australian opportunities." },
  { title: "Match", copy: "Pathly shows how your profile aligns with every role." },
  { title: "Grow", copy: "See the specific skills holding you back right now." },
  { title: "Unlock", copy: "Learn them and watch more opportunities light up." },
  { title: "Track", copy: "Keep the opportunities you are pursuing in one place." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 saturate-[1.15] opacity-80">
            <HeroMapBackdrop />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/55 to-background" />
          <div className="animate-bliss-sheen absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
        </div>

        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/50 backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
            <Wordmark />
            <div className="flex items-center gap-2">
              <Link
                to="/employer"
                className="hidden rounded-full px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground sm:block"
              >
                For employers
              </Link>
              <Link
                to="/auth"
                className="rounded-full border border-border/70 px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Button size="sm" className="rounded-full" asChild>
                <Link to="/auth">Get started</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-[1200px] px-4 pt-14 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
          <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
            Australian opportunities, mapped around you
          </p>
          <h1 className="text-balance-tight mt-3 max-w-3xl text-[42px] leading-[1.03] font-semibold sm:text-[64px]">
            Your career, mapped.
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-foreground/80 sm:text-[18px]">
            Sign in to see opportunities around you, understand where your skills stand, and learn
            exactly what to study to unlock more jobs.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Button size="lg" className="rounded-full px-6" asChild>
              <Link to="/auth">
                Get started free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" className="rounded-full px-6" asChild>
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-[12px] text-muted-foreground">
            <span>{JOBS.length} curated opportunities</span>
            <span>{CITIES.length} Australian cities</span>
            <span>Free to explore as a guest</span>
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-[1200px] px-4 pb-10 sm:px-6">
        <h2 className="text-[26px] font-semibold sm:text-[34px]">Why sign in?</h2>
        <p className="mt-2 max-w-2xl text-[14px] text-muted-foreground">
          Your profile is what powers every match score, so Pathly asks you to sign in (or continue
          as a guest) before showing the map and your personalised results.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]"
            >
              <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
                <f.icon className="size-4" />
              </span>
              <h3 className="mt-3 text-[15px] font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 sm:py-20">
        <h2 className="text-[26px] font-semibold sm:text-[34px]">How Pathly works</h2>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <article
              key={s.title}
              className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]"
            >
              <span className="text-[12px] font-medium text-muted-foreground">
                0{i + 1}
              </span>
              <h3 className="mt-2 text-[17px] font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] px-4 pb-20 sm:px-6">
        <div className="rounded-[32px] border border-border/70 bg-card p-8 shadow-[var(--shadow-soft)] sm:p-12">
          <h2 className="max-w-2xl text-[24px] leading-tight font-semibold sm:text-[32px]">
            Find out which single skill would unlock the most opportunities for you.
          </h2>
          <p className="mt-3 max-w-xl text-[14px] text-muted-foreground">
            That's the Career Gap simulator. Sign in, pick a skill you're considering, and Pathly
            re-scores every job on the map so you can see exactly what opens up.
          </p>
          <Button className="mt-6 rounded-full" asChild>
            <Link to="/auth">
              Try the Opportunity Simulator <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 text-[12px] text-muted-foreground sm:px-6">
          <Wordmark className="text-foreground" />
          <p>Australian opportunities, mapped around you. Prototype with sample data.</p>
        </div>
      </footer>
    </div>
  );
}
