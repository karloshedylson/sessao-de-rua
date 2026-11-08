import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const TITLE = "Sessão de Rua - buscando filmes em cinemas de rua do Brasil";
const DESCRIPTION =
  "Programação dos cinemas de rua de São Paulo e do Recife num só lugar: mapa, filmes em cartaz e horários de cada sala.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#0E0C0C" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${archivo.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
