import { useCallback, useEffect, useState } from "react";

const KEY = "aveluna:theme";

/** "Tungi rejim": toggles the .dark class on <html>, remembered in this browser. */
export function useDarkMode() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = useCallback(() => {
    setOn((v) => {
      const next = !v;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem(KEY, next ? "dark" : "light");
      return next;
    });
  }, []);
  return { on, toggle };
}

/** Inline script run before paint so a saved dark theme never flashes light. */
export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem("${KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;
