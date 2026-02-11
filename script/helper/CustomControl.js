import { Control, DomEvent } from "leaflet";
import { button, div, input, label } from "../html.js";
/**  @import {  type Map  } from "leaflet"; */

export class CustomControl extends Control {
  /** @type {HTMLDivElement|undefined|null} */ container;

  /**
   * @param {Map} _map
   * @override
   */
  onAdd(_map) {
    this.container = div({
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
          padding: "5px",
        },
      },
      children: [
        label({
          props: {
            htmlFor: "test",
          },
          children: "Test Label",
        }),
        input({
          props: {
            type: "text",
            placeholder: "Enter text",
            required: true,
          },
        }),
        // div({ children: "Custom Control" }),
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
