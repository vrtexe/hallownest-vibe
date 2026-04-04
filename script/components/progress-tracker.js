import { button, div, img, span } from "html-dom-js";

/** @typedef {{ id: string, name: string, icon: string, color: string, markers: Array<{id: string, name: string}> }} TrackableCategory */

const STORAGE_KEY = "hallownest-progress";

/**
 * @param {{ categories: TrackableCategory[] }} options
 */
export function createProgressTracker(options) {
  const { categories } = options;
  const state = loadProgress();

  /** @type {Map<string, HTMLElement>} */
  const progressBars = new Map();
  /** @type {Map<string, HTMLElement>} */
  const countLabels = new Map();
  /** @type {Map<string, HTMLElement>} */
  const itemContainers = new Map();
  /** @type {Map<string, boolean>} */
  const expandedState = new Map();

  const totalStats = createTotalStats();

  const categoryCards = categories.map((cat) => {
    const catProgress = state[cat.id] ?? [];
    state[cat.id] = catProgress;

    const checked = catProgress.length;
    const total = cat.markers.length;

    const progressBar = div({ attributes: { class: "progress-bar-fill" }, props: { style: { width: `${(checked / total) * 100}%`, backgroundColor: cat.color } } });
    progressBars.set(cat.id, progressBar);

    const countLabel = span({ attributes: { class: "progress-count" }, children: `${checked}/${total}` });
    countLabels.set(cat.id, countLabel);

    const itemList = div({
      attributes: { class: "progress-item-list collapsed" },
      children: cat.markers.map((marker) => {
        const isChecked = catProgress.includes(marker.id);
        const item = div({
          attributes: { class: `progress-item ${isChecked ? "checked" : ""}` },
          event: {
            click: () => {
              const catArr = state[cat.id] ?? [];
              state[cat.id] = catArr;
              const idx = catArr.indexOf(marker.id);
              if (idx >= 0) {
                catArr.splice(idx, 1);
                item.classList.remove("checked");
              } else {
                catArr.push(marker.id);
                item.classList.add("checked");
              }
              updateCategoryProgress(cat.id, cat.markers.length, cat.color);
              updateTotalStats();
              saveProgress(state);
            },
          },
          children: [
            span({ attributes: { class: "progress-item-check" }, children: isChecked ? "◆" : "◇" }),
            span({ attributes: { class: "progress-item-name" }, children: marker.name }),
          ],
        });
        return item;
      }),
    });
    itemContainers.set(cat.id, itemList);
    expandedState.set(cat.id, false);

    const chevron = span({ attributes: { class: "progress-chevron" }, children: "▸" });

    return div({
      attributes: { class: "progress-category-card" },
      children: [
        div({
          attributes: { class: "progress-category-header" },
          event: {
            click: () => {
              const expanded = !expandedState.get(cat.id);
              expandedState.set(cat.id, expanded);
              itemList.classList.toggle("collapsed", !expanded);
              chevron.textContent = expanded ? "▾" : "▸";
            },
          },
          children: [
            div({
              attributes: { class: "progress-category-info" },
              children: [
                div({
                  attributes: { class: "marker-icon-wrapper small" },
                  props: { style: { borderColor: cat.color } },
                  children: [img({ attributes: { src: cat.icon, alt: cat.name, class: "marker-icon-img" } })],
                }),
                span({ attributes: { class: "progress-category-name" }, children: cat.name }),
                countLabel,
              ],
            }),
            chevron,
          ],
        }),
        div({
          attributes: { class: "progress-bar-track" },
          children: [progressBar],
        }),
        itemList,
      ],
    });
  });

  const resetBtn = button({
    attributes: { class: "hk-button danger" },
    children: "Reset All Progress",
    event: {
      click: () => {
        if (!confirm("Reset all progress? This cannot be undone.")) return;
        for (const cat of categories) {
          state[cat.id] = [];
          updateCategoryProgress(cat.id, cat.markers.length, cat.color);
          const list = itemContainers.get(cat.id);
          if (list) {
            list.querySelectorAll(".progress-item").forEach((el) => {
              el.classList.remove("checked");
              const check = el.querySelector(".progress-item-check");
              if (check) check.textContent = "◇";
            });
          }
        }
        updateTotalStats();
        saveProgress(state);
      },
    },
  });

  const container = div({
    attributes: { class: "progress-tracker" },
    children: [totalStats.element, ...categoryCards, div({ attributes: { class: "progress-reset-wrapper" }, children: [resetBtn] })],
  });

  /**
   * @param {string} catId
   * @param {number} total
   * @param {string} color
   */
  function updateCategoryProgress(catId, total, color) {
    const checked = state[catId]?.length ?? 0;
    const bar = progressBars.get(catId);
    const lbl = countLabels.get(catId);
    if (bar) {
      bar.style.width = `${(checked / total) * 100}%`;
      bar.style.backgroundColor = color;
    }
    if (lbl) lbl.textContent = `${checked}/${total}`;

    const list = itemContainers.get(catId);
    if (list) {
      list.querySelectorAll(".progress-item").forEach((el) => {
        const name = el.querySelector(".progress-item-name")?.textContent;
        const marker = categories.find((c) => c.id === catId)?.markers.find((m) => m.name === name);
        if (marker) {
          const isChecked = (state[catId] ?? []).includes(marker.id);
          el.classList.toggle("checked", isChecked);
          const check = el.querySelector(".progress-item-check");
          if (check) check.textContent = isChecked ? "◆" : "◇";
        }
      });
    }
  }

  function createTotalStats() {
    let totalChecked = 0;
    let totalItems = 0;
    for (const cat of categories) {
      totalChecked += (state[cat.id]?.length ?? 0);
      totalItems += cat.markers.length;
    }
    const pct = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

    const pctLabel = span({ attributes: { class: "total-pct" }, children: `${pct}%` });
    const countLbl = span({ attributes: { class: "total-count" }, children: `${totalChecked}/${totalItems}` });
    const bar = div({ attributes: { class: "progress-bar-fill total" }, props: { style: { width: `${pct}%` } } });

    const element = div({
      attributes: { class: "progress-total-stats" },
      children: [
        div({
          attributes: { class: "progress-total-header" },
          children: [
            span({ attributes: { class: "progress-total-title" }, children: "Completion" }),
            div({ attributes: { class: "progress-total-numbers" }, children: [pctLabel, countLbl] }),
          ],
        }),
        div({ attributes: { class: "progress-bar-track total" }, children: [bar] }),
      ],
    });

    return { element, pctLabel, countLbl, bar };
  }

  function updateTotalStats() {
    let totalChecked = 0;
    let totalItems = 0;
    for (const cat of categories) {
      totalChecked += (state[cat.id]?.length ?? 0);
      totalItems += cat.markers.length;
    }
    const pct = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;
    totalStats.pctLabel.textContent = `${pct}%`;
    totalStats.countLbl.textContent = `${totalChecked}/${totalItems}`;
    totalStats.bar.style.width = `${pct}%`;
  }

  return { container, getState: () => ({ ...state }) };
}

/**
 * @returns {Record<string, string[]>}
 */
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * @param {Record<string, string[]>} state
 */
function saveProgress(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
