import { Pjax } from "@ribajs/router";
import {
  HCaptchaFormComponent,
  Scope as OcFormScope,
} from "@ribajs/octobercms/src/components/hcaptcha-oc-form/hcaptcha-oc-form.component";
import { HttpService } from "@ribajs/core";

interface Scope extends OcFormScope {
  print: HpnFormComponent["print"];
  send: HpnFormComponent["send"];
  openPdf: HpnFormComponent["openPdf"];
  // send: HpnFormComponent["send"];
}

export class HpnFormComponent extends HCaptchaFormComponent {
  public static tagName = "hpn-form";
  public _debug = true;
  protected autobind = true;

  protected pjax?: Pjax;

  static get observedAttributes() {
    return HCaptchaFormComponent.observedAttributes;
  }
  protected requiredAttributes(): string[] {
    return super.requiredAttributes();
  }

  protected getDefaultScope(): Scope {
    const scope = super.getDefaultScope() as Partial<Scope>;
    scope.print = this.print;
    scope.send = this.send;
    scope.openPdf = this.openPdf;
    return scope as Scope;
  }

  protected scope: Scope = this.getDefaultScope();

  constructor(element?: HTMLElement) {
    super(element);
  }

  protected send(event: Event) {
    this.setEmailRequired(true);
  }
  protected openPdf(event: Event) {
    this.setEmailRequired(false);
  }

  public setEmailRequired(value: boolean) {
    if (this.formEl === undefined || this.formEl === null) return;
    var inputs = this.formEl.querySelectorAll("input"), i;

    for (i = 0; i < inputs.length; ++i) {
      var element = inputs[i];
      if (element.id.match("question-[0-9]{0,}-email")) {
        element.required = value;
        return;
      }
    }
  }


  // public send(event: Event) {
  //   event.preventDefault();
  //   event.stopPropagation();

  //   if (!this.formEl) {
  //     console.error("form element not found!");
  //     return;
  //   }

  //   this.validate(this.formEl, this.scope.form);

  //   if (!this.scope.form.valid) {
  //     console.info("form not valid", this.scope);
  //     return;
  //   }

  //   console.log("hjsrhsehsaeh");
  //   if (this.scope.hcaptchaSize === "invisible") {
  //     this.scope.submitDisabled = true;
  //     (window as any).hcaptcha.execute(this.widgetID);
  //   }
  // }

  // protected hcaptchaComplete(): boolean {
  //   return true;
  //   // const data = new FormData(this.formEl);
  //   // HttpService.post("/pdf-form/send", data, "form");
  //   // return false;
  // }

  // protected onSuccessSubmit(status: string, message: string, response: any) {
  //   this.debug("onSuccessSubmit", status, message, response);
  //   return super.onSuccessSubmit(status, message, response);
  // }

  // TODO move to dom utils
  // see https://code-examples.net/de/q/738440
  protected getIframeWindow(
    iframe_object: HTMLIFrameElement
  ): HTMLIFrameElement["contentWindow"] | null {
    let doc:
      | HTMLIFrameElement["contentWindow"]
      | HTMLIFrameElement["contentDocument"]
      | null = null;

    if (iframe_object.contentWindow) {
      return iframe_object.contentWindow;
    }

    if ((iframe_object as any).window) {
      return (iframe_object as any).window;
    }

    if (!doc && iframe_object.contentDocument) {
      doc = iframe_object.contentDocument;
    }

    if (!doc && (iframe_object as any).document) {
      doc = (iframe_object as any).document;
    }

    if (doc && (doc as any).defaultView) {
      return (doc as any).defaultView as Window;
    }

    if (doc && (doc as any).parentWindow) {
      return (doc as any).parentWindow as Window;
    }

    return doc as Window | null;
  }

  public print(event: Event) {
    if (!this.formEl) {
      console.error("form element not found!");
      return;
    }
    this.setEmailRequired(false);

    this.validate(this.formEl, this.scope.form);

    event.preventDefault();
    event.stopPropagation();

    if (!this.scope.form.valid) {
      console.info("form not valid", this.scope);
      return;
    }


    const data = new FormData(this.formEl);
    for (const [key, value] of Object.entries(data)) {
      console.log(key, value);
    }

    HttpService.post("/pdf-form/print", data, "form").then((res) => {
      console.log(res);
      const pdfFile = new Blob([res], {
        type: "text/html",
      });

      const pdfUrl = URL.createObjectURL(pdfFile);
      console.log(pdfUrl);
      const ifrm = document.createElement("iframe");
      ifrm.style.width = "640px";
      ifrm.style.height = "480px";
      ifrm.style.visibility = "hidden";
      ifrm.style.position = "fixed";
      ifrm.style.right = "0";
      ifrm.style.bottom = "0";
      ifrm.classList.add("print-iframe");
      ifrm.setAttribute("src", pdfUrl);
      ifrm.onload = () => {
        ifrm.contentWindow?.addEventListener("afterprint", () => {
          document.body.removeChild(ifrm);
        });
      };
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
