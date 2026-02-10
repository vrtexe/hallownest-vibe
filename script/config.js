export const TILE_SERVER_URL = "assets/tiles/{z}/{x}/{y}.png";

export const MAP_ZOOM_MIN = 0;
export const MAP_MAX_ZOOM = 8;

export const MAP_MAX_RESOLUTION = 0.00390625;
export const MAP_MIN_RESOLUTION = Math.pow(2, MAP_MAX_ZOOM) * MAP_MAX_RESOLUTION;

/** @type {readonly [number, number, number, number]} */
export const TILE_EXTENT = Object.freeze([0.0, 0.0, 256.0, 256.0]);

/** @type {readonly [number, number, number, number]} */
export const MAP_EXTENT = Object.freeze([0.0, 0.0, 256.0, 256.0]);
