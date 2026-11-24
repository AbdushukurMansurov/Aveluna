import { useEffect, useRef, useState } from "react";
import { failedAttempt, type AttemptState } from "./security-validation";

// A UX deterrent only: backend authentication remains the security boundary.
export function useAuthCooldown(kind: "login" | "signup") {
  const key = `aveluna:security:${kind}`;
  const state = useRef<AttemptState>({ failures: 0, lockedUntil: 0 });
  const [seconds, setSeconds] = useState(0);
  const [ready, setReady] = useState(false);
  function read() {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
      if (raw && typeof raw === "object" && "failures" in raw && "lockedUntil" in raw && typeof raw.failures === "number" && typeof raw.lockedUntil === "number") state.current = { failures: raw.failures, lockedUntil: raw.lockedUntil };
    } catch { /* Storage may be unavailable. Keep the in-memory deterrent. */ }
    setSeconds(Math.max(0, Math.ceil((state.current.lockedUntil - Date.now()) / 1000)));
  }
  function save(next: AttemptState) {
    state.current = next;
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Keep in-memory state. */ }
    setSeconds(Math.max(0, Math.ceil((next.lockedUntil - Date.now()) / 1000)));
  }
  useEffect(() => {
    read(); setReady(true);
    const timer = window.setInterval(read, 1000);
    window.addEventListener("storage", read);
    return () => { clearInterval(timer); window.removeEventListener("storage", read); };
  }, [key]);
  return {
    ready, seconds,
    isLocked: () => { read(); return state.current.lockedUntil > Date.now(); },
    fail: () => { read(); save(failedAttempt(state.current, Date.now())); },
    reset: () => save({ failures: 0, lockedUntil: 0 }),
  };
}