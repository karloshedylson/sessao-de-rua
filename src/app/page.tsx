import { DayBar } from "@/components/layout/day-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ExplorerProvider } from "@/features/explorer/components/explorer-provider";
import { Hero } from "@/features/hero/components/hero";
import { MapSection } from "@/features/map/components/map-section";
import { PosterWall } from "@/features/poster-wall/components/poster-wall";
import { SessionsSection } from "@/features/sessions/components/sessions-section";
import { getScheduleData } from "@/services/sessions";

export default async function HomePage() {
  const data = await getScheduleData();

  return (
    <div className="site">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      <ExplorerProvider data={data}>
        <SiteHeader />
        <main id="conteudo">
          <Hero />
          <DayBar />
          <MapSection />
          <PosterWall />
          <SessionsSection />
        </main>
        <SiteFooter />
      </ExplorerProvider>
    </div>
  );
}
