import { Component } from "@ribajs/core";

import { ConsentService } from "../../services/consent.service";

import template from "./hpn-cookies.component.html";

interface Scope {
  visible: boolean;
  acceptAll: HpnCookiesComponent["acceptAll"];
  acceptNecessaryOnly: HpnCookiesComponent["acceptNecessaryOnly"];
}

/**
 * Einwilligungsbanner.
 *
 * Die Komponente entscheidet nichts selbst, sie fragt und meldet — gehalten
 * wird der Zustand im ConsentService, damit ihn auch Dienste ohne Oberflaeche
 * lesen koennen.
 *
 * Sie bleibt im DOM und blendet sich nur aus (frueher: removeChild). Sonst
 * liesse sie sich ueber den Fusszeilen-Link nicht wieder oeffnen, ohne die
 * Seite neu zu laden.
 */
export class HpnCookiesComponent extends Component {
  public static tagName = "hpn-cookies";

  protected autobind = true;

  protected consent = ConsentService.getInstance();

  static get observedAttributes(): string[] {
    return [];
  }

  public scope: Scope = {
    visible: !this.consent.hasDecision(),
    acceptAll: this.acceptAll,
    acceptNecessaryOnly: this.acceptNecessaryOnly,
  };

  constructor() {
    super();
  }

  protected connectedCallback() {
    this.debug("connectedCallback");
    super.connectedCallback();
    this.init(HpnCookiesComponent.observedAttributes);
    ConsentService.events.on(ConsentService.EVENT_REOPEN, this.onReopen, this);
    document.addEventListener("click", this.onDocumentClick);
  }

  protected requiredAttributes(): string[] {
    return [];
  }

  protected disconnectedCallback(): void {
    ConsentService.events.off(ConsentService.EVENT_REOPEN, this.onReopen, this);
    document.removeEventListener("click", this.onDocumentClick);
    super.disconnectedCallback();
  }

  /**
   * Der Widerruf muss so einfach sein wie die Einwilligung (Art. 7 Abs. 3
   * DSGVO). Statt eine eigene Komponente fuer den Fusszeilen-Link zu bauen,
   * hoert die Komponente global mit: jeder Link auf
   * "#cookie-einstellungen" oeffnet den Banner erneut. So genuegt im Backend
   * ein ganz normaler Menueeintrag, ohne Theme-Aenderung.
   */
  protected onDocumentClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    const trigger = target?.closest?.(
      'a[href="#cookie-einstellungen"], [data-hpn-consent-settings]'
    );
    if (!trigger) {
      return;
    }
    event.preventDefault();
    this.consent.revoke();
  };

  protected template(): string | null {
    return template;
  }

  protected onReopen(): void {
    this.scope.visible = true;
  }

  protected acceptAll(): void {
    this.consent.acceptAll();
    this.scope.visible = false;
  }

  protected acceptNecessaryOnly(): void {
    this.consent.acceptNecessaryOnly();
    this.scope.visible = false;
  }
}
