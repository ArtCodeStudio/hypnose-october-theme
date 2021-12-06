import { Riba, coreModule } from "@ribajs/core";
import { routerModule } from "@ribajs/router";
import { jqueryModule } from "@ribajs/jquery";
import { leafletModule } from "@ribajs/leaflet-map";
import { octobercmsModule } from "@ribajs/octobercms";
import { bs4Module } from "@ribajs/bs4";

import { ready } from "@ribajs/utils/src/dom";

// Extra binders
import {
  DataScrollPositionYBinder,
  SyncElementPropertyBinder,
} from "@ribajs/extras/src/binders/index";

// Custom formatters, binders and components
import * as CustomFormatters from "./formatters";
// import * as CustomBinders from "./binders";
import * as CustomComponents from "./components";

export class Main {
  private riba = new Riba();

  constructor() {
    this.riba.module.regist(coreModule.init());
    this.riba.module.regist(jqueryModule.init());
    this.riba.module.regist(routerModule.init());
    this.riba.module.regist(bs4Module.init());
    this.riba.module.regist(octobercmsModule.init());
    this.riba.module.regist(leafletModule.init());

    // selected parts from modules
    this.riba.module.binder.regist(DataScrollPositionYBinder);
    this.riba.module.binder.regist(SyncElementPropertyBinder);
    this.riba.module.component.regists(CustomComponents);
    this.riba.module.formatter.regists(CustomFormatters);

    this.riba.bind(document.body, window.model || {});
  }
}

ready(() => {
  new Main();
});
