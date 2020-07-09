import { isAbsoluteUrl, isInternalUrl } from "@ribajs/utils/src/url";

import { Pjax } from "@ribajs/router";

import { Bs4NavbarComponent } from "@ribajs/bs4/src/components/bs4-navbar/bs4-navbar.component";

export class HpnNavbarComponent extends Bs4NavbarComponent {
  public static tagName = "hpn-navbar";

  public _debug = false;

  protected autobind = true;

  protected pjax?: Pjax;

  static get observedAttributes() {
    return ["collapse-selector"];
  }

  protected scope = {
    toggle: this.toggle,
    show: this.show,
    hide: this.hide,
    navbarCollapsedHeight: 72,
    onItemClick: this.onItemClick,
    isCollapsed: true,
    collapseSelector: ".nav-item-level-2-wrapper",
    parentSelector: ".open",
    showOnHoverClass: "show-on-hover",
    hideOnHoverClass: "hide-on-hover",
  };

  constructor(element?: HTMLElement) {
    super(element);
    // console.debug('constructor', this);
  }

  public onItemClick(event?: Event) {
    if (event) {
      const target = event.target as HTMLAnchorElement | null;
      if (!target) {
        return console.warn("Target not found!");
      }
      const parent = target.parentNode as HTMLElement;
      if (this.pjax) {
        // If this element has childs toggle the menu
        if (
          parent.classList.contains("nav-item-level-1-with-childs") ||
          target.classList.contains("nav-item-level-1-with-childs")
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
          if (parent.classList.contains("open")) {
            this.hide();
          } else {
            this.hideAllActive();
            parent.classList.add("open");
            this.show();
          }
          return;
        }

        let url = target.href;

        this.hide();
        if (url) {
          if (isAbsoluteUrl(url) && isInternalUrl(url)) {
            url = target.pathname + target.search;
          }

          this.pjax.goTo(url);
        }
      }
    }
  }

  public toggle(event?: Event) {
    super.toggle(event);
  }

  public show(event?: Event) {
    this.setMenuHeight();
    super.show(event);
  }

  public hide(event?: Event) {
    this.hideAllActive();
    super.hide(event);
  }

  protected hideElement(element: HTMLElement) {
    element.classList.remove(this.scope.showOnHoverClass);
    element.classList.add(this.scope.hideOnHoverClass);
  }

  protected showElement(element: HTMLElement) {
    element.classList.add(this.scope.showOnHoverClass);
    element.classList.remove(this.scope.hideOnHoverClass);
  }

  protected removeElementClasses(element: HTMLElement) {
    element.classList.remove(this.scope.showOnHoverClass);
    element.classList.remove(this.scope.hideOnHoverClass);
  }

  protected hideAll() {
    const collapseElements = this.el.querySelectorAll<HTMLElement>(
      this.scope.collapseSelector
    );
    collapseElements.forEach((collapseElement) => {
      this.hideElement(collapseElement);
    });
  }

  protected hideAllActive() {
    const collapseElements = this.el.querySelectorAll<HTMLElement>(
      this.scope.parentSelector
    );
    collapseElements.forEach((collapseElement) => {
      collapseElement.classList.remove("open");
    });
  }

  protected removeAllOnHoverClasses() {
    const collapseElements = this.el.querySelectorAll<HTMLElement>(
      this.scope.collapseSelector
    );
    collapseElements.forEach((collapseElement) => {
      this.removeElementClasses(collapseElement);
    });
  }

  protected getHighestCollapseElementHeight() {
    let highest = 0;
    const collapseElements = this.el.querySelectorAll<HTMLElement>(
      this.scope.parentSelector + " " + this.scope.collapseSelector
    );
    if (collapseElements) {
      collapseElements.forEach((collapseElement) => {
        const clientHeight = collapseElement.clientHeight;
        highest = clientHeight > highest ? clientHeight : highest;
      });
    }
    // Special case for navbar brand
    const navbarBrand = this.el.querySelector(".navbar-brand");
    if (navbarBrand) {
      const clientHeight =
        (navbarBrand as HTMLElement).clientHeight -
        this.scope.navbarCollapsedHeight;
      highest = clientHeight > highest ? clientHeight : highest;
    }
    return highest;
  }

  protected setMenuHeight() {
    const nav = this.el.querySelector(".nav");
    if (this.scope.isCollapsed) {
      (nav as HTMLElement).style.height =
        this.scope.navbarCollapsedHeight + "px"; // 'auto';
      return;
    }
    setTimeout(() => {
      const addHeight = this.getHighestCollapseElementHeight();
      // const height = (nav as HTMLElement).clientHeight + addHeight;
      const height = this.scope.navbarCollapsedHeight + addHeight;
      (nav as HTMLElement).style.height = height + "px";
    }, 0);
  }

  protected async init(observedAttributes: string[]) {
    return super.init(observedAttributes).then((view) => {
      return view;
    });
  }

  protected async beforeBind() {
    return super.beforeBind();
  }

  protected onNewPageReady() {
    // DO not hide the menu on new page, we do this over `this.onItemClick`
    // if (this.collapseService) {
    //   this.collapseService.hide();
    // }
  }

  protected async afterBind() {
    super.afterBind();

    // hide main menau on scroll
    this.pjax = Pjax.getInstance("main");
    window.onscroll = (event: Event) => {
      if (!this.scope.isCollapsed) {
        this.hide(event);
      }
    };

    // hide menu on click outside elsewhere
    window.onclick = (event: Event) => {
      if (!this.scope.isCollapsed && !this.el.contains(event.target as Node)) {
        console.log(event);
        this.hide(event);
      }
    };
    return;
  }

  protected connectedCallback() {
    super.connectedCallback();
    // console.debug('connectedCallback', this);
  }

  protected requiredAttributes() {
    return [];
  }

  protected parsedAttributeChangedCallback(
    attributeName: string,
    oldValue: any,
    newValue: any,
    namespace: string | null
  ) {
    super.parsedAttributeChangedCallback(
      attributeName,
      oldValue,
      newValue,
      namespace
    );
  }

  protected disconnectedCallback() {
    super.disconnectedCallback();
  }

  protected template() {
    return super.template();
  }

  protected onStateChange() {
    super.onStateChange();
    this.removeAllOnHoverClasses();
    this.setMenuHeight();
  }
}
