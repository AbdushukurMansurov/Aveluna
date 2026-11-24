import type { StockRow } from "./pharmacy-data";
import { translate, type Language } from "@/i18n/translations";

export type StockChangeEvent = "INSERT" | "UPDATE" | "DELETE";

export function applyStockChange(stock: StockRow[], event: StockChangeEvent, row: Partial<StockRow> | null | undefined): StockRow[] {
  if (!row?.pharmacy_id || !row.medicine_id) return stock;
  const same = (s: StockRow) => s.pharmacy_id === row.pharmacy_id && s.medicine_id === row.medicine_id;
  if (event === "DELETE") return stock.filter((s) => !same(s));
  const next: StockRow = { pharmacy_id: row.pharmacy_id, medicine_id: row.medicine_id, quantity: Number(row.quantity ?? 0) };
  return stock.some(same) ? stock.map((s) => (same(s) ? next : s)) : [...stock, next];
}

export function syncedLabel(syncedAt: number | null, now: number, lang: Language = "uz") {
  if (!syncedAt) return translate("live.never", lang);
  const sec = Math.max(0, Math.round((now - syncedAt) / 1000));
  if (sec < 60) return translate("live.justNow", lang);
  const min = Math.floor(sec / 60);
  if (min < 60) return translate("live.minutes", lang, { minutes: min });
  const d = new Date(syncedAt);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return translate("live.atTime", lang, { time });
}
