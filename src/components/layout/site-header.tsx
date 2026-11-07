import { ReelIcon } from "@/components/shared/icons";
import { SmoothLink } from "@/components/ui/smooth-link";

const LINKS: { href: `#${string}`; label: string }[] = [
  { href: "#mapa", label: "Mapa" },
  { href: "#cartaz", label: "Em cartaz" },
  { href: "#sessoes", label: "Sessões" },
];

export function SiteHeader() {
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <SmoothLink className="logo" href="#topo" aria-label="Sessão de Rua, início">
          <span className="logo-mark" aria-hidden="true">
            <ReelIcon />
          </span>
          <span className="logo-txt">
            <b>Sessão de Rua</b>
          </span>
        </SmoothLink>
        <nav className="nav-links" aria-label="Principal">
          {LINKS.map((l) => (
            <SmoothLink key={l.href} href={l.href}>
              {l.label}
            </SmoothLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
