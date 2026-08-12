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

import { ConsentService, GoogleTagService } from "./services";

/**
 * Die Google-IDs stehen im Layout, nicht hier: so lassen sie sich aendern,
 * ohne dass das JS-Bundle neu gebaut werden muss. Fehlt ein Meta-Tag, bleibt
 * das jeweilige Produkt einfach aus — das ist der Schalter, mit dem sich
 * Analytics oder Ads scharf schalten laesst.
 */
const getMetaContent = (name: string): string | null =>
  document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ||
  null;

export class Main {
  private riba = new Riba();

  constructor() {
    // Vor dem Binden: der Banner liest den Zustand beim Erzeugen seines Scopes,
    // und der Google-Tag muss die Einwilligung kennen, bevor die erste Seite
    // zaehlt.
    ConsentService.getInstance();
    GoogleTagService.setInstance({
      measurementId: getMetaContent("hpn-ga-measurement-id"),
      adsConversionId: getMetaContent("hpn-ads-conversion-id"),
    });

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
