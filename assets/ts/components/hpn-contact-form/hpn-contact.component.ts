import { Component } from "@ribajs/core";

export class HpnContactComponent extends Component {
  public static tagName = "hpn-contact";

  protected autobind = false;

  static get observedAttributes() {
    return [];
  }

  protected scope: any = {};

  constructor(element?: HTMLElement) {
    super(element);
    this.init(HpnContactComponent.observedAttributes);
  }

  protected requiredAttributes() {
    return [];
  }

  protected connectedCallback() {
    console.log("test");
  }

  protected template() {
    return null;
  }
}
