import { useCallback, useEffect, useState } from "react";

export type Lang = "uz" | "uzn" | "ru" | "en";
export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: "uz", label: "O'zbekcha", short: "UZ" },
  { id: "uzn", label: "O'zbekcha (yangi lotin)", short: "UZ+" },
  { id: "ru", label: "Русский", short: "RU" },
  { id: "en", label: "English", short: "EN" },
];
const KEY = "aveluna:lang";
const EVT = "aveluna:lang";

const DICT = {
  home: { uz: "Bosh panel", ru: "Панель", en: "Dashboard" },
  login: { uz: "Kirish", ru: "Войти", en: "Sign in" },
  logout: { uz: "Chiqish", ru: "Выйти", en: "Sign out" },
  guide: { uz: "Qo'llanma", ru: "Руководство", en: "Guide" },
  medicines: { uz: "Dorilar", ru: "Лекарства", en: "Medicines" },
  pharmacies: { uz: "Dorixonalar", ru: "Аптеки", en: "Pharmacies" },
  language: { uz: "Til", ru: "Язык", en: "Language" },
  menu: { uz: "Menyu", ru: "Меню", en: "Menu" },
  large: { uz: "Kattaroq shrift", ru: "Крупный шрифт", en: "Larger text" },
  sound: { uz: "Ovoz", ru: "Звук", en: "Sound" },
  dark: { uz: "Tungi rejim", ru: "Ночной режим", en: "Dark mode" },
} as const;
export type TKey = keyof typeof DICT;

export function toNewLatin(s: string) {
  return s
    .replace(/sh/g, "ş").replace(/S[hH]/g, "Ş")
    .replace(/ch/g, "ç").replace(/C[hH]/g, "Ç")
    .replace(/o['‘’ʻ`]/g, "ō").replace(/O['‘’ʻ`]/g, "Ō")
    .replace(/g['‘’ʻ`]/g, "ḡ").replace(/G['‘’ʻ`]/g, "Ḡ");
}

type Mode = "uz" | "uzn" | "ru" | "en";
const originals = new Map<Text, string>();
const attrOriginals = new Map<Element, string>();
let observer: MutationObserver | null = null;
let mode: Mode = "uz";
const pending = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;
const cacheKey = (l: string) => `aveluna:tr:${l}`;
const caches: Record<string, Record<string, string>> = {};
function cache(l: string) {
  if (!caches[l]) { try { caches[l] = JSON.parse(localStorage.getItem(cacheKey(l)) || "{}"); } catch { caches[l] = {}; } }
  return caches[l]!;
}
const NEEDS = /[A-Za-z\u0400-\u04FF]{2,}/;

function render(src: string): string | null {
  if (mode === "uzn") return toNewLatin(src);
  const c = cache(mode);
  const key = src.trim();
  if (!key || !NEEDS.test(key)) return null;
  const hit = c[key];
  if (hit === undefined) { queue(key); return null; }
  return src.replace(key, hit);
}
function queue(k: string) {
  if (k.length > 400) return;
  pending.add(k);
  if (!timer) timer = setTimeout(flush, 150);
}
async function flush() {
  timer = null;
  const l = mode;
  if (l !== "ru" && l !== "en") { pending.clear(); return; }
  const all = [...pending]; pending.clear();
  const { translateTexts } = await import("@/lib/translate.functions");
  for (let i = 0; i < all.length; i += 60) {
    const batch = all.slice(i, i + 60);
    try {
      const out = await translateTexts({ data: { lang: l, texts: batch } });
      const c = cache(l);
      batch.forEach((t, j) => { c[t] = out[j] ?? t; });
      localStorage.setItem(cacheKey(l), JSON.stringify(c));
    } catch { /* keep Uzbek on failure */ }
  }
  if (mode === l) apply(document.body);
}
function skip(el: Element | null) { return !!el?.closest("script,style,textarea,[data-no-translate]"); }
function apply(root: Node) {
  if (mode === "uz") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  const mine = observer; mine?.disconnect();
  while ((n = walker.nextNode())) {
    const t = n as Text;
    if (skip(t.parentElement)) continue;
    const src = originals.get(t) ?? t.nodeValue ?? "";
    const out = render(src);
    if (out !== null && out !== t.nodeValue) { originals.set(t, src); t.nodeValue = out; }
  }
  if (root instanceof Element || root === document.body) {
    (root as Element).querySelectorAll?.("[placeholder],[title],[aria-label]").forEach((el) => {
      for (const a of ["placeholder", "title", "aria-label"]) {
        const v = el.getAttribute(a); if (!v) continue;
        const k = `${a}\u0000`;
        const key = el as Element & { __o?: Record<string, string> };
        key.__o ??= {}; const src = key.__o[a] ?? v;
        const out = render(src);
        if (out !== null && out !== v) { key.__o[a] = src; el.setAttribute(a, out); attrOriginals.set(el, k); }
      }
    });
  }
  mine?.observe(document.body, { subtree: true, childList: true, characterData: true });
}
function restore() {
  originals.forEach((v, t) => { if (t.isConnected) t.nodeValue = v; });
  originals.clear();
  attrOriginals.forEach((_, el) => {
    const o = (el as Element & { __o?: Record<string, string> }).__o;
    if (o) for (const a in o) el.setAttribute(a, o[a]!);
    delete (el as Element & { __o?: Record<string, string> }).__o;
  });
  attrOriginals.clear();
}
function setMode(next: Mode) {
  observer?.disconnect(); observer = null;
  restore();
  mode = next;
  if (next === "uz") return;
  observer = new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === "characterData") {
        const t = m.target as Text;
        if (originals.get(t) !== undefined && t.nodeValue !== render(originals.get(t)!)) originals.delete(t);
        apply(t.parentNode ?? t);
      } else m.addedNodes.forEach((a) => apply(a));
    }
  });
  apply(document.body);
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>("uz");
  useEffect(() => {
    const read = () => setLangState((localStorage.getItem(KEY) as Lang) || "uz");
    read();
    window.addEventListener(EVT, read);
    return () => window.removeEventListener(EVT, read);
  }, []);
  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(KEY, l);
    document.documentElement.lang = l === "ru" ? "ru" : l === "en" ? "en" : "uz";
    window.dispatchEvent(new Event(EVT));
  }, []);
  const t = useCallback((k: TKey) => (lang === "ru" || lang === "en" ? DICT[k][lang] : DICT[k].uz), [lang]);
  return { lang, setLang, t };
}

/** Mount once: applies the New Latin conversion to the whole page. */
export function useLangEffects() {
  const { lang } = useLang();
  useEffect(() => {
    setMode(lang);
  }, [lang]);
}
