import { createContext } from 'react';

export const AppContext = createContext({
  // Sfondo generale
  bgImageUrl: null,
  setBgImageUrl: () => {},
  // Slideshow
  slideshowPresets: [],
  setSlideshowPresets: () => {},
  activeSlideshowId: null,
  setActiveSlideshowId: () => {},
  // Temi
  themes: [],
  setThemes: () => {},
  activeGeneralThemeId: null,
  setActiveGeneralThemeId: () => {},
  // Tolkien
  tolkienBgUrl: null,
  setTolkienBgUrl: () => {},
  activeTolkienThemeId: null,
  setActiveTolkienThemeId: () => {},
});
