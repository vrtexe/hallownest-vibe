import { Control, DomEvent } from "leaflet";
import icon from "../components/icon.js";
import { a, button, div } from "html-dom-js";

/**  @import {  type Map  } from "leaflet"; */

export class SettingsPanelControl extends Control {
  /** @type {HTMLDivElement|undefined|null} */ container;
  opened = false;

  /**
   * @param {Map} _map
   * @override
   */
  onAdd(_map) {
    this.container = div({
      attributes: {
        id: "settings-panel-control-container",
        class: "leaflet-bar leaflet-control",
      },
      children: [
        button({
          attributes: {
            class: "leaflet-control-button settings-panel-toggle-button icon-button",
          },
          event: {
            click: () => {
              /** @type {HTMLDivElement|null}  */
              const settingsPanelContainer = document.querySelector("#settings-panel-container");
              if (!this.opened) {
                settingsPanelContainer?.classList.add("open");
                this.opened = true;
              } else {
                settingsPanelContainer?.classList.remove("open");
                this.opened = false;
              }
            },
          },
          children: [
            icon({ name: "chevron_left", size: { height: 32, width: 32 } }),
          ],
        }),
        div({
          attributes: {
            id: "settings-panel-container",
          },
          children: [
            div({
              children: [
                div({
                  props: {
                    style: {
                      display: "flex",
                    },
                  },
                  children: [
                    a({
                      attributes: {
                        href: "#item",
                      },
                      children: "Text",
                    }),
                    a({
                      attributes: {
                        href: "#item",
                      },
                      children: "Text",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
    div({
      attributes: {
        // "aria-label": "Custom Control",
        onclick: (e) => {
          e.stopPropagation();
          console.log("Abort event triggered!", e);
        },
      },
      props: {
        title: "Title",
        className: "leaflet-bar leaflet-control custom-control",
        style: {
          height: "100vh",
          margin: "0",
          background: "white",
          padding: "0px",
          border: "0",
        },
      },
      children: [
        button({
          props: {
            className: "leaflet-control-button",
          },
          event: {
            click: (e) => {
              e.stopPropagation();
              console.log("Button clicked!", e);
            },
            dblclick: (e) => {
              e.stopPropagation();
              console.log("Button double-clicked!", e);
            },
          },
          children: "Click",
        }),
      ],
    });

    DomEvent.disableScrollPropagation(this.container);
    DomEvent.disableClickPropagation(this.container);
    return this.container;
  }

  /**
   * @param {Map} _map
   * @override
   */
  onRemove(_map) {
    this.container?.remove();
    this.container = null;
  }
}
