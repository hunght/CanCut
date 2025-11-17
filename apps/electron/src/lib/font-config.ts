// Font class names matching Google Fonts families
// These fonts are loaded via CSS imports in global.css
export const FONT_CLASS_MAP = {
  Inter: "font-inter",
  Roboto: "font-roboto",
  "Open Sans": "font-open-sans",
  "Playfair Display": "font-playfair-display",
  "Comic Neue": "font-comic-neue",
  Arial: "",
  Helvetica: "",
  "Times New Roman": "",
  Georgia: "",
} as const;

// Font configuration objects for compatibility
export const fonts = {
  inter: { className: "font-inter" },
  roboto: { className: "font-roboto" },
  openSans: { className: "font-open-sans" },
  playfairDisplay: { className: "font-playfair-display" },
  comicNeue: { className: "font-comic-neue" },
};

// Default font for the body
export const defaultFont = fonts.inter;
