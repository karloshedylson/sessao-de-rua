import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ExplorerProvider } from "@/features/explorer/components/explorer-provider";
import { FilmDialog } from "@/features/film-detail/components/film-dialog";
import { getScheduleData } from "@/services/sessions";

/**
 * Moldura das páginas do site (início e sessões). O provedor fica aqui, e não em cada página, para o estado
 * (cidade, dia, filme e cinema escolhidos) continuar o mesmo quando a pessoa navega entre elas.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
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
        {children}
        <SiteFooter />
        <FilmDialog />
      </ExplorerProvider>
    </div>
  );
}
