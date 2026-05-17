import { ActorsSection } from "@/components/landing/actors-section";
import { CascadesSection } from "@/components/landing/cascades-section";
import { CtaSection } from "@/components/landing/cta-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { MoonshotSection } from "@/components/landing/moonshot-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { SiteHeader } from "@/components/landing/site-header";
export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-base text-text-primary">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <HeroSection />
        <ProblemSection />
        <CascadesSection />
        <ActorsSection />
        <HowItWorksSection />
        <MoonshotSection />
        <CtaSection />
      </main>
    </div>
  );
}
