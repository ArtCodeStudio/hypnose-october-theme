import { Component } from "@ribajs/core";

import template from "./hpn-cookies.component.html";

interface Scope {
  denyCookies: HpnCookiesComponent["denyCookies"];
  acceptCookies: HpnCookiesComponent["acceptCookies"];
}

export class HpnCookiesComponent extends Component {
  public static tagName = "hpn-cookies";

  protected autobind = true;

  static get observedAttributes(): string[] {
    return [];
  }

  public scope: Scope = {
    denyCookies: this.denyCookies,
    acceptCookies: this.acceptCookies,
  };

  constructor() {
    super();
  }

  protected connectedCallback() {
    this.debug("connectedCallback");
    super.connectedCallback();
    this.init(HpnCookiesComponent.observedAttributes);
  }

  protected requiredAttributes(): string[] {
    return [];
  }

  protected parsedAttributeChangedCallback(
    attributeName: string,
    oldValue: unknown,
    newValue: unknown,
    namespace: string | null
  ): void {
    super.parsedAttributeChangedCallback(
      attributeName,
      oldValue,
      newValue,
      namespace
    );
  }

  // deconstructor
  protected disconnectedCallback(): void {
    super.disconnectedCallback();
  }

  protected template(): string | null {
    if (this.getCookie("hpn-cookies") == null) {
      return template;
    } else {
      return null;
    }
  }

  protected denyCookies() {
    console.log("denied cookies");

    // First delete existing cookies
    this.deleteCookies();

    // Then block future cookie setting
    Object.defineProperty(document, "cookie", {
      get: () => "",
      set: () => false, // Explicitly prevent setting
      configurable: false, // Prevent reconfiguration
    });

    // Block other storage mechanisms
    this.blockStorageMechanisms();

    // Set consent cookie to remember user's choice
    this.setConsentCookie("denied");

    this.parentNode?.removeChild(this);
  }

  protected acceptCookies() {
    document.cookie =
      "hpn-cookies=accept; expires=Thu, 13 Jul 2022 12:00:00 UTC";
    this.parentNode?.removeChild(this);
  }

  //stackoverflow
  protected getCookie(name: string): string | null {
    const dc = document.cookie;
    const prefix = name + "=";
    let begin = dc.indexOf("; " + prefix);
    let end = 0;
    if (begin === -1) {
      begin = dc.indexOf(prefix);
      if (begin !== 0) return null;
    } else {
      begin += 2;
      end = document.cookie.indexOf(";", begin);
      if (end === -1) {
        end = dc.length;
      }
    }
    return decodeURI(dc.substring(begin + prefix.length, end));
  }

  protected deleteCookies() {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }

  private blockStorageMechanisms() {
    try {
      // Block localStorage
      Object.defineProperty(window, "localStorage", {
        value: null,
        writable: false,
      });
    } catch (e) {
      console.warn("Could not block localStorage:", e);
    }

    try {
      // Block sessionStorage
      Object.defineProperty(window, "sessionStorage", {
        value: null,
        writable: false,
      });
    } catch (e) {
      console.warn("Could not block sessionStorage:", e);
    }
  }

  private setConsentCookie(value: string) {
    // Use a minimal, necessary cookie to remember consent
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);

    // Create the consent cookie before blocking mechanism
    const consentCookie = `hpn-cookies=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;

    // Temporarily restore cookie functionality to set consent cookie
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      document,
      "cookie"
    );
    if (originalDescriptor) {
      Object.defineProperty(document, "cookie", originalDescriptor);
    }

    document.cookie = consentCookie;
  }
}
