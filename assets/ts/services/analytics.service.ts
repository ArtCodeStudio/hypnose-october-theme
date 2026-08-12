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

/**
 * Google Analytics 4 — laedt erst nach Einwilligung.
 *
 * Wichtig: gtag.js wird NICHT vorab mit "consent default denied" eingebunden,
 * wie Google es vorschlaegt. Ohne Einwilligung darf hier gar kein Request an
 * Google gehen, auch kein cookieloser — das ist die Vorgabe der Kundin und die
 * sichere Lesart von § 25 TDDDG. Der Consent-Mode wird trotzdem gesetzt, damit
 * der Tag in einem definierten Zustand startet und Werbe-Signale aus bleiben.
 *
 * Seitenaufrufe meldet der Dienst selbst (send_page_view: false): das Theme
 * wechselt Seiten ueber den Riba-Router, ohne das Dokument neu zu laden — ein
 * automatischer page_view feuerte sonst nur beim allerersten Aufruf.
 */
export class AnalyticsService {
  protected static instance: AnalyticsService | null = null;

  /** Gleicher Dispatcher wie Router und Consent */
  protected events = new EventDispatcher("main");

  protected loaded = false;

  /** true, sobald in dieser Sitzung einmal geladen wurde */
  protected everLoaded = false;

  protected constructor(protected readonly measurementId: string) {
    ConsentService.events.on(
      ConsentService.EVENT_CHANGED,
      this.onConsentChanged,
      this
    );

    if (ConsentService.getInstance().isAllowed("statistics")) {
      void this.enable();
    }
  }

  public static setInstance(measurementId: string): AnalyticsService {
    if (!this.instance) {
      this.instance = new AnalyticsService(measurementId);
    }
    return this.instance;
  }

  public static getInstance(): AnalyticsService | null {
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

  protected async onConsentChanged(consent: Consent): Promise<void> {
    if (consent.statistics) {
      await this.enable();
    } else {
      this.disable();
    }
  }

  protected async enable(): Promise<void> {
    if (this.loaded) {
      return;
    }
    this.loaded = true;
    this.everLoaded = true;

    // Vor dem Laden in die dataLayer-Queue, damit gtag.js es beim Start sieht.
    this.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    });
    this.gtag("js", new Date());
    this.gtag("config", this.measurementId, {
      anonymize_ip: true,
      // Seitenaufrufe kommen aus onPage(), siehe Klassenkommentar
      send_page_view: false,
    });

    try {
      await loadScript(
        `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`,
        SCRIPT_ID,
        true,
        false
      );
    } catch (error) {
      // Adblocker oder Netzfehler: das ist kein Grund, die Seite zu stoeren.
      // loaded bleibt true, damit wir es nicht bei jedem Routenwechsel erneut
      // versuchen.
      console.warn(
        "[AnalyticsService] gtag.js konnte nicht geladen werden",
        error
      );
      return;
    }

    this.events.on("newPageReady", this.onPage, this);
    this.trackPageView(window.location.href);
  }

  /**
   * Einwilligung zurueckgenommen. Ein bereits geladenes gtag.js laesst sich
   * nicht wieder entfernen — daher Signal auf denied, Cookies loeschen und die
   * Seite neu laden, damit wirklich nichts von Google mehr aktiv ist.
   */
  protected disable(): void {
    this.events.off("newPageReady", this.onPage, this);

    if (!this.everLoaded) {
      this.loaded = false;
      return;
    }

    this.gtag("consent", "update", { analytics_storage: "denied" });
    this.deleteGoogleCookies();
    this.loaded = false;
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

  /** _ga und _ga_<ID> setzt Google auf der Registrable Domain */
  protected deleteGoogleCookies(): void {
    const host = window.location.hostname;
    const domains = [
      host,
      `.${host}`,
      `.${host.split(".").slice(-2).join(".")}`,
    ];

    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0]?.trim();
      if (!name || !/^_ga/.test(name)) {
        continue;
      }
      for (const domain of domains) {
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
      }
      document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  }
}
