import { object } from "html-dom-js"; /** @import { ElementDData } from "html-dom-js" */

/** @typedef {{ name: string, size?: { height?: number, width?: number } }} IconData */

/**
 * @param {IconData} [icon]
 * @param {Parameters<typeof object>[0]} [data]
 */
export default (icon, data) =>
  object({
    attributes: {
      class: "icon-object",
      type: "image/svg+xml",
      data: `assets/icons/${icon?.name}.svg`,
      width: icon?.size?.width ?? 24,
      height: icon?.size?.height ?? 24,
      ...(data?.attributes ?? {}),
    },
    event: {
      load(e) {
        /** @type {HTMLObjectElement|null} */
        // @ts-ignore type assert
        const target = e.currentTarget;
        const window = target?.contentWindow;
        const styles = createIconStyles(window);

        styles && window?.document.adoptedStyleSheets.push(styles);

        window?.addEventListener("click", () => target?.click());
        /** @type {SVGElement|null|undefined} */
        const svg = window?.document.querySelector("svg");
        svg?.setAttribute("fill", "currentColor");
      },
      ...(data?.event ?? {}),
    },
    props: data?.props,
    children: data?.children,
  });

/**
 * @param {Window|null|undefined} w
 */
function createIconStyles(w) {
  if (!w) return;

  const cssStyle = w?.document.defaultView &&
    new w.document.defaultView.CSSStyleSheet({
      disabled: false,
      baseURL: "style/index.css",
    });

  if (!cssStyle) return;

  cssStyle.insertRule(`
    svg {
      fill: currentColor;
    }
  `);

  return cssStyle;
}
