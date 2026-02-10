import L, { Icon, Map, Marker, Point, Polyline, TileLayer } from "leaflet";
import { CustomCSR } from "./helper/CustomCSR.js";
import { CustomControl } from "./helper/CustomControl.js";
import { MAP_EXTENT, MAP_MAX_ZOOM, MAP_ZOOM_MIN, TILE_SERVER_URL } from "./config.js";
import { assert, fetchData } from "./util.js";

async function initializeMap() {
  const map = new Map("map", {
    maxZoom: MAP_MAX_ZOOM,
    minZoom: MAP_ZOOM_MIN,
    crs: CustomCSR,
  });

  createDefaultTileLayer().addTo(map);

  map.fitBounds(
    new L.LatLngBounds(
      CustomCSR.unproject(new Point(MAP_EXTENT[2], MAP_EXTENT[3])),
      CustomCSR.unproject(new Point(MAP_EXTENT[0], MAP_EXTENT[1])),
    ),
  );

  // L.DomEvent.on()

  // document.querySelector('#map').style.backgroundColor = '#000000';

  const geo = new Icon({
    iconUrl: "assets/markers/Geo.webp",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: "icon-geo",
  });

  const icons = await loadIcons();
  console.log("Loading icons...");

  map.on("click", (e) => {
    console.log("Clicked at: ", e.latlng);

    // assert(e.latlng.lng);
    // assert(e.latlng.lat);

    const mk = new Marker([e.latlng.lat, e.latlng.lng], {
      icon: Object.values(icons)[Math.floor(Math.random() * Object.values(icons).length)],
      draggable: true,
    }).addTo(map);

    mk.on("click", (ev) => {
      ev.originalEvent.stopPropagation();
      ev.originalEvent.preventDefault();
      console.log("here-123");
      setTimeout(() => {
        const el = L.DomUtil.create("div", "popup-content");
        el.innerHTML = `<h3>Marker Position</h3><p>Latitude:`;
        mk.bindPopup(el).openPopup();
      });
    });
  });

  // map.eachLayer((layer) => {
  //   console.log("Layer: ", layer.openTooltip([0, 0]));
  // });

  const c = new CustomControl().addTo(map);

  // new
  console.log("Map initialized", c);
  new Marker([150, 150]).addTo(map);
  new Marker([150, 150]).addTo(map);
  new Marker([150, 150]).addTo(map);
  map.eachLayer((layer) => {
    console.log("Layer: ", layer);
  });

  new L.FeatureGroup([new Marker([0, 0]), new Marker([0, 0]), new Polyline([[0, 0], [1, 1]])])
    .bindPopup("Hello world!")
    .on("click", (e) => {
      alert("Clicked on a member of the group!");
      console.log(e);
    })
    .addTo(map);
}

async function loadIcons() {
  /** @type {{name: string, link: string}[]} */
  const s = await fetchData("assets/data/icons.json");

  const container = document.getElementById("info");

  const select = document.createElement("select");
  select.id = "icon-select";
  select.title = "Select Icon";

  const img = document.createElement("img");
  s.map((icon) => {
    const option = document.createElement("option");
    option.value = icon.name;
    option.text = icon.name;
    option.setAttribute("data-link", icon.link);

    select.appendChild(option);
  });

  select.addEventListener("change", (event) => {
    const item = event.currentTarget;

    assert(item instanceof HTMLSelectElement);

    const selectedOption = select.options[item.selectedIndex];

    assert(selectedOption instanceof HTMLOptionElement);
    img.src = selectedOption.getAttribute("data-link") || "";
  });

  container?.appendChild(select);
  container?.appendChild(img);

  return Object.freeze(
    Object.fromEntries(
      s.map((icon) => [
        icon.name,
        new Icon({
          iconUrl: icon.link,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          className: "hk-icon",
        }),
      ]),
    ),
  );
}

// element {
// 	background-color: #14152b;
// 	border-radius: 1000px;
// 	aspect-ratio: 1/1;
// 	height: 36px;
// 	border: 2px solid #585b6d;
// 	box-shadow: 0px 0 0 1px white, 0px 0px 4px 0 #000;
// 	padding: 3px;
// 	width: 36px;
// }

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
