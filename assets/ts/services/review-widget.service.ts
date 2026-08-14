import { loadScript } from "@ribajs/utils/src/dom";

import { ConsentService } from "./consent.service";
import type { Consent } from "./consent.service";

/**
 * Das jameda-Widget wird von docplanner ausgeliefert (jameda gehoert zur
 * DocPlanner-Gruppe). Frueher stand dieses Skript als Inline-<script> in
 * partials/jameda_widget_portrait.htm und _footer.htm und lud auf JEDER Seite,
 * unabhaengig von jeder Einwilligung.
 */
const SCRIPT_SRC = "https://platform.docplanner.com/js/widget.js";

/** Die id, die das Skript selbst vergeben haette — verhindert Doppelladen */
const SCRIPT_ID = "zl-widget-s";

/**
 * Liegt auf <html>, solange die Einwilligung fuer eingebettete Inhalte gilt.
 * Das Umschalten zwischen Widget und Platzhalter passiert allein in CSS
 * (_jameda-consent.scss).
 */
const ALLOWED_CLASS = "hpn-consent-external";

/** Klickziel im Platzhalter: erteilt die Einwilligung genau fuer diese Kategorie */
const ALLOW_SELECTOR = '[data-hpn-consent-allow="external"]';

/**
 * Laedt das Bewertungs-Widget erst nach Einwilligung.
 *
 * Bewusst ein Dienst und keine Komponente: das Widget steht an zwei Stellen im
 * Markup (ausklappbarer Reiter am Rand, Fusszeile auf schmalen Geraeten), das
 * Skript darf aber nur EINMAL geladen werden. Ein Dienst hat den Ueberblick,
 * eine Komponente kennt nur sich selbst.
 *
 * Warum kein Seiten-Reload beim Zustimmen: das Skript sucht sich seine Anker
 * (#zl-url) beim Ausfuehren selbst. Nachladen genuegt also — genau der Punkt,
 * um den es hier ging.
 *
 * Beim Widerruf dagegen wird neu geladen: ein einmal ausgefuehrtes Fremdskript
 * laesst sich nicht zurueckholen, es hat bereits einen iframe gesetzt, der
 * weiter mit docplanner spricht. Das Entfernen des sichtbaren Kastens waere
 * Kosmetik. Denselben Weg geht der GoogleTagService.
 */
export class ReviewWidgetService {
  protected static instance: ReviewWidgetService | null = null;

  protected scriptLoaded = false;

  protected constructor() {
    ConsentService.events.on(
      ConsentService.EVENT_CHANGED,
      this.onConsentChanged,
      this
    );

    // Der Platzhalter steht im Markup und wird nicht neu gerendert - deshalb
    // global mithoeren statt an jedem Knopf einzeln zu haengen. Bubble-Phase
    // genuegt: der Knopf traegt keinen rv-route-Binder, der den Klick vorher
    // abfangen wuerde (anders als die Menuelinks, siehe hpn-cookies).
    document.addEventListener("click", this.onDocumentClick);

    this.apply(ConsentService.getInstance().get(), null);
  }

  public static setInstance(): ReviewWidgetService {
    if (!this.instance) {
      this.instance = new ReviewWidgetService();
    }
    return this.instance;
  }

  public static getInstance(): ReviewWidgetService | null {
    return this.instance;
  }

  protected onDocumentClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null;
    if (!target?.closest?.(ALLOW_SELECTOR)) {
      return;
    }
    event.preventDefault();

    const consent = ConsentService.getInstance();
    // Nur diese eine Kategorie ergaenzen. Alles andere bleibt, wie es der
    // Besucher entschieden hat - ein Klick auf "Bewertungen anzeigen" ist
    // keine Zustimmung zu Statistik oder Werbung.
    consent.set({ ...consent.get(), external: true });
  };

  protected onConsentChanged(consent: Consent, previous: Consent | null): void {
    this.apply(consent, previous);
  }

  protected apply(consent: Consent, previous: Consent | null): void {
    const root = document.documentElement;

    if (!consent.external) {
      root.classList.remove(ALLOWED_CLASS);
      if (previous?.external && this.scriptLoaded) {
        location.reload();
      }
      return;
    }

    root.classList.add(ALLOWED_CLASS);

    if (this.scriptLoaded) {
      return;
    }
    this.scriptLoaded = true;
    void loadScript(SCRIPT_SRC, SCRIPT_ID, true);
  }
}
