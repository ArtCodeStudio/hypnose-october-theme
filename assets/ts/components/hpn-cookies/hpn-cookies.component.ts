import { Component } from "@ribajs/core";

import { ConsentService } from "../../services/consent.service";

import template from "./hpn-cookies.component.html";

interface Scope {
  visible: boolean;
  /** Detailansicht mit den einzelnen Kategorien */
  showSettings: boolean;
  /** Zustand der Schalter in der Detailansicht, per rv-checked zweiwegig */
  statistics: boolean;
  marketing: boolean;
  external: boolean;
  acceptAll: HpnCookiesComponent["acceptAll"];
  acceptNecessaryOnly: HpnCookiesComponent["acceptNecessaryOnly"];
  openSettings: HpnCookiesComponent["openSettings"];
  saveSelection: HpnCookiesComponent["saveSelection"];
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
 *
 * Ablehnen und Zustimmen stehen als gleich grosse Schaltflaechen nebeneinander:
 * eine versteckte oder wegformatierte Ablehnung macht die Einwilligung
 * unwirksam. "Einstellungen" fuehrt zu den einzelnen Kategorien, damit sich
 * Statistik, Werbung und eingebettete Inhalte getrennt waehlen lassen.
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
    showSettings: false,
    statistics: this.consent.isAllowed("statistics"),
    marketing: this.consent.isAllowed("marketing"),
    external: this.consent.isAllowed("external"),
    acceptAll: this.acceptAll,
    acceptNecessaryOnly: this.acceptNecessaryOnly,
    openSettings: this.openSettings,
    saveSelection: this.saveSelection,
  };

  constructor() {
    super();
  }

  protected connectedCallback() {
    this.debug("connectedCallback");
    super.connectedCallback();
    this.init(HpnCookiesComponent.observedAttributes);
    ConsentService.events.on(ConsentService.EVENT_REOPEN, this.onReopen, this);
    // Capture-Phase, siehe onDocumentClick
    document.addEventListener("click", this.onDocumentClick, true);
  }

  protected requiredAttributes(): string[] {
    return [];
  }

  protected disconnectedCallback(): void {
    ConsentService.events.off(ConsentService.EVENT_REOPEN, this.onReopen, this);
    document.removeEventListener("click", this.onDocumentClick, true);
    super.disconnectedCallback();
  }

  protected template(): string | null {
    return template;
  }

  /**
   * Der Widerruf muss so einfach sein wie die Einwilligung (Art. 7 Abs. 3
   * DSGVO). Statt eine eigene Komponente fuer den Fusszeilen-Link zu bauen,
   * hoert die Komponente global mit: jeder Link auf "#cookie-einstellungen"
   * oeffnet den Banner erneut. So genuegt im Backend ein ganz normaler
   * Menueeintrag, ohne Theme-Aenderung — und die Datenschutzerklaerung kann
   * ihn ebenfalls verlinken.
   *
   * CAPTURE-Phase, nicht Bubble: Menuelinks tragen den rv-route-Binder des
   * Routers, und der ruft bei einer bereits aktiven Route stopPropagation()
   * ("already on this site, do nothing"). Ein Link auf "#cookie-einstellungen"
   * zaehlt fuer ihn als aktive Route — in der Bubble-Phase kaeme der Klick hier
   * also nie an. Im Fusszeilenmenue genau so passiert.
   *
   * stopPropagation() dann auch von hier aus, damit der Router den Klick nicht
   * zusaetzlich als Navigation behandelt.
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
    event.stopPropagation();
    this.consent.revoke();
  };

  protected onReopen(): void {
    // Beim erneuten Oeffnen die Schalter auf den aktuellen Stand ziehen, sonst
    // zeigt die Detailansicht die Auswahl von vorhin.
    this.scope.statistics = this.consent.isAllowed("statistics");
    this.scope.marketing = this.consent.isAllowed("marketing");
    this.scope.external = this.consent.isAllowed("external");
    this.scope.showSettings = false;
    this.scope.visible = true;
  }

  protected openSettings(): void {
    this.scope.showSettings = true;
  }

  protected acceptAll(): void {
    this.consent.acceptAll();
    this.close();
  }

  protected acceptNecessaryOnly(): void {
    this.consent.acceptNecessaryOnly();
    this.close();
  }

  protected saveSelection(): void {
    this.consent.set({
      statistics: this.scope.statistics === true,
      marketing: this.scope.marketing === true,
      external: this.scope.external === true,
    });
    this.close();
  }

  protected close(): void {
    this.scope.showSettings = false;
    this.scope.visible = false;
  }
}
