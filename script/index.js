import L, { Icon, Map, Marker, Point, TileLayer } from "leaflet";
import { div, p, strong } from "html-dom-js";
import { CustomCSR } from "./helper/CustomCSR.js";
import { SettingsPanelControl } from "./helper/CustomControl.js";
import { MAP_EXTENT, MAP_MAX_ZOOM, MAP_ZOOM_MIN, TILE_SERVER_URL } from "./config.js";
import { fetchData } from "./util.js";
import { createSidebarTabs } from "./components/sidebar-tabs.js";
import { createMarkerControls } from "./components/marker-controls.js";
import { createProgressTracker } from "./components/progress-tracker.js";
import { createSpeedrunEditor } from "./components/speedrun-editor.js";

/**
 * @typedef {{ id: string, name: string, icon: string, color: string, trackable: boolean, markers: Array<{id: string, name: string, coordinates: [number, number], description: string, icon?: string}> }} MarkerCategory
 * @typedef {{ categories: MarkerCategory[] }} MarkersData
 */

async function initializeMap() {
  const map = new Map("map", {
    maxZoom: MAP_MAX_ZOOM,
    minZoom: MAP_ZOOM_MIN,
    crs: CustomCSR,
    zoomControl: false,
  });

  createDefaultTileLayer().addTo(map);

  map.fitBounds(
    new L.LatLngBounds(
      CustomCSR.unproject(new Point(MAP_EXTENT[2], MAP_EXTENT[3])),
      CustomCSR.unproject(new Point(MAP_EXTENT[0], MAP_EXTENT[1])),
    ),
  );

  /** @type {MarkersData} */
  const markersData = await fetchData("assets/data/markers.json");
  /** @type {Array<{name: string, link: string}>} */
  const iconsData = await fetchData("assets/data/icons.json");

  /** @type {globalThis.Map<string, L.LayerGroup>} */
  const categoryLayers = new globalThis.Map();

  markersData.categories.forEach((cat) => {
    const layerGroup = new L.LayerGroup();

    const catIcon = new Icon({
      iconUrl: cat.icon,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: "hk-icon",
    });

    cat.markers.forEach((m) => {
      const markerIcon = m.icon
        ? new Icon({ iconUrl: m.icon, iconSize: [32, 32], iconAnchor: [16, 16], className: "hk-icon" })
        : catIcon;

      const marker = new Marker(m.coordinates, {
        icon: markerIcon,
        title: m.name,
      });

      marker.bindTooltip(m.name, {
        className: "hk-tooltip",
        direction: "top",
        offset: [0, -16],
      });

      if (m.description) {
        marker.bindPopup(
          div({
            attributes: { class: "hk-popup-content" },
            children: [
              strong({ attributes: { class: "hk-popup-title" }, children: m.name }),
              p({ attributes: { class: "hk-popup-desc" }, children: m.description }),
            ],
          }),
          { className: "hk-popup" },
        );
      }

      layerGroup.addLayer(marker);
    });

    layerGroup.addTo(map);
    categoryLayers.set(cat.id, layerGroup);
  });

  const markerControls = createMarkerControls({
    categories: markersData.categories,
    onToggle: (categoryId, enabled) => {
      const layer = categoryLayers.get(categoryId);
      if (!layer) return;
      if (enabled) {
        layer.addTo(map);
      } else {
        map.removeLayer(layer);
      }
    },
  });

  const trackableCategories = markersData.categories.filter((c) => c.trackable);
  const progressTracker = createProgressTracker({ categories: trackableCategories });

  const speedrunEditor = createSpeedrunEditor({ map, icons: iconsData });

  const sidebarTabs = createSidebarTabs({
    tabs: [
      {
        id: "layers",
        label: "Layers",
        icon: "🗺",
        content: () => markerControls.container,
      },
      {
        id: "progress",
        label: "Progress",
        icon: "◆",
        content: () => progressTracker.container,
      },
      {
        id: "speedrun",
        label: "Routes",
        icon: "⚡",
        content: () => speedrunEditor.container,
      },
    ],
    defaultTab: "layers",
  });

  new SettingsPanelControl({
    position: "topleft",
    sidebarContent: sidebarTabs.container,
  }).addTo(map);
}

function createDefaultTileLayer() {
  return new TileLayer(TILE_SERVER_URL, {
    minZoom: MAP_ZOOM_MIN,
    maxZoom: MAP_MAX_ZOOM,
    attribution: "",
    noWrap: true,
    tms: false,
  });
}

initializeMap();
