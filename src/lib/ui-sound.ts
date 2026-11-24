import { useCallback, useEffect, useState } from "react";

/*
 * Small UI sounds made with the browser's Web Audio API — no audio files to load.
 * The AudioContext is created lazily on the first user gesture (browsers block audio before that).
 */
const KEY = "aveluna:sound";
let ctx: AudioContext | null = null;
let enabled = true;
let loaded = false;
const listeners = new Set<(on: boolean) => void>();

function readSetting() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  enabled = window.localStorage.getItem(KEY) !== "0";
}

export function isSoundOn() {
  readSetting();
  return enabled;
}

export function setSoundOn(on: boolean) {
  readSetting();
  enabled = on;
  window.localStorage.setItem(KEY, on ? "1" : "0");
  listeners.forEach((l) => l(on));
}

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(ac: AudioContext, freq: number, start: number, dur: number, peak: number, type: OscillatorType = "sine", endFreq?: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

let lastPop = 0;
/** Short, soft tactile "pop" for taps on buttons, tabs and filters. */
export function playClick() {
  if (!isSoundOn()) return;
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  if (now - lastPop < 0.04) return;
  lastPop = now;
  tone(ac, 880, now, 0.07, 0.06, "sine", 520);
}

/** Warm two-note rising chime for good news: free medicine found, added to calendar, dispensed. */
export function playChime() {
  if (!isSoundOn()) return;
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime + 0.03;
  tone(ac, 659.25, now, 0.45, 0.07); // E5
  tone(ac, 987.77, now + 0.12, 0.6, 0.06); // B5
  tone(ac, 1318.5, now + 0.12, 0.5, 0.015, "triangle"); // soft shimmer
}

/** Sound on/off state for the header toggle, shared across the page and remembered in this browser. */
export function useSoundSetting() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    setOn(isSoundOn());
    listeners.add(setOn);
    return () => {
      listeners.delete(setOn);
    };
  }, []);
  const toggle = useCallback(() => {
    const next = !isSoundOn();
    setSoundOn(next);
    if (next) playClick();
  }, []);
  return { on, toggle };
}

const CLICKABLE = 'button, a[href], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"], [role="menuitem"], summary, label[for]';

/** Plays the click sound for any tap on an interactive element. Mark an element data-sound="off" to skip it. */
export function installClickSounds() {
  const onClick = (e: MouseEvent) => {
    const el = (e.target as Element | null)?.closest?.(CLICKABLE);
    if (!el || el.closest('[data-sound="off"]')) return;
    if (el instanceof HTMLButtonElement && el.disabled) return;
    playClick();
  };
  document.addEventListener("click", onClick, { capture: true });
  return () => document.removeEventListener("click", onClick, { capture: true });
}
