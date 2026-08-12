import { EventDispatcher } from "@ribajs/events";

/**
 * Einwilligungs-Kategorien.
 *
 * "necessary" ist keine Kategorie im Speicher: technisch notwendige Cookies
 * brauchen nach TDDDG keine Einwilligung und lassen sich nicht abwaehlen.
 * Gespeichert wird nur, was einwilligungspflichtig ist.
 */
export interface Consent {
  statistics: boolean;
}

interface StoredConsent extends Consent {
  /** Schema-Version — erlaubt es, eine alte Einwilligung gezielt zu verwerfen */
  v: number;
  /** Zeitpunkt der Entscheidung, ISO-8601 — Nachweispflicht Art. 7 Abs. 1 DSGVO */
  ts: string;
}

const COOKIE_NAME = "hpn-consent";
const SCHEMA_VERSION = 1;

/** Sechs Monate. Danach wird erneut gefragt. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

/**
 * Haelt die Einwilligung des Besuchers und meldet Aenderungen.
 *
 * Bewusst ein eigener Service und keine Logik in der Banner-Komponente: den
 * Zustand fragen auch Dienste ab, die gar keine Oberflaeche haben (Analytics),
 * und der Banner ist nur eine von mehreren Stellen, die ihn setzen koennen
 * (Fusszeilen-Link "Cookie-Einstellungen").
 *
 * Der Vorgaenger hat die Entscheidung NIE gespeichert — "Okay" setzte ein
 * Cookie mit Ablaufdatum in der Vergangenheit, "Nein, Danke" schrieb erst,
 * nachdem es document.cookie unbrauchbar gemacht hatte. Der Banner erschien
 * dadurch bei jedem Seitenaufruf neu. Beides ist hier bereinigt.
 */
export class ConsentService {
  protected static instance: ConsentService | null = null;

  /** Gleicher Dispatcher wie der Router, damit Dienste an einer Stelle lauschen */
  public static readonly events = new EventDispatcher("main");

  /** Wird gefeuert, sobald sich die Einwilligung aendert: (neu, alt) */
  public static readonly EVENT_CHANGED = "hpn-consent:changed";

  /** Bittet den Banner, sich erneut zu zeigen */
  public static readonly EVENT_REOPEN = "hpn-consent:reopen";

  protected consent: Consent = { statistics: false };

  protected decided = false;

  protected constructor() {
    const stored = this.read();
    if (stored) {
      this.consent = { statistics: stored.statistics };
      this.decided = true;
    }
  }

  public static getInstance(): ConsentService {
    if (!this.instance) {
      this.instance = new ConsentService();
    }
    return this.instance;
  }

  /** Hat der Besucher schon entschieden? Nur dann bleibt der Banner weg. */
  public hasDecision(): boolean {
    return this.decided;
  }

  public get(): Consent {
    return { ...this.consent };
  }

  public isAllowed(category: keyof Consent): boolean {
    return this.consent[category] === true;
  }

  /** Alles annehmen */
  public acceptAll(): void {
    this.set({ statistics: true });
  }

  /** Nur technisch Notwendiges — die gleichwertige Ablehnung */
  public acceptNecessaryOnly(): void {
    this.set({ statistics: false });
  }

  /**
   * Entscheidung zuruecknehmen: Cookie loeschen und wieder fragen.
   * Die Dienste erfahren das ueber das Change-Event und raeumen selbst auf.
   */
  public revoke(): void {
    const previous = this.get();
    this.consent = { statistics: false };
    this.decided = false;
    document.cookie = `${COOKIE_NAME}=; Max-Age=0; path=/; SameSite=Lax`;
    ConsentService.events.trigger(
      ConsentService.EVENT_CHANGED,
      this.get(),
      previous
    );
    ConsentService.events.trigger(ConsentService.EVENT_REOPEN);
  }

  public set(consent: Consent): void {
    const previous = this.get();
    this.consent = { ...consent };
    this.decided = true;
    this.write();

    if (previous.statistics === this.consent.statistics) {
      return;
    }
    ConsentService.events.trigger(
      ConsentService.EVENT_CHANGED,
      this.get(),
      previous
    );
  }

  protected write(): void {
    const payload: StoredConsent = {
      v: SCHEMA_VERSION,
      ts: new Date().toISOString(),
      ...this.consent,
    };
    const value = encodeURIComponent(JSON.stringify(payload));
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${MAX_AGE_SECONDS}; path=/; SameSite=Lax${secure}`;
  }

  protected read(): StoredConsent | null {
    const raw = this.readCookie(COOKIE_NAME);
    if (!raw) {
      return null;
    }

    let parsed: Partial<StoredConsent>;
    try {
      parsed = JSON.parse(decodeURIComponent(raw));
    } catch {
      // Fremder oder beschaedigter Wert: wie "noch nicht gefragt" behandeln,
      // damit ein kaputtes Cookie nicht dauerhaft eine Einwilligung vortaeuscht.
      return null;
    }

    if (parsed?.v !== SCHEMA_VERSION) {
      return null;
    }

    return {
      v: SCHEMA_VERSION,
      ts: typeof parsed.ts === "string" ? parsed.ts : "",
      statistics: parsed.statistics === true,
    };
  }

  protected readCookie(name: string): string | null {
    const match = document.cookie.match(
      new RegExp(
        "(?:^|; )" + name.replace(/([.*+?^${}()|[\]\\])/g, "\\$1") + "=([^;]*)"
      )
    );
    return match ? match[1] : null;
  }
}
