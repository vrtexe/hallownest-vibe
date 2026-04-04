import { Control, DomEvent } from "leaflet";
import icon from "../components/icon.js";
import { button, div } from "html-dom-js";

/** @import { type Map } from "leaflet" */

/**
 * @typedef {{
 *   sidebarContent: HTMLElement
 * }} SettingsPanelOptions
 */

export class SettingsPanelControl extends Control {
  /** @type {HTMLDivElement | undefined | null} */ container;
  opened = false;
  /** @type {HTMLElement | null} */ sidebarContent;

  /**
   * @param {import("leaflet").ControlOptions & { sidebarContent?: HTMLElement }} options
   */
  constructor(options) {
    super(options);
    this.sidebarContent = options.sidebarContent ?? null;
  }

  /**
   * @param {Map} _map
   * @override
   */
  onAdd(_map) {
    const panelContainer = div({
      attributes: { id: "settings-panel-container" },
      children: this.sidebarContent
        ? [div({ attributes: { class: "sidebar-inner" }, children: [this.sidebarContent] })]
        : [],
    });

    const toggleButton = button({
      attributes: {
        class: "leaflet-control-button settings-panel-toggle-button icon-button",
      },
      event: {
        click: () => {
          this.opened = !this.opened;
          panelContainer.classList.toggle("open", this.opened);
          chevronIcon.setAttribute("data", `assets/icons/${this.opened ? "chevron_right" : "chevron_left"}.svg`);
        },
      },
      children: [],
    });

    const chevronIcon = icon({ name: "chevron_left", size: { height: 28, width: 28 } });
    toggleButton.appendChild(chevronIcon);

    this.container = div({
      attributes: {
        id: "settings-panel-control-container",
        class: "leaflet-bar leaflet-control",
      },
      children: [toggleButton, panelContainer],
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
