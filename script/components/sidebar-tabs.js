import { button, div, span } from "html-dom-js";

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   icon?: string,
 *   content: () => HTMLElement
 * }} TabDefinition
 *
 * @typedef {{
 *   tabs: TabDefinition[],
 *   defaultTab?: string,
 *   onTabChange?: (tabId: string) => void
 * }} SidebarTabsOptions
 *
 * @typedef {{
 *   container: HTMLElement,
 *   setActiveTab: (tabId: string) => void,
 *   getActiveTab: () => string
 * }} SidebarTabsInstance
 */

/**
 * Creates a tabbed sidebar component.
 * @param {SidebarTabsOptions} options
 * @returns {SidebarTabsInstance}
 */
export function createSidebarTabs(options) {
  const { tabs, defaultTab, onTabChange } = options;

  let activeTabId = defaultTab || tabs[0]?.id || "";

  /** @type {Map<string, HTMLElement>} */
  const tabButtons = new Map();
  /** @type {Map<string, HTMLElement>} */
  const tabPanels = new Map();

  const tabBar = div({
    attributes: { class: "sidebar-tab-bar" },
    children: tabs.map((tab) => {
      const btn = button({
        attributes: {
          class: `sidebar-tab-button ${tab.id === activeTabId ? "active" : ""}`,
          "data-tab": tab.id,
          title: tab.label,
        },
        event: {
          click: () => setActiveTab(tab.id),
        },
        children: [
          ...(tab.icon
            ? [span({ attributes: { class: "tab-icon" }, children: tab.icon })]
            : []),
          span({ attributes: { class: "tab-label" }, children: tab.label }),
        ],
      });
      tabButtons.set(tab.id, btn);
      return btn;
    }),
  });

  const tabContent = div({
    attributes: { class: "sidebar-tab-content" },
    children: tabs.map((tab) => {
      const panel = div({
        attributes: {
          class: `sidebar-tab-panel ${tab.id === activeTabId ? "active" : ""}`,
          "data-tab-panel": tab.id,
        },
        children: [tab.content()],
      });
      tabPanels.set(tab.id, panel);
      return panel;
    }),
  });

  const container = div({
    attributes: { class: "sidebar-tabs" },
    children: [tabBar, tabContent],
  });

  /**
   * @param {string} tabId
   */
  function setActiveTab(tabId) {
    if (tabId === activeTabId) return;
    const prevBtn = tabButtons.get(activeTabId);
    const prevPanel = tabPanels.get(activeTabId);
    if (prevBtn) prevBtn.classList.remove("active");
    if (prevPanel) prevPanel.classList.remove("active");

    activeTabId = tabId;

    const nextBtn = tabButtons.get(activeTabId);
    const nextPanel = tabPanels.get(activeTabId);
    if (nextBtn) nextBtn.classList.add("active");
    if (nextPanel) nextPanel.classList.add("active");

    onTabChange?.(tabId);
  }

  function getActiveTab() {
    return activeTabId;
  }

  return { container, setActiveTab, getActiveTab };
}
