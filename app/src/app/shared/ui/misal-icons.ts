import { addIcons } from 'ionicons';

/**
 * Misal icon set: thin square-cap strokes on a 24px grid that match the
 * book typography. Register once with `registerMisalIcons()` and use them as
 * `<ion-icon name="m-share">`. Every icon inherits `currentColor`.
 */
const svg = (body: string) =>
  'data:image/svg+xml;utf8,' +
  (
`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='square' stroke-linejoin='miter'>${body}</svg>`
  );

export const MISAL_ICONS: Record<string, string> = {
  'm-today': svg("<circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'/>"),
  'm-bible': svg("<path d='M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20'/><path d='M12 6v6M9.5 8.2h5'/>"),
  'm-candle': svg("<path d='M12 2.5c1.4 1.6 1.4 3 0 4.2-1.4-1.2-1.4-2.6 0-4.2z'/><path d='M9 10h6v11H9z'/><path d='M6 21h12'/>"),
  'm-heart': svg("<path d='M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z'/>"),
  'm-church': svg("<path d='M12 2v5M10 4h4'/><path d='M6 21V11l6-4 6 4v10'/><path d='M3 21h18'/><path d='M10 21v-4a2 2 0 0 1 4 0v4'/>"),
  'm-calendar': svg("<rect x='3' y='5' width='18' height='16'/><path d='M3 10h18M8 3v4M16 3v4'/>"),
  'm-share': svg("<path d='M4 12v8h16v-8'/><path d='M16 6l-4-4-4 4'/><path d='M12 2v13'/>"),
  'm-image': svg("<rect x='3' y='3' width='18' height='18'/><circle cx='9' cy='9' r='2'/><path d='M21 15l-5-5L5 21'/>"),
  'm-read': svg("<path d='M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z'/><path d='M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z'/>"),
  'm-copy': svg("<rect x='8' y='8' width='13' height='13'/><path d='M16 8V3H3v13h5'/>"),
  'm-bookmark': svg("<path d='M6 3h12v18l-6-4-6 4z'/>"),
  'm-bookmark-fill': 'data:image/svg+xml;utf8,' + (
"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' stroke='currentColor' stroke-width='1.5'><path d='M6 3h12v18l-6-4-6 4z'/></svg>"
  ),
  'm-search': svg("<circle cx='11' cy='11' r='7'/><path d='M20 20l-3.5-3.5'/>"),
  'm-close': svg("<path d='M6 6l12 12M18 6L6 18'/>"),
  'm-back': svg("<path d='M15 6l-6 6 6 6'/>"),
  'm-forward': svg("<path d='M9 6l6 6-6 6'/>"),
  'm-down': svg("<path d='M6 9l6 6 6-6'/>"),
  'm-up': svg("<path d='M6 15l6-6 6 6'/>"),
  'm-pin': svg("<path d='M12 17v5'/><path d='M8 3h8l-1 6 3 4H6l3-4z'/>"),
  'm-trash': svg("<path d='M4 7h16M10 11v6M14 11v6'/><path d='M6 7l1 14h10l1-14'/><path d='M9 7V3h6v4'/>"),
  'm-location': svg("<path d='M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z'/><circle cx='12' cy='9' r='2.5'/>"),
  'm-locate': svg("<circle cx='12' cy='12' r='7'/><circle cx='12' cy='12' r='2'/><path d='M12 1v4M12 19v4M1 12h4M19 12h4'/>"),
  'm-info': svg("<circle cx='12' cy='12' r='9'/><path d='M12 11v6M12 7.5v.5'/>"),
  'm-download': svg("<path d='M4 15v5h16v-5'/><path d='M8 11l4 4 4-4'/><path d='M12 3v12'/>"),
  'm-plus': svg("<path d='M12 5v14M5 12h14'/>"),
  'm-minus': svg("<path d='M5 12h14'/>"),
  'm-check': svg("<path d='M5 12.5l4.5 4.5L19 7'/>"),
  'm-map': svg("<path d='M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z'/><path d='M9 3v15M15 6v15'/>"),
  'm-list': svg("<path d='M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1'/>"),
  'm-phone': svg("<path d='M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z'/>"),
  'm-globe': svg("<circle cx='12' cy='12' r='9'/><path d='M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18'/>"),
  'm-clock': svg("<circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 2'/>"),
  'm-star': svg("<path d='M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z'/>"),
  'm-star-fill': 'data:image/svg+xml;utf8,' + (
"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' stroke='currentColor' stroke-width='1.5' stroke-linejoin='miter'><path d='M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z'/></svg>"
  ),
  'm-edit': svg("<path d='M4 20h4L19 9l-4-4L4 16z'/><path d='M13.5 6.5l4 4'/>"),
  'm-refresh': svg("<path d='M20 11a8 8 0 1 0-2.3 5.7'/><path d='M20 4v7h-7'/>"),
  'm-text': svg("<path d='M4 20l6-16 6 16M6.3 14h7.4'/><path d='M17 20l2.5-7 2.5 7M18 18h3'/>"),
  'm-sun': svg("<circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M2 12h2M20 12h2'/>"),
  'm-moon': svg("<path d='M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z'/>"),
  'm-filter': svg("<path d='M3 5h18M6 12h12M10 19h4'/>"),
  'm-external': svg("<path d='M14 3h7v7'/><path d='M21 3l-9 9'/><path d='M19 14v7H3V5h7'/>"),
};

let registered = false;

export function registerMisalIcons(): void {
  if (registered) return;
  addIcons(MISAL_ICONS);
  registered = true;
}
