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

  protected scope: Scope = {
    denyCookies: this.denyCookies,
    acceptCookies: this.acceptCookies,
  };

  constructor(element?: HTMLElement) {
    super(element);
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
    this.el.parentNode?.removeChild(this.el);
    (document as any).__defineGetter__("cookie", function () {
      return "";
    });
    (document as any).__defineSetter__("cookie", function () {
      /**/
    });
    this.deleteCookies();
  }

  protected acceptCookies() {
    document.cookie =
      "hpn-cookies=accept; expires=Thu, 13 Jul 2022 12:00:00 UTC";
    this.el.parentNode?.removeChild(this.el);
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
}
