import { button, div, input, option, select, span, strong } from "html-dom-js";
import { Icon, Marker, Popup } from "leaflet";

/**
 * @typedef {import('../index.js').MarkerCategory} MarkerCategory
 * @typedef {import('../index.js').MarkersData} MarkersData
 */

/**
 * @param {{
 *   map: import("leaflet").Map,
 *   markersData: MarkersData,
 *   categoryLayers: globalThis.Map<string, import("leaflet").LayerGroup>
 * }} options
 */
export function createAdminEditor(options) {
  const { map, markersData, categoryLayers } = options;

  let editMode = false;
  let skipNextMapClick = false;

  /** @type {globalThis.Map<import("leaflet").Marker, {id: string, name: string, coordinates: [number, number], description: string, icon?: string}>} */
  const markerDataMap = new globalThis.Map();

  /** @type {globalThis.Map<import("leaflet").Marker, import("leaflet").Popup | null>} */
  const originalPopups = new globalThis.Map();

  /** @type {globalThis.Map<import("leaflet").Marker, () => void>} */
  const markerClickFlagHandlers = new globalThis.Map();

  let movedCount = 0;
  let addedCount = 0;
  let removedCount = 0;

  /** @type {Set<string>} */
  const movedMarkerIds = new Set();

  /** @type {((e: import("leaflet").LeafletMouseEvent) => void) | null} */
  let editMapClickHandler = null;

  buildMarkerDataMap();

  const statusLabel = span({ attributes: { class: "admin-status-label" }, children: "Edit mode off" });
  const movedLabel = span({ attributes: { class: "admin-moved-count" }, children: "0 markers moved" });
  const addedLabel = span({ attributes: { class: "admin-added-count" }, children: "0 markers added" });
  const removedLabel = span({ attributes: { class: "admin-removed-count" }, children: "0 markers removed" });

  const toggleBtn = button({
    attributes: { class: "hk-button admin-toggle-btn" },
    children: "🔓 Enable Edit Mode",
    event: {
      click: () => {
        editMode = !editMode;
        if (editMode) {
          enableEditMode();
        } else {
          disableEditMode();
        }
      },
    },
  });

  const saveBtn = button({
    attributes: { class: "hk-button admin-save-btn" },
    children: "💾 Save & Download JSON",
    event: {
      click: () => {
        downloadMarkersJson();
      },
    },
  });

  const resetBtn = button({
    attributes: { class: "hk-button danger admin-reset-btn" },
    children: "↩ Reset All Changes",
    event: {
      click: () => {
        const totalChanges = movedCount + addedCount + removedCount;
        if (totalChanges === 0) return;
        if (!confirm("Reset all marker changes? This reverts to the last saved state.")) return;
        window.location.reload();
      },
    },
  });

  const container = div({
    attributes: { class: "admin-editor" },
    children: [
      div({
        attributes: { class: "admin-section" },
        children: [
          div({
            attributes: { class: "admin-section-header" },
            children: [span({ children: "Admin — Marker Editor" })],
          }),
          statusLabel,
        ],
      }),
      div({
        attributes: { class: "admin-controls" },
        children: [toggleBtn],
      }),
      div({
        attributes: { class: "admin-stats" },
        children: [movedLabel, addedLabel, removedLabel],
      }),
      div({
        attributes: { class: "admin-actions" },
        children: [saveBtn, resetBtn],
      }),
    ],
  });

  // ── Data map ──────────────────────────────────────────────

  function buildMarkerDataMap() {
    markerDataMap.clear();
    markersData.categories.forEach((cat) => {
      const layerGroup = categoryLayers.get(cat.id);
      if (!layerGroup) return;

      /** @type {globalThis.Map<string, typeof cat.markers[number]>} */
      const posIndex = new globalThis.Map();
      cat.markers.forEach((m) => {
        const key = `${m.coordinates[0].toFixed(6)},${m.coordinates[1].toFixed(6)}`;
        posIndex.set(key, m);
      });

      layerGroup.eachLayer((layer) => {
        const marker = /** @type {import("leaflet").Marker} */ (layer);
        if (typeof marker.getLatLng !== "function") return;
        const ll = marker.getLatLng();
        const key = `${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}`;
        const data = posIndex.get(key);
        if (data) {
          markerDataMap.set(marker, data);
        }
      });
    });
  }

  // ── Edit mode toggle ──────────────────────────────────────

  function enableEditMode() {
    toggleBtn.textContent = "🔒 Disable Edit Mode";
    toggleBtn.classList.add("active");
    statusLabel.textContent = "Edit mode ON — drag to move, click marker to delete, click map to add";
    map.getContainer().classList.add("admin-edit-mode");

    enableDragging();
    bindAdminPopups();
    startMapClickListener();
  }

  function disableEditMode() {
    toggleBtn.textContent = "🔓 Enable Edit Mode";
    toggleBtn.classList.remove("active");
    statusLabel.textContent = "Edit mode off";
    map.getContainer().classList.remove("admin-edit-mode");

    disableDragging();
    restoreOriginalPopups();
    stopMapClickListener();
    map.closePopup();
  }

  // ── Dragging ──────────────────────────────────────────────

  function enableDragging() {
    markerDataMap.forEach((_data, marker) => {
      if (marker.dragging) {
        marker.dragging.enable();
      }
      marker.on("dragend", onMarkerDragEnd);
    });
  }

  function disableDragging() {
    markerDataMap.forEach((_data, marker) => {
      if (marker.dragging) {
        marker.dragging.disable();
      }
      marker.off("dragend", onMarkerDragEnd);
    });
  }

  /** @param {import("leaflet").DragEndEvent} e */
  function onMarkerDragEnd(e) {
    const marker = /** @type {import("leaflet").Marker} */ (e.target);
    const data = markerDataMap.get(marker);
    if (!data) return;

    const pos = marker.getLatLng();
    data.coordinates[0] = pos.lat;
    data.coordinates[1] = pos.lng;

    if (!movedMarkerIds.has(data.id)) {
      movedMarkerIds.add(data.id);
      movedCount++;
    }
    movedLabel.textContent = `${movedCount} marker${movedCount !== 1 ? "s" : ""} moved`;
  }

  // ── Admin popups (delete action) ──────────────────────────

  function bindAdminPopups() {
    markerDataMap.forEach((data, marker) => {
      bindAdminPopupToMarker(marker, data);
    });
  }

  /**
   * @param {import("leaflet").Marker} marker
   * @param {{id: string, name: string, coordinates: [number, number], description: string, icon?: string}} data
   */
  function bindAdminPopupToMarker(marker, data) {
    const existingPopup = marker.getPopup() ?? null;
    originalPopups.set(marker, existingPopup);
    if (existingPopup) {
      marker.unbindPopup();
    }

    const deleteBtn = button({
      attributes: { class: "hk-button danger small" },
      children: "🗑 Delete",
      event: {
        click: () => {
          map.closePopup();
          removeMarker(marker);
        },
      },
    });

    const popupContent = div({
      props: { style: { display: "flex", flexDirection: "column", gap: "6px", minWidth: "120px" } },
      children: [
        strong({ children: data.name }),
        deleteBtn,
      ],
    });

    marker.bindPopup(popupContent, { className: "hk-popup" });

    // Flag handler: set skipNextMapClick so map click doesn't fire after marker click
    const flagHandler = () => {
      skipNextMapClick = true;
    };
    marker.on("click", flagHandler);
    markerClickFlagHandlers.set(marker, flagHandler);
  }

  function restoreOriginalPopups() {
    markerDataMap.forEach((_data, marker) => {
      restoreOriginalPopupForMarker(marker);
    });
  }

  /** @param {import("leaflet").Marker} marker */
  function restoreOriginalPopupForMarker(marker) {
    marker.unbindPopup();

    const original = originalPopups.get(marker);
    if (original) {
      marker.bindPopup(original);
    }
    originalPopups.delete(marker);

    const flagHandler = markerClickFlagHandlers.get(marker);
    if (flagHandler) {
      marker.off("click", flagHandler);
      markerClickFlagHandlers.delete(marker);
    }
  }

  // ── Map click listener (add marker) ───────────────────────

  function startMapClickListener() {
    editMapClickHandler = (e) => {
      if (skipNextMapClick) {
        skipNextMapClick = false;
        return;
      }
      openAddPopup(e.latlng);
    };
    map.on("click", editMapClickHandler);
  }

  function stopMapClickListener() {
    if (editMapClickHandler) {
      map.off("click", editMapClickHandler);
      editMapClickHandler = null;
    }
  }

  /** @param {import("leaflet").LatLng} latlng */
  function openAddPopup(latlng) {
    const categorySelect = select({
      attributes: { class: "hk-select" },
      props: { style: { width: "100%" } },
      children: markersData.categories.map((cat) =>
        option({
          attributes: { value: cat.id },
          children: cat.name,
        })
      ),
    });

    const nameInput = input({
      attributes: { type: "text", placeholder: "Marker name", class: "hk-input" },
      props: { style: { width: "100%" } },
    });

    const saveMarkerBtn = button({
      attributes: { class: "hk-button small" },
      children: "💾 Save",
      event: {
        click: () => {
          const name = nameInput.value.trim();
          if (!name) {
            nameInput.focus();
            return;
          }
          const catId = categorySelect.value;
          map.closePopup();
          addMarkerAtPosition(latlng, name, catId);
        },
      },
    });

    const popupContent = div({
      props: { style: { display: "flex", flexDirection: "column", gap: "6px", minWidth: "160px" } },
      children: [
        strong({ children: "Add Marker" }),
        div({
          props: { style: { display: "flex", flexDirection: "column", gap: "2px" } },
          children: [
            span({ props: { style: { fontSize: "11px", opacity: "0.8" } }, children: "Category:" }),
            categorySelect,
          ],
        }),
        div({
          props: { style: { display: "flex", flexDirection: "column", gap: "2px" } },
          children: [
            span({ props: { style: { fontSize: "11px", opacity: "0.8" } }, children: "Name:" }),
            nameInput,
          ],
        }),
        saveMarkerBtn,
      ],
    });

    const popup = new Popup({ className: "hk-popup", closeButton: true })
      .setLatLng(latlng)
      .setContent(popupContent)
      .openOn(map);

    setTimeout(() => nameInput.focus(), 50);
  }

  // ── Add marker ────────────────────────────────────────────

  /**
   * @param {import("leaflet").LatLng} latlng
   * @param {string} name
   * @param {string} catId
   */
  function addMarkerAtPosition(latlng, name, catId) {
    const cat = markersData.categories.find((c) => c.id === catId);
    if (!cat) return;

    const layerGroup = categoryLayers.get(catId);
    if (!layerGroup) return;

    const markerData = {
      id: `${catId}_custom_${Date.now()}`,
      name,
      coordinates: /** @type {[number, number]} */ ([latlng.lat, latlng.lng]),
      description: "",
    };

    cat.markers.push(markerData);

    const catIcon = new Icon({
      iconUrl: cat.icon,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: "hk-icon",
    });

    const leafletMarker = new Marker(markerData.coordinates, {
      icon: catIcon,
      title: markerData.name,
    });

    leafletMarker.bindTooltip(markerData.name, {
      className: "hk-tooltip",
      direction: "top",
      offset: [0, -16],
    });

    layerGroup.addLayer(leafletMarker);
    markerDataMap.set(leafletMarker, markerData);

    if (leafletMarker.dragging) {
      leafletMarker.dragging.enable();
    }
    leafletMarker.on("dragend", onMarkerDragEnd);
    bindAdminPopupToMarker(leafletMarker, markerData);

    addedCount++;
    addedLabel.textContent = `${addedCount} marker${addedCount !== 1 ? "s" : ""} added`;
  }

  // ── Remove marker ─────────────────────────────────────────

  /** @param {import("leaflet").Marker} marker */
  function removeMarker(marker) {
    const data = markerDataMap.get(marker);
    if (!data) return;

    for (const cat of markersData.categories) {
      const idx = cat.markers.indexOf(data);
      if (idx !== -1) {
        cat.markers.splice(idx, 1);
        const layerGroup = categoryLayers.get(cat.id);
        if (layerGroup) {
          layerGroup.removeLayer(marker);
        }
        break;
      }
    }

    markerDataMap.delete(marker);
    originalPopups.delete(marker);

    const flagHandler = markerClickFlagHandlers.get(marker);
    if (flagHandler) {
      marker.off("click", flagHandler);
      markerClickFlagHandlers.delete(marker);
    }

    marker.off("dragend", onMarkerDragEnd);

    removedCount++;
    removedLabel.textContent = `${removedCount} marker${removedCount !== 1 ? "s" : ""} removed`;
  }

  // ── Save / Download ───────────────────────────────────────

  function downloadMarkersJson() {
    const json = JSON.stringify(markersData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "markers.json";
    a.click();

    URL.revokeObjectURL(url);
  }

  return { container };
}
