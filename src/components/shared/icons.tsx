import type { SVGProps } from "react";

/** Ícones específicos do protótipo, sem equivalente exato no Lucide. Mesmo traço (24px, 2px). */
function Icon(props: SVGProps<SVGSVGElement>) {
  return <svg className="ic" viewBox="0 0 24 24" aria-hidden="true" {...props} />;
}

export function ReelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="6.5" r="2" />
      <circle cx="12" cy="17.5" r="2" />
      <circle cx="6.5" cy="12" r="2" />
      <circle cx="17.5" cy="12" r="2" />
    </Icon>
  );
}

export function WalkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="13" cy="4.5" r="1.8" />
      <path d="m9 21 2.5-6.5L14 17v4M11.5 14.5 12.5 9l-3 1.5L8 14M12.5 9l2.5 3 3 1" />
    </Icon>
  );
}

export function MetroIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="6" y="3" width="12" height="14" rx="3" />
      <path d="M6 11h12M9 21l1.5-4M15 21l-1.5-4" />
      <circle cx="9.5" cy="14" r=".6" />
      <circle cx="14.5" cy="14" r=".6" />
    </Icon>
  );
}

export function TicketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3z" />
    </Icon>
  );
}

export function PinIcon({ dot = true, ...props }: SVGProps<SVGSVGElement> & { dot?: boolean }) {
  return (
    <Icon {...props}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      {dot && <circle cx="12" cy="10" r="2.4" />}
    </Icon>
  );
}

export function MapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5V4l-6 2.5z" />
      <path d="M9 4v13M15 6.5v13" />
    </Icon>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m5 12 5 5 9-10" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M15 18 9 12l6-6" />
    </Icon>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </Icon>
  );
}
