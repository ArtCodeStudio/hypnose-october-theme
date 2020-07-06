import { Pjax } from "@ribajs/router";
import {
  HCaptchaFormComponent,
  Scope as OcFormScope,
} from "@ribajs/octobercms/src/components/hcaptcha-oc-form/hcaptcha-oc-form.component";
import { HttpService } from "../../../../../../../riba/packages/core/src";

interface Scope extends OcFormScope {
  print: HpnFormComponent["print"];
  send: HpnFormComponent["send"];
}

export class HpnFormComponent extends HCaptchaFormComponent {
  public static tagName = "hpn-form";

  protected autobind = true;

  protected pjax?: Pjax;

  static get observedAttributes() {
    return HCaptchaFormComponent.observedAttributes;
  }
  static get requiredAttributes(): string[] {
    return HCaptchaFormComponent.requiredAttributes;
  }

  protected getDefaultScope(): Scope {
    const scope = super.getDefaultScope() as Partial<Scope>;
    scope.print = this.print;
    scope.send = this.send;
    return scope as Scope;
  }

  protected scope: Scope = this.getDefaultScope();

  constructor(element?: HTMLElement) {
    super(element);
  }

  public send() {
    event.preventDefault();
    event.stopPropagation();
    const data = new FormData(this.formEl);
    if (this.scope.hcaptchaSize === "invisible") {
      this.scope.submitDisabled = true;
      (window as any).hcaptcha.execute(this.widgetID);
    }
    return;
    HttpService.post("/pdf-form/send", data);
  }

  public print(event: Event) {
    if (!this.formEl) return;

    event.preventDefault();
    event.stopPropagation();

    const data = new FormData(this.formEl);

    HttpService.post("/pdf-form/print", data).then((res) => {
      console.log(res);
      const pdfFile = new Blob([res], {
        type: "text/html",
      });

      const pdfUrl = URL.createObjectURL(pdfFile);
      console.log(pdfUrl);
      const ifrm = document.createElement("iframe");
      ifrm.style.width = "640px";
      ifrm.style.height = "480px";
      ifrm.onload = () => {
        ifrm.focus();
        ifrm.contentWindow.print();
      };
      ifrm.setAttribute("src", pdfUrl);
      document.body.appendChild(ifrm);
    });
  }

  protected connectedCallback() {
    super.connectedCallback();
  }

  protected async beforeBind() {
    return super.beforeBind();
  }

  protected async afterBind() {
    super.afterBind();
    this.pjax = Pjax.getInstance("main");
  }
}
