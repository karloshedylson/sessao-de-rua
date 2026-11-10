import { ReelIcon } from "@/components/shared/icons";
import { CitySwitch } from "./city-switch";
import { LogoLink, NavLinks } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <LogoLink>
          <span className="logo-mark" aria-hidden="true">
            <ReelIcon />
          </span>
          <span className="logo-txt">
            <b>Sessão de Rua</b>
          </span>
        </LogoLink>
        <NavLinks />
        <CitySwitch />
      </div>
    </header>
  );
}
