/**
 * @template {unknown | undefined | null} T
 * @param {boolean | T} condition
 * @param {string} [message]
 * @returns {asserts condition}
 */
export function assert(condition, message) {
  if (!condition) {
    throw new Error(message ?? "Assertion failed");
  }
}

/**
 * @template T
 * @param {string} link
 * @returns {Promise<T>}
 */
export async function fetchData(link) {
  return await fetch(link).then((response) => response.json());
}
