import { DayBar } from "@/components/layout/day-bar";
import { Hero } from "@/features/hero/components/hero";
import { MapSection } from "@/features/map/components/map-section";
import { PosterWall } from "@/features/poster-wall/components/poster-wall";

export default function HomePage() {
  return (
    <main id="conteudo">
      <Hero />
      <DayBar />
      <MapSection />
      <PosterWall />
    </main>
  );
}
