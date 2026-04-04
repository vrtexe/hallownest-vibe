import { button, div, img, input, option, select, span } from "html-dom-js";
import { Marker, Polyline, Icon, FeatureGroup } from "leaflet";

/**
 * @typedef {{ lat: number, lng: number, name: string, icon?: string }} StageMarker
 * @typedef {{ id: string, name: string, color: string, markers: StageMarker[] }} Stage
 * @typedef {{ id: string, name: string, stages: Stage[] }} SpeedrunBundle
 */

const STORAGE_KEY = "hallownest-speedruns";
const COLORS = ["#5b6ee1", "#d4a017", "#e05050", "#7cbb4a", "#e07ce0", "#4ad4d4", "#e0a050", "#7c7ce0"];

/**
 * @param {HTMLElement} container
 */
function clearChildren(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

/**
 * @param {{ map: import("leaflet").Map, icons: Array<{name: string, link: string}> }} options
 */
export function createSpeedrunEditor(options) {
  const { map, icons } = options;

  /** @type {SpeedrunBundle[]} */
  let bundles = loadBundles();
  /** @type {string | null} */
  let activeBundleId = bundles[0]?.id ?? null;
  /** @type {string | null} */
  let activeStageId = null;
  /** @type {boolean} */
  let placingMarker = false;
  /** @type {((e: import("leaflet").LeafletMouseEvent) => void) | null} */
  let mapClickHandler = null;
  /** @type {string | undefined} */
  let selectedIconLink = icons[0]?.link;

  /** @type {Map<string, FeatureGroup>} */
  const stageLayerGroups = new Map();

  const bundleSelect = select({
    attributes: { class: "hk-select", id: "speedrun-bundle-select" },
    event: {
      change: () => {
        activeBundleId = bundleSelect.value;
        activeStageId = null;
        renderStages();
        renderMapLayers();
      },
    },
    children: [],
  });

  const stageListContainer = div({ attributes: { class: "speedrun-stage-list" } });
  const stageDetailContainer = div({ attributes: { class: "speedrun-stage-detail" } });

  const iconPreview = img({
    attributes: {
      src: icons[0]?.link ?? "",
      alt: "Selected icon",
      class: "icon-picker-preview",
    },
  });

  const iconSelect = select({
    attributes: { class: "hk-select icon-picker-select" },
    event: {
      change: () => {
        const selectedOpt = iconSelect.options[iconSelect.selectedIndex];
        selectedIconLink = selectedOpt?.getAttribute("data-link") ?? undefined;
        iconPreview.src = selectedIconLink ?? "";
      },
    },
    children: icons.map((ic) =>
      option({
        attributes: { value: ic.name, "data-link": ic.link },
        children: ic.name,
      })
    ),
  });

  const iconPicker = div({
    attributes: { class: "icon-picker" },
    children: [
      span({ attributes: { class: "icon-picker-label" }, children: "Marker Icon" }),
      div({
        attributes: { class: "icon-picker-row" },
        children: [iconPreview, iconSelect],
      }),
    ],
  });

  const container = div({
    attributes: { class: "speedrun-editor" },
    children: [
      div({
        attributes: { class: "speedrun-bundles-section" },
        children: [
          div({
            attributes: { class: "speedrun-section-header" },
            children: [
              span({ children: "Bundles" }),
              button({
                attributes: { class: "hk-button small" },
                children: "+",
                event: { click: addBundle },
              }),
            ],
          }),
          bundleSelect,
        ],
      }),
      div({
        attributes: { class: "speedrun-stages-section" },
        children: [
          div({
            attributes: { class: "speedrun-section-header" },
            children: [
              span({ children: "Stages" }),
              button({
                attributes: { class: "hk-button small" },
                children: "+ Stage",
                event: { click: addStage },
              }),
            ],
          }),
          stageListContainer,
        ],
      }),
      iconPicker,
      stageDetailContainer,
    ],
  });

  function getActiveBundle() {
    return bundles.find((b) => b.id === activeBundleId);
  }

  function getActiveStage() {
    const bundle = getActiveBundle();
    return bundle?.stages.find((s) => s.id === activeStageId);
  }

  function addBundle() {
    const id = `bundle_${Date.now()}`;
    /** @type {SpeedrunBundle} */
    const bundle = { id, name: `Run ${bundles.length + 1}`, stages: [] };
    bundles.push(bundle);
    activeBundleId = id;
    activeStageId = null;
    save();
    refreshBundleSelect();
    renderStages();
    renderMapLayers();
  }

  function addStage() {
    const bundle = getActiveBundle();
    if (!bundle) return;
    const colorIdx = bundle.stages.length % COLORS.length;
    const id = `stage_${Date.now()}`;
    /** @type {Stage} */
    const stage = { id, name: `Stage ${bundle.stages.length + 1}`, color: COLORS[colorIdx] ?? "#5b6ee1", markers: [] };
    bundle.stages.push(stage);
    activeStageId = id;
    save();
    renderStages();
    renderStageDetail();
    renderMapLayers();
  }

  function refreshBundleSelect() {
    clearChildren(bundleSelect);
    bundles.forEach((b) => {
      bundleSelect.appendChild(
        option({
          attributes: { value: b.id, ...(b.id === activeBundleId ? { selected: true } : {}) },
          children: b.name,
        })
      );
    });
    bundleSelect.value = activeBundleId ?? "";
  }

  function renderStages() {
    clearChildren(stageListContainer);
    const bundle = getActiveBundle();
    if (!bundle) {
      clearChildren(stageDetailContainer);
      return;
    }

    bundle.stages.forEach((stage) => {
      const stageRow = div({
        attributes: { class: `speedrun-stage-row ${stage.id === activeStageId ? "active" : ""}` },
        event: {
          click: () => {
            activeStageId = stage.id;
            renderStages();
            renderStageDetail();
          },
        },
        children: [
          span({
            attributes: { class: "stage-color-dot" },
            props: { style: { backgroundColor: stage.color } },
          }),
          span({ attributes: { class: "stage-name" }, children: stage.name }),
          span({ attributes: { class: "stage-marker-count" }, children: `${stage.markers.length} pts` }),
          button({
            attributes: { class: "hk-button tiny danger" },
            children: "×",
            event: {
              click: (e) => {
                e.stopPropagation();
                bundle.stages = bundle.stages.filter((s) => s.id !== stage.id);
                if (activeStageId === stage.id) activeStageId = null;
                save();
                renderStages();
                renderStageDetail();
                renderMapLayers();
              },
            },
          }),
        ],
      });
      stageListContainer.appendChild(stageRow);
    });
  }

  function renderStageDetail() {
    clearChildren(stageDetailContainer);
    const stage = getActiveStage();
    if (!stage) return;

    const nameInput = input({
      attributes: { type: "text", class: "hk-input", value: stage.name },
      event: {
        input: () => {
          stage.name = nameInput.value;
          save();
          renderStages();
        },
      },
    });

    const placeBtn = button({
      attributes: { class: `hk-button ${placingMarker ? "active" : ""}` },
      children: placingMarker ? "⏹ Stop Placing" : "📍 Place Marker",
      event: {
        click: () => {
          placingMarker = !placingMarker;
          placeBtn.textContent = placingMarker ? "⏹ Stop Placing" : "📍 Place Marker";
          placeBtn.classList.toggle("active", placingMarker);

          if (placingMarker) {
            mapClickHandler = (e) => {
              const activeStg = getActiveStage();
              if (!activeStg || !placingMarker) return;
              /** @type {StageMarker} */
              const marker = {
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                name: `Point ${activeStg.markers.length + 1}`,
                icon: selectedIconLink,
              };
              activeStg.markers.push(marker);
              save();
              renderStageDetail();
              renderMapLayers();
            };
            map.on("click", mapClickHandler);
          } else {
            if (mapClickHandler) {
              map.off("click", mapClickHandler);
              mapClickHandler = null;
            }
          }
        },
      },
    });

    const markersList = div({
      attributes: { class: "speedrun-markers-list" },
      children: stage.markers.map((m, idx) =>
        div({
          attributes: { class: "speedrun-marker-item" },
          children: [
            span({ attributes: { class: "speedrun-marker-idx" }, children: `${idx + 1}` }),
            img({
              attributes: {
                src: m.icon || icons[0]?.link || "",
                alt: m.name,
                class: "speedrun-marker-icon-preview",
              },
            }),
            span({ attributes: { class: "speedrun-marker-name" }, children: m.name }),
            span({ attributes: { class: "speedrun-marker-coords" }, children: `${m.lat.toFixed(1)}, ${m.lng.toFixed(1)}` }),
            button({
              attributes: { class: "hk-button tiny danger" },
              children: "×",
              event: {
                click: () => {
                  stage.markers.splice(idx, 1);
                  save();
                  renderStageDetail();
                  renderMapLayers();
                },
              },
            }),
          ],
        })
      ),
    });

    stageDetailContainer.appendChild(
      div({
        attributes: { class: "speedrun-stage-detail-content" },
        children: [
          div({ attributes: { class: "speedrun-detail-row" }, children: [span({ children: "Name:" }), nameInput] }),
          placeBtn,
          markersList,
        ],
      })
    );
  }

  function renderMapLayers() {
    stageLayerGroups.forEach((group) => {
      map.removeLayer(group);
    });
    stageLayerGroups.clear();

    const bundle = getActiveBundle();
    if (!bundle) return;

    bundle.stages.forEach((stage) => {
      const group = new FeatureGroup();

      const latLngs = stage.markers.map((m) => /** @type {[number, number]} */ ([m.lat, m.lng]));

      /** @type {Polyline | null} */
      let polyline = null;

      if (latLngs.length >= 2) {
        polyline = new Polyline(latLngs, {
          color: stage.color,
          weight: 3,
          opacity: 0.8,
          dashArray: "8, 4",
        });
        group.addLayer(polyline);
      }

      stage.markers.forEach((m, idx) => {
        const marker = new Marker([m.lat, m.lng], {
          draggable: true,
          icon: new Icon({
            iconUrl: m.icon || icons[0]?.link || "assets/markers/pins/Map_Pin_01.webp",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            className: "hk-icon",
          }),
        });

        marker.bindTooltip(`${stage.name}: ${m.name}`, { className: "hk-tooltip" });

        marker.on("drag", () => {
          if (!polyline) return;
          const coords = /** @type {import("leaflet").LatLng[]} */ (polyline.getLatLngs());
          coords[idx] = marker.getLatLng();
          polyline.setLatLngs(coords);
        });

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          m.lat = pos.lat;
          m.lng = pos.lng;
          save();
          renderStageDetail();
        });

        group.addLayer(marker);
      });

      group.addTo(map);
      stageLayerGroups.set(stage.id, group);
    });
  }

  function save() {
    saveBundles(bundles);
  }

  function deleteActiveBundle() {
    if (!activeBundleId) return;
    bundles = bundles.filter((b) => b.id !== activeBundleId);
    activeBundleId = bundles[0]?.id ?? null;
    activeStageId = null;
    save();
    refreshBundleSelect();
    renderStages();
    renderStageDetail();
    renderMapLayers();
  }

  refreshBundleSelect();
  renderStages();
  renderMapLayers();

  return {
    container,
    refresh: renderMapLayers,
    deleteActiveBundle,
  };
}

/**
 * @returns {SpeedrunBundle[]}
 */
function loadBundles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * @param {SpeedrunBundle[]} bundles
 */
function saveBundles(bundles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bundles));
}
