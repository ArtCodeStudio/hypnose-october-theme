import { EventDispatcher } from "@ribajs/events";
import { loadScript } from "@ribajs/utils/src/dom";

import { ConsentService } from "./consent.service";
import type { Consent } from "./consent.service";

declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Status aus dem Router-Event newPageReady */
interface RouteStatus {
  url?: string;
}

const SCRIPT_ID = "gtag-js";

export interface GoogleTagIds {
  /** GA4 Measurement-ID, z. B. "G-XXXXXXXXXX" */
  measurementId: string | null;
  /** Google-Ads-Conversion-ID, z. B. "AW-XXXXXXXXX" */
  adsConversionId: string | null;
}

/**
 * Google-Tag (gtag.js) fuer Analytics und Google Ads — laedt erst nach
 * Einwilligung.
 *
 * Ein Dienst fuer beides, weil es EIN Skript ist: gtag.js bedient GA4 und
 * Google Ads ueber dieselbe Datei, nur mit je einem eigenen `config`. Zwei
 * Dienste wuerden es zweimal laden.
 *
 * Wichtig: gtag.js wird NICHT vorab mit "consent default denied" eingebunden,
 * wie Google es vorschlaegt. Ohne Einwilligung darf hier gar kein Request an
 * Google gehen, auch kein cookieloser — das ist die Vorgabe der Kundin und die
 * sichere Lesart von § 25 TDDDG. Der Consent-Mode wird trotzdem gesetzt: er
 * bildet die Kategorien einzeln ab, damit jemand, der nur Statistik erlaubt,
 * keine Werbe-Signale ausloest.
 *
 * Seitenaufrufe meldet der Dienst selbst (send_page_view: false): das Theme
 * wechselt Seiten ueber den Riba-Router, ohne das Dokument neu zu laden — ein
 * automatischer page_view feuerte sonst nur beim allerersten Aufruf.
 */
export class GoogleTagService {
  protected static instance: GoogleTagService | null = null;

  /** Gleicher Dispatcher wie Router und Consent */
  protected events = new EventDispatcher("main");

  protected scriptLoaded = false;

  protected gaConfigured = false;

  protected adsConfigured = false;

  protected pageViewsBound = false;

  protected constructor(protected readonly ids: GoogleTagIds) {
    ConsentService.events.on(
      ConsentService.EVENT_CHANGED,
      this.onConsentChanged,
      this
    );

    void this.apply(ConsentService.getInstance().get(), null);
  }

  public static setInstance(ids: GoogleTagIds): GoogleTagService {
    if (!this.instance) {
      this.instance = new GoogleTagService(ids);
    }
    return this.instance;
  }

  public static getInstance(): GoogleTagService | null {
    return this.instance;
  }

  /**
   * Reicht an den gtag-Stub durch. Der Stub ist woertlich der aus Googles
   * Snippet — er schiebt das arguments-Objekt in den dataLayer, und genau
   * diese Form erwartet gtag.js beim Abarbeiten der Warteschlange.
   */
  public gtag(...args: unknown[]): void {
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments);
      };
    }
    window.gtag(...args);
  }

  protected async onConsentChanged(
    consent: Consent,
    previous: Consent | null
  ): Promise<void> {
    await this.apply(consent, previous);
  }

  protected async apply(
    consent: Consent,
    previous: Consent | null
  ): Promise<void> {
    // Zurueckgenommen? Ein geladenes gtag.js laesst sich nicht entfernen —
    // also Signal auf denied, Cookies loeschen, Seite neu laden.
    const withdrawn =
      previous !== null &&
      ((previous.statistics && !consent.statistics) ||
        (previous.marketing && !consent.marketing));

    if (withdrawn && this.scriptLoaded) {
      this.withdraw(consent);
      return;
    }

    if (!consent.statistics && !consent.marketing) {
      return;
    }

    await this.ensureScript(consent);
    this.updateConsentState(consent);
    this.configureProducts(consent);
  }

  /** Laedt gtag.js einmalig, mit dem Consent-Zustand VOR dem Laden im dataLayer */
  protected async ensureScript(consent: Consent): Promise<void> {
    if (this.scriptLoaded) {
      return;
    }

    const tagId = this.ids.measurementId || this.ids.adsConversionId;
    if (!tagId) {
      return;
    }

    this.scriptLoaded = true;

    // Muss in der Queue stehen, bevor gtag.js sie abarbeitet.
    this.gtag("consent", "default", this.consentSignals(consent));
    this.gtag("js", new Date());

    try {
      await loadScript(
        `https://www.googletagmanager.com/gtag/js?id=${tagId}`,
        SCRIPT_ID,
        true,
        false
      );
    } catch (error) {
      // Adblocker oder Netzfehler: kein Grund, die Seite zu stoeren.
      // scriptLoaded bleibt true, damit wir es nicht bei jedem Klick erneut
      // versuchen.
      console.warn("[GoogleTag] gtag.js konnte nicht geladen werden", error);
    }
  }

  protected updateConsentState(consent: Consent): void {
    this.gtag("consent", "update", this.consentSignals(consent));
  }

  protected consentSignals(consent: Consent): Record<string, string> {
    const ads = consent.marketing ? "granted" : "denied";
    return {
      analytics_storage: consent.statistics ? "granted" : "denied",
      ad_storage: ads,
      ad_user_data: ads,
      ad_personalization: ads,
    };
  }

  /**
   * Je Produkt genau ein `config`. Getrennt, damit eine spaeter erteilte
   * Einwilligung das fehlende Produkt nachziehen kann, ohne das andere
   * ein zweites Mal zu konfigurieren.
   */
  protected configureProducts(consent: Consent): void {
    if (consent.statistics && this.ids.measurementId && !this.gaConfigured) {
      this.gaConfigured = true;
      this.gtag("config", this.ids.measurementId, {
        anonymize_ip: true,
        // Seitenaufrufe kommen aus onPage(), siehe Klassenkommentar
        send_page_view: false,
      });
    }

    if (consent.marketing && this.ids.adsConversionId && !this.adsConfigured) {
      this.adsConfigured = true;
      this.gtag("config", this.ids.adsConversionId);
    }

    if (consent.statistics && !this.pageViewsBound) {
      this.pageViewsBound = true;
      this.events.on("newPageReady", this.onPage, this);
      this.trackPageView(window.location.href);
    }
  }

  protected withdraw(consent: Consent): void {
    if (this.pageViewsBound) {
      this.events.off("newPageReady", this.onPage, this);
      this.pageViewsBound = false;
    }
    this.updateConsentState(consent);
    this.deleteGoogleCookies();
    window.location.reload();
  }

  /** Vom Riba-Router bei jedem Seitenwechsel gefeuert */
  protected onPage(_viewId: string, currentStatus: RouteStatus): void {
    if (!currentStatus?.url) {
      return;
    }
    this.trackPageView(new URL(currentStatus.url, window.location.origin).href);
  }

  protected trackPageView(href: string): void {
    const url = new URL(href, window.location.origin);
    this.gtag("event", "page_view", {
      page_location: url.href,
      page_path: url.pathname + url.search,
      page_title: document.title,
    });
  }

  /**
   * _ga / _ga_<ID> setzt Analytics, _gcl_* der Conversion-Linker von Ads.
   * Beide liegen auf der Registrable Domain, deshalb mehrere Domain-Varianten.
   */
  protected deleteGoogleCookies(): void {
    const host = window.location.hostname;
    const domains = [
      host,
      `.${host}`,
      `.${host.split(".").slice(-2).join(".")}`,
    ];

    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0]?.trim();
      if (!name || !/^(_ga|_gcl)/.test(name)) {
        continue;
      }
      for (const domain of domains) {
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
      }
      document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  }
}
