import L, { Transformation } from "leaflet";
import { MAP_MIN_RESOLUTION, TILE_EXTENT } from "../config.js";

export class CustomCSR extends L.CRS.Simple {
  /** @override */
  static transformation = new Transformation(1, -TILE_EXTENT[0], -1, TILE_EXTENT[3]);

  /**
   * @param {number} zoom
   * @returns {number}
   * @override
   */
  static scale(zoom) {
    return Math.pow(2, zoom) / MAP_MIN_RESOLUTION;
  }

  /**
   * @param {number} scale
   * @returns {number}
   * @override
   */
  static zoom(scale) {
    return Math.log(scale * MAP_MIN_RESOLUTION) / Math.LN2;
  }
}
