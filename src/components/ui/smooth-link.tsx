"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { smoothScrollToId } from "@/lib/smooth-scroll";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: `#${string}` };

/** Âncora interna com rolagem suave. Sem JavaScript (ou com Ctrl/Cmd/clique do meio) cai no salto padrão. */
export function SmoothLink({ href, onClick, children, ...rest }: Props) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    smoothScrollToId(href.slice(1));
  };
  return (
    <a href={href} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
