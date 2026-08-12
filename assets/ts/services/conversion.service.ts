import { EventDispatcher } from "@ribajs/events";

import { GoogleTagService } from "./google-tag.service";
import type { ConversionName } from "./google-tag.service";

/**
 * Erkennt die Handlungen, die als Erfolg zaehlen, und meldet sie weiter.
 *
 * Bewusst getrennt vom GoogleTagService: der weiss, WIE gemeldet wird, dieser
 * Dienst weiss, WAS zaehlt. Kommt eine weitere Messstelle dazu (oder faellt
 * Google weg), aendert sich nur eine der beiden Seiten.
 *
 * Drei Ausloeser, alle ueber genau einen Listener am document — das Theme
 * tauscht bei jedem Seitenwechsel den Inhalt aus, an einzelne Elemente
 * gebundene Listener waeren danach weg:
 *
 * - Kontaktformular erfolgreich abgeschickt
 * - Klick auf die Telefonnummer
 * - Klick auf die E-Mail-Adresse
 */
export class ConversionService {
  protected static instance: ConversionService | null = null;

  protected events = new EventDispatcher("main");

  /**
   * Bereits gemeldete Conversions dieses Seitenaufrufs.
   *
   * Die Telefonnummer steht mehrfach auf jeder Seite; drei Klicks auf
   * dieselbe Nummer sind ein Interessent, nicht drei. Zuruecksetzen beim
   * Seitenwechsel.
   */
  protected reported = new Set<ConversionName>();

  protected constructor() {
    // Beide in der CAPTURE-Phase:
    //
    // - submit-success steigt gar nicht auf (bubbles: false). Die Capture-Phase
    //   laeuft aber auch bei nicht aufsteigenden Ereignissen von der Wurzel zum
    //   Ziel.
    // - Klicks: Telefon- und E-Mail-Links im Fusszeilenmenue tragen den
    //   rv-route-Binder des Routers, der bei externen Zielen (tel:, mailto:)
    //   stopPropagation() ruft und selbst navigiert. In der Bubble-Phase kaemen
    //   genau diese Klicks hier nie an — ausgerechnet die aus dem Menue, das
    //   auf jeder Seite steht.
    //
    // Hier wird nur mitgehoert, nicht eingegriffen: kein preventDefault, kein
    // stopPropagation. Der Link soll ganz normal funktionieren.
    document.addEventListener("click", this.onClick, true);
    document.addEventListener("submit-success", this.onSubmitSuccess, true);
    this.events.on("newPageReady", this.onPageChange, this);
  }

  public static setInstance(): ConversionService {
    if (!this.instance) {
      this.instance = new ConversionService();
    }
    return this.instance;
  }

  public static getInstance(): ConversionService | null {
    return this.instance;
  }

  protected onPageChange(): void {
    this.reported.clear();
  }

  protected onSubmitSuccess = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    // Nur Formulare, die sich selbst als Conversion ausweisen — die
    // PDF-Formulare des Themes sind ausdruecklich keine.
    const name = target
      ?.closest?.("[data-conversion]")
      ?.getAttribute("data-conversion");
    if (name === "contact") {
      this.report("contact");
    }
  };

  protected onClick = (event: MouseEvent): void => {
    const link = (event.target as HTMLElement | null)?.closest?.("a");
    const href = link?.getAttribute("href") || "";

    if (href.startsWith("tel:")) {
      this.report("phone");
    } else if (href.startsWith("mailto:")) {
      this.report("email");
    }
  };

  protected report(name: ConversionName): void {
    if (this.reported.has(name)) {
      return;
    }
    this.reported.add(name);
    GoogleTagService.getInstance()?.trackConversion(name);
  }
}
