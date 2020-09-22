import { Riba, coreModule } from "@ribajs/core";
import { routerModule } from "@ribajs/router";
// import { pdfModule } from "@ribajs/pdf";
import { jqueryModule } from "@ribajs/jquery";
import { leafletModule } from "@ribajs/leaflet-map";
import { octobercmsModule } from "@ribajs/octobercms";
import { bs4Module } from "@ribajs/bs4";

import { ready } from "@ribajs/utils/src/dom";

// Extra binders
import {
  dataScrollPositionYBinder,
  syncElementPropertyBinder,
} from "@ribajs/extras/src/binders/index";

// Custom formatters, binders and components
import * as CustomFormatters from "./formatters";
// import * as CustomBinders from "./binders";
import * as CustomComponents from "./components";

export class Main {
  private riba = new Riba();

  constructor() {
    this.riba.module.regist(coreModule);
    this.riba.module.regist(jqueryModule);
    this.riba.module.regist(routerModule);
    this.riba.module.regist(bs4Module);
    this.riba.module.regist(octobercmsModule);
    // this.riba.module.regist(pdfModule);
    this.riba.module.regist(leafletModule);

    // selected elements from modules
    this.riba.module.regist({
      binders: { dataScrollPositionYBinder, syncElementPropertyBinder },
    });

    // Regist custom components
    this.riba.module.regist({
      formatters: CustomFormatters,
      components: CustomComponents,
      // binders: CustomBinders,
    });

    this.riba.bind(document.body, window.model || {});
  }
}

ready(() => {
  new Main();
});
