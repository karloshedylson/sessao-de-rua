"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { smoothScrollToId } from "@/lib/smooth-scroll";

const LINKS = [
  { href: "/#mapa", label: "Mapa" },
  { href: "/#cartaz", label: "Em cartaz" },
  { href: "/sessoes", label: "Sessões" },
] as const;

/** Clique simples com o botão principal (Ctrl/Cmd/clique do meio seguem o comportamento normal do link). */
const isPlainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/** Menu principal. Na página inicial os atalhos rolam suavemente; de outra página, levam à página e à seção. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="nav-links" aria-label="Principal">
      {LINKS.map((l) => {
        const anchor = l.href.startsWith("/#") ? l.href.slice(2) : null;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={l.href === pathname ? "page" : undefined}
            onClick={(e) => {
              if (anchor && pathname === "/" && isPlainClick(e)) {
                e.preventDefault();
                smoothScrollToId(anchor);
              }
            }}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Logo: volta ao início (e ao topo, com rolagem suave, se já estiver nele). */
export function LogoLink({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <Link
      className="logo"
      href="/"
      aria-label="Sessão de Rua, início"
      onClick={(e) => {
        if (pathname === "/" && isPlainClick(e)) {
          e.preventDefault();
          smoothScrollToId("topo");
        }
      }}
    >
      {children}
    </Link>
  );
}
