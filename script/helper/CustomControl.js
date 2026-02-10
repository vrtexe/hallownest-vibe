import L, { Control } from "leaflet";

/**  @import {  Map  } from "leaflet"; */

export class CustomControl extends Control {
  // /** @param {import('leaflet').Map} map */
  /**
   * @param {Map} _map
   * @override
   */
  onAdd(_map) {
    const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    const button = L.DomUtil.create("a", "leaflet-control-button", container);

    L.DomEvent.disableClickPropagation(button);
    L.DomEvent.on(button, "click", () => {
      console.log("click");
    });

    container.title = "Title";

    return container;
  }

  /**
   * @param {Map} _map
   * @override
   */
  onRemove(_map) {}
}
