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
  download: HpnFormComponent["download"];
  // send: HpnFormComponent["send"];
}

export class HpnFormComponent extends HCaptchaFormComponent {
  public static tagName = "hpn-form";
  public _debug = false;
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
    scope.download = this.download;
    return scope as Scope;
  }

  protected scope: Scope = this.getDefaultScope();

  constructor(element?: HTMLElement) {
    super(element);
  }

  protected send(/*event: Event*/) {
    this.setEmailRequired(true);
  }

  protected download(event: Event) {
    if (!this.formEl) {
      console.error("form element not found!");
      return;
    }
    this.setEmailRequired(false);

    this.validate(this.formEl, this.scope.form, "honorar-error");

    event.preventDefault();
    event.stopPropagation();

    if (!this.scope.form.valid) {
      console.warn("form not valid", this.scope);
      return;
    }

    const dl = this.el.getAttribute("download");
    if (dl) {
      window.open(dl, "_blank");
    }
  }

  protected openPdf(/*event: Event*/) {
    this.setEmailRequired(false);
  }

  public setEmailRequired(value: boolean) {
    if (this.formEl === undefined || this.formEl === null) return;
    const inputs = this.formEl.querySelectorAll("input");
    let i = 0;

    for (i = 0; i < inputs.length; ++i) {
      const element = inputs[i];
      if (element.id.match("question-[0-9]{0,}-email")) {
        element.required = value;
        return;
      }
    }
  }

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
      console.warn("form not valid", this.scope);
      return;
    }

    const data = new FormData(this.formEl);
    if (this._debug) {
      for (const [key, value] of Object.entries(data)) {
        this.debug(key, value);
      }
    }

    HttpService.post("/pdf-form/print", data, "form").then((res) => {
      this.debug("res", res);
      const pdfFile = new Blob([res], {
        type: "text/html",
      });

      const pdfUrl = URL.createObjectURL(pdfFile);
      this.debug("pdfUrl", pdfUrl);
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

  protected async beforeBind() {
    await super.beforeBind();
    this.pjax = Pjax.getInstance("main");
  }
}
