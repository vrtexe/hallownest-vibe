import { div, img, input, label, span } from "html-dom-js";

/**
 * @typedef {{
 *   categories: Array<{id: string, name: string, icon: string, color: string, markers: Array<any>}>,
 *   onToggle: (categoryId: string, enabled: boolean) => void,
 *   initialState?: Record<string, boolean>
 * }} MarkerControlsOptions
 *
 * @typedef {{
 *   container: HTMLElement,
 *   setEnabled: (categoryId: string, enabled: boolean) => void,
 *   getState: () => Record<string, boolean>
 * }} MarkerControlsInstance
 */

/**
 * @param {MarkerControlsOptions} options
 * @returns {MarkerControlsInstance}
 */
export function createMarkerControls(options) {
  const { categories, onToggle, initialState = {} } = options;

  /** @type {Record<string, boolean>} */
  const state = {};
  /** @type {Map<string, HTMLInputElement>} */
  const checkboxes = new Map();

  const categoryRows = categories.map((cat) => {
    const enabled = initialState[cat.id] ?? true;
    state[cat.id] = enabled;

    /** @type {HTMLInputElement} */
    const checkbox = input({
      attributes: {
        type: "checkbox",
        id: `marker-toggle-${cat.id}`,
        class: "marker-checkbox",
      },
      props: { checked: enabled },
      event: {
        change: () => {
          state[cat.id] = checkbox.checked;
          row.classList.toggle("disabled", !checkbox.checked);
          onToggle(cat.id, checkbox.checked);
        },
      },
    });

    checkboxes.set(cat.id, checkbox);

    const row = div({
      attributes: {
        class: `marker-control-row ${enabled ? "" : "disabled"}`,
      },
      children: [
        label({
          attributes: {
            class: "marker-control-label",
            for: `marker-toggle-${cat.id}`,
          },
          children: [
            checkbox,
            div({
              attributes: { class: "marker-icon-wrapper" },
              props: { style: { borderColor: cat.color } },
              children: [
                img({
                  attributes: {
                    src: cat.icon,
                    alt: cat.name,
                    class: "marker-icon-img",
                  },
                }),
              ],
            }),
            span({ attributes: { class: "marker-name" }, children: cat.name }),
            span({
              attributes: { class: "marker-count" },
              children: `${cat.markers.length}`,
            }),
          ],
        }),
      ],
    });

    return row;
  });

  const toggleAllCheckbox = input({
    attributes: { type: "checkbox", id: "marker-toggle-all", class: "marker-checkbox" },
    props: { checked: true },
    event: {
      change: () => {
        const checked = toggleAllCheckbox.checked;
        categories.forEach((cat) => setEnabled(cat.id, checked));
      },
    },
  });

  const header = div({
    attributes: { class: "marker-controls-header" },
    children: [
      label({
        attributes: { class: "marker-control-label toggle-all-label", for: "marker-toggle-all" },
        children: [
          toggleAllCheckbox,
          span({ attributes: { class: "marker-name" }, children: "Toggle All" }),
        ],
      }),
    ],
  });

  const container = div({
    attributes: { class: "marker-controls" },
    children: [header, div({ attributes: { class: "marker-controls-list" }, children: categoryRows })],
  });

  /**
   * @param {string} categoryId
   * @param {boolean} enabled
   */
  function setEnabled(categoryId, enabled) {
    state[categoryId] = enabled;
    const cb = checkboxes.get(categoryId);
    if (cb) {
      cb.checked = enabled;
      cb.dispatchEvent(new Event("change"));
    }
  }

  function getState() {
    return { ...state };
  }

  return { container, setEnabled, getState };
}
