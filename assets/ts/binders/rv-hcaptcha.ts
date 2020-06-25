import { Binder } from "@ribajs/core/src/interfaces";

type EventHandlerFunction = (e: Event) => void;

/**
 * Sets the element's text value.
 */
export const hcaptchaBinder: Binder<EventHandlerFunction> = {
  name: "hcaptcha",
  bind() {
    if (!this.customData) {
      this.customData = {
        handler: null,
      };
    }
  },
  unbind(el: HTMLElement) {
    if (this.customData.handler) {
      if (this.args === null) {
        throw new Error("args is null");
      }
      const eventName = this.args[0] as string;
      el.removeEventListener(eventName, this.customData.handler);
    }
  },
  routine(el: HTMLElement, value: EventHandlerFunction) {
    const eventName = "form-validated";

    if (this.customData.handler) {
      el.removeEventListener(eventName, this.customData.handler);
    }

    this.customData.handler = this.eventHandler(value, el);

    const passive = this.el.dataset.passive === "true"; // data-passive="true"

    try {
      el.addEventListener(eventName, this.customData.handler, { passive });
    } catch (error) {
      console.warn(error);
      el.addEventListener(eventName, (/*event: Event*/) => {
        (document as any).hcpatcha.execute();
      });
    }
  },
};
