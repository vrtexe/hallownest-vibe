import L, { DomEvent, FeatureGroup, Polyline, Icon, Map, Marker, Point, Popup, TileLayer } from "leaflet";
import { CustomCSR } from "./helper/CustomCSR.js";
import { SettingsPanelControl } from "./helper/CustomControl.js";
import { MAP_EXTENT, MAP_MAX_ZOOM, MAP_ZOOM_MIN, TILE_SERVER_URL } from "./config.js";
import { assert, fetchData } from "./util.js";
import { button, div, h2, img, input, label, option, p, select, textarea } from "html-dom-js";

/** @import { type LatLngExpression, type LatLng } from 'leaflet' */
/** @import { type MultiLineString, type FeatureCollection, type GeometryCollection, type LineString } from 'geojson' */

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

  // L.DomEvent.on()

  // document.querySelector('#map').style.backgroundColor = '#000000';

  // const geo = new Icon({
  //   iconUrl: "assets/markers/Geo.webp",
  //   iconSize: [32, 32],
  //   iconAnchor: [16, 16],
  //   className: "icon-geo",
  // });

  const icons = await loadIcons();
  console.log("Loading icons...");

  const f = new FeatureGroup();
  map.addLayer(f);

  map.on("click", async (e) => {
    // assert(e.latlng.lng);
    // assert(e.latlng.lat);

    // /** @type {FeatureCollection} */
    // const gj = {
    //   type: "FeatureCollection",
    //   bbox: [0, 0, 256, 256],
    //   features: [
    //     {
    //       type: "Feature",
    //       geometry: {
    //         type: "Point",
    //         coordinates: [e.latlng.lng, e.latlng.lat],
    //       },
    //       properties: {},
    //     },
    //     {
    //       type: "Feature",
    //       geometry: {
    //         type: "LineString"
    //       }
    //     }
    //   ],
    // };

    // const s = new GeoJSON(gj);

    // s.feature

    map.openPopup(
      await createMarkerPopup(e.latlng, (marker) => {
        console.log(marker.feature);
        f.addLayer(marker);
        if (f.getLayers().length >= 2) {
          const s = f.toGeoJSON();
          if (s.type === "FeatureCollection") {
            // const points = s.features.map((s) => {
            //   if (s.geometry.type === "Point") {
            //     const [lng, lat] = s.geometry.coordinates;

            //     assert(lat);
            //     assert(lng);

            //     return new LatLng(lat, lng);
            //   }
            // }).filter((s) => s !== undefined);
            /** @type {Polyline<LineString | MultiLineString, any, LatLng[]>} */
            // @ts-ignore type
            const p = new Polyline([]).addTo(map);

            // p.setLatLngs([])

            f.getLayers().forEach((l, i) => {
              if (l instanceof Marker) {
                l.on("move", (e) => {
                  console.log("moved");
                  /** @type {Marker} */
                  const t = e.target;

                  const c = p.getLatLngs();

                  p.setLatLngs([
                    ...c.slice(0, i),
                    t.getLatLng(),
                    ...c.slice(i + 1),
                  ]);
                  //[i];
                });
                // ...p.getLatLngs(),
                // p.getLatLngs()
                // assert(p.getLatLngs() instanceof Array);
                p.setLatLngs([
                  ...p.getLatLngs(),
                  l.getLatLng(),
                ]);
                console.log(l);
              }
              // assert(l instanceof Marker);
            });
            // if (points.length >= 2) {
            // new Polyline(points).addTo(map);
            // }
          }
        }
      }),
    );

    console.log(f.toGeoJSON());
    // .addTo(map);
    // const pp = new

    // const mk = new Marker([e.latlng.lat, e.latlng.lng], {
    //   icon: Object.values(icons)[Math.floor(Math.random() * Object.values(icons).length)],
    //   draggable: true,
    // }).addTo(map);

    // mk.on("click", (ev) => {
    //   ev.originalEvent.stopPropagation();
    //   ev.originalEvent.preventDefault();

    //   setTimeout(() => {
    //     const el = L.DomUtil.create("div", "popup-content");
    //     el.innerHTML = `<h3>Marker Position</h3><p>Latitude:`;
    //     mk.bindPopup(el).openPopup();
    //   });
    // });
  });

  // map.eachLayer((layer) => {
  //   console.log("Layer: ", layer.openTooltip([0, 0]));
  // });

  const c = new SettingsPanelControl({ position: "topleft" }).addTo(map);

  console.log("Map initialized", c);
  // new Marker([150, 150]).addTo(map);
  // new Marker([150, 150]).addTo(map);
  // new Marker([150, 150]).addTo(map);
  // map.eachLayer((layer) => {
  // console.log("Layer: ", layer);
  // });

  // new FeatureGroup([
  //   new Marker([0, 0]),
  //   new Marker([0, 0]),
  //   new Polyline([[0, 0], [1, 1]]),
  // ])
  //   .bindPopup("Hello world!")
  //   .on("click", (e) => {
  //     alert("Clicked on a member of the group!");
  //     console.log(e);
  //   })
  //   .addTo(map);
}

/**
 * @param {LatLngExpression} coordinates
 * @param {(marker: Marker) => void} addMarker
 */
async function createMarkerPopup(coordinates, addMarker) {
  const popup = new Popup(coordinates);
  const [elem, icons, state] = await loadIcons();
  const [mks, st] = markerSettings({});
  const content = div({
    children: [
      div({
        props: {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          },
        },
        children: [
          mks,
          elem,
          div({
            attributes: { class: "icon-select-container" },
            children: [
              label({
                attributes: { for: "icon-select1" },
                children: "Text",
              }),
              select({
                attributes: { id: "icon-select1" },
                children: [
                  option({ children: "Text" }),
                  option({ children: "Text2" }),
                ],
              }),
            ],
          }),
          div({
            children: button({
              children: "Add marker",
              event: {
                click: () => {
                  if (addMarker) {
                    const target = new Marker(coordinates, {
                      icon: state.iconName ? icons[state.iconName] : undefined,
                      draggable: true,
                      interactive: true,
                      title: "test",
                    });

                    target.bindPopup(div({
                      children: [
                        button({
                          event: {
                            click: () => {
                              target.dragging?.disable();
                              target.closePopup();
                              target.unbindPopup();

                              target.feature = {
                                ...target.toGeoJSON(),
                                properties: {
                                  icon: state.iconName,
                                  title: st.title,
                                  content: st.content,
                                },
                              };

                              target.bindPopup(
                                div({
                                  children: [
                                    h2({ children: target.feature?.properties?.title }),
                                    p({ children: target.feature?.properties?.content }),
                                  ],
                                }),
                                {
                                  autoPan: true,
                                },
                              );
                            },
                          },
                          children: "Save",
                        }),
                      ],
                    }));
                    addMarker(target);
                  }
                  popup.remove();
                },
              },
            }),
          }),
        ],
      }),
    ],
  });

  DomEvent.disableClickPropagation(content);
  popup.setContent(content);

  return popup;
}

/**
 * @returns {Promise<[HTMLElement, Record<string, Icon>, { iconName: string | undefined }]>}
 */
async function loadIcons() {
  /**
   *  @type {{name: string, link: string}[]}
   */
  const s = await fetchData("assets/data/icons.json");
  const state = {
    iconName: s[0]?.name,
  };
  // const container = document.getElementById("info");

  // const selecta = document.createElement("select");
  // selecta.id = "icon-select";
  // selecta.title = "Select Icon";

  // const img = document.createElement("img");

  return [
    div({
      children: [
        img({
          attributes: {
            id: "icon-img",
            src: s[0]?.link || "",
          },
          children: [],
        }),
        select({
          attributes: {
            id: "icon-select",
            title: "Select Icon",
          },
          event: {
            change: (e) => {
              const item = e.currentTarget;
              assert(item instanceof HTMLSelectElement);

              const selectedOption = item.options[item.selectedIndex];
              state.iconName = selectedOption?.value;

              const image = document.getElementById("icon-img");

              if (image) {
                assert(image instanceof HTMLImageElement);
                image.src = selectedOption?.getAttribute("data-link") || "";
              }
            },
          },
          children: s.map((icon) =>
            option({
              attributes: {
                value: icon.name,
                "data-link": icon.link,
              },
              children: icon.name,
            })
          ),
        }),
      ],
    }),
    Object.freeze(
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
    ),
    state,
  ];

  // return Object.freeze(
  //   Object.fromEntries(
  //     s.map((icon) => [
  //       icon.name,
  //       new Icon({
  //         iconUrl: icon.link,
  //         iconSize: [36, 36],
  //         iconAnchor: [18, 18],
  //         className: "hk-icon",
  //       }),
  //     ]),
  //   ),
  // );
}

/**
 * @param {{ titleUpdate?: (value: string) => void, contentUpdate?: (value: string) => void }} [event]
 * @returns {[HTMLElement, { title: string, content: string }]}
 */
function markerSettings(event) {
  /** @type {{ title: string, content: string }} */
  const state = {
    title: "",
    content: "",
  };

  return [
    div({
      attributes: { class: "input-list" },
      children: [
        div({
          attributes: { class: "input-container vertical" },
          children: [
            label({ children: "Title" }),
            input({
              attributes: {
                type: "text",
                value: state.title,
              },
              event: {
                input: (e) => {
                  const item = e.currentTarget;
                  assert(item instanceof HTMLInputElement);
                  state.title = item.value;
                  event?.titleUpdate?.(state.title);
                },
              },
            }),
          ],
        }),
        div({
          attributes: { class: "input-container vertical" },
          children: [
            label({ children: "Content" }),
            textarea({
              attributes: {
                value: state.content,
                rows: 4,
              },
              props: {
                style: {
                  resize: "none",
                },
              },
              event: {
                input: (e) => {
                  const item = e.currentTarget;
                  assert(item instanceof HTMLTextAreaElement);
                  state.content = item.value;
                  event?.contentUpdate?.(state.content);
                },
              },
            }),
          ],
        }),
      ],
    }),
    state,
  ];
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
