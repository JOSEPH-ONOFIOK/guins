// Site theme: Dark (the default) or Light. The choice is saved in this browser.
// THEME_BOOT runs in <head> before paint so a saved Light theme never flashes dark first.

export type Mode = "dark" | "light";
export const MODES: Mode[] = ["dark", "light"];
const KEY = "guins_theme";
const EVENT = "guins-theme";

export const THEME_BOOT = `try{if(localStorage.getItem("${KEY}")==="light")document.documentElement.setAttribute("data-light","")}catch(e){}`;

export function readMode(): Mode {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

let fadeTimer = 0;

export function setMode(mode: Mode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {}
  const html = document.documentElement;
  html.classList.add("theme-fade");
  clearTimeout(fadeTimer);
  fadeTimer = window.setTimeout(() => html.classList.remove("theme-fade"), 1100);
  html.toggleAttribute("data-light", mode === "light");
  window.dispatchEvent(new Event(EVENT));
}

export function onModeChange(fn: () => void) {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}
