import type { Metadata } from "next";
import { DayBar } from "@/components/layout/day-bar";
import { SessionsSection } from "@/features/sessions/components/sessions-section";

const TITLE = "Sessões - Sessão de Rua";
const DESCRIPTION = "Horários de todos os cinemas de rua, por dia: filtre por filme, bairro, horário e idioma.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, locale: "pt_BR", type: "website" },
};

export default function SessionsPage() {
  return (
    <main id="conteudo">
      <DayBar />
      <SessionsSection />
    </main>
  );
}
