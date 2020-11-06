import { Component } from "@ribajs/core";

import template from "./hpn-pdf-forms.component.html";

// Parsed from theme.yaml to json
const settings = {
  pdf_forms: {
    label: "PDF Forms",
    type: "repeater",
    tab: "PDF Forms",
    collapsed: true,
    prompt: "Fragebogen Hinzufügen",
    form: {
      fields: {
        questionary_name: {
          label: "Fragebogen Name",
          type: "text",
        },
        questionary_download: {
          label: "Fragebogen Download Link",
          type: "text",
        },
        questions: {
          label: "Fragebogen Elemente",
          type: "repeater",
          prompt: "Element Hinzufügen",
          form: {
            fields: {
              title: {
                label: "Title",
                type: "text",
                comment: "Collapse title",
              },
              type_input: {
                label: "Type",
                type: "dropdown",
                options: {
                  description: "Beschreibung",
                  client_data: "Kunden Information",
                  text: "Text",
                  text_area: "Textfeld",
                  checkbox: "Checkbox",
                  scale_input: "Skala 1-10",
                  radiobox: "Radio Box",
                  header_with_margintop: "Überschrift",
                  devider: "Trennlinie",
                },
              },
              description_input: {
                label: "Beschreibung (Formatierter Text)",
                type: "richeditor",
                toolbarButtons:
                  "bold|italic|fontSize|underline|color|undo|redo",
                size: "small",
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[description]",
                },
              },
              client_data_name_input: {
                label: "Name",
                type: "checkbox",
                default: false,
                span: "storm",
                cssClass: "col-xs-4",
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[client_data]",
                },
              },
              client_data_firstname_input: {
                label: "Vorname",
                type: "checkbox",
                default: false,
                span: "storm",
                cssClass: "col-xs-4",
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[client_data]",
                },
              },
              client_data_birthday_input: {
                label: "Geburtstag",
                type: "checkbox",
                default: false,
                span: "storm",
                cssClass: "col-xs-4",
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[client_data]",
                },
              },
              client_data_address_input: {
                label: "Anschrift",
                type: "checkbox",
                default: false,
                span: "storm",
                cssClass: "col-xs-4",
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[client_data]",
                },
              },
              client_data_phone_input: {
                label: "Telefon / Mobil",
                type: "checkbox",
                default: false,
                span: "storm",
                cssClass: "col-xs-4",
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[client_data]",
                },
              },
              client_data_email_input: {
                label: "E-Mail",
                type: "checkbox",
                default: false,
                span: "storm",
                cssClass: "col-xs-4",
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[client_data]",
                },
              },
              text_input: {
                label: "Text",
                type: "text",
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[text]",
                },
              },
              text_area_input: {
                label: "Textfeld",
                type: "text",
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[text_area]",
                },
              },
              checkbox_question_input: {
                label: "Checkbox (Titel)",
                type: "text",
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[checkbox]",
                },
              },
              checkbox_answering_options: {
                label: "Antwortmöglichkeiten",
                type: "repeater",
                titleFrom: "title_when_collapsed",
                prompt: "Antwortmöglichkeit hinzufügen",
                form: {
                  fields: {
                    answer_input: {
                      label: "Antwortmöglichkeit",
                      type: "text",
                    },
                    description_if_checked: {
                      label: "Beschreibung falls angekreuzt",
                      type: "checkbox",
                    },
                  },
                },
              },
              trigger: {
                action: "show",
                field: "type_input",
                condition: "value[checkbox]",
              },
              scale_input: {
                label: "1 - 10 Skala (Frage)",
                type: "text",
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[scale_input]",
                },
              },
              radiobox_question_input: {
                label: "Frage",
                type: "text",
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[radiobox]",
                },
              },
              radiobox_answering_options: {
                label: "Antwortmöglichkeiten",
                type: "repeater",
                titleFrom: "title_when_collapsed",
                prompt: "Antwortmöglichkeit hinzufügen",
                form: {
                  fields: {
                    answer_input: {
                      label: "Antwortmöglichkeit",
                      type: "text",
                    },
                    description_if_checked: {
                      label: "Beschreibung falls angekreuzt",
                      type: "checkbox",
                    },
                  },
                },
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[radiobox]",
                },
              },
              header_with_margintop: {
                label: "Überschrift",
                type: "text",
                trigger: {
                  action: "show",
                  field: "type_input",
                  condition: "value[header_with_margintop]",
                },
              },
            },
          },
        },
      },
    },
  },
};

interface Scope {
  forms: any[];
  settings: any;
}

export class HpnPdfFormsComponent extends Component {
  public static tagName = "hpn-pdf-forms";

  protected autobind = true;
  public _debug = true;

  static get observedAttributes() {
    return ["forms"];
  }

  protected scope: Scope = {
    forms: [],
    settings,
  };

  constructor(element?: HTMLElement) {
    super(element);
    this.init(HpnPdfFormsComponent.observedAttributes);
  }

  protected async init(observedAttributes: string[]) {
    return super.init(observedAttributes).then((view) => {
      return view;
    });
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

  // deconstructor
  protected disconnectedCallback() {
    super.disconnectedCallback();
  }

  protected template() {
    return template;
  }
}
