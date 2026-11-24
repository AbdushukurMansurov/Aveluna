import type { Medicine } from "@/lib/pharmacy-data";
import { isFreeMedicine } from "@/lib/pharmacy-data";
import { translate, type Language, type TranslationKey } from "@/i18n/translations";

export const CONDITIONS = [
  { key: "gipertoniya", labelKey: "condition.gipertoniya", hintKey: "condition.gipertoniyaHint" },
  { key: "diabet2", labelKey: "condition.diabet2", hintKey: "condition.diabet2Hint" },
  { key: "astma", labelKey: "condition.astma", hintKey: "condition.astmaHint" },
  { key: "osok", labelKey: "condition.osok", hintKey: "condition.osokHint" },
  { key: "yik", labelKey: "condition.yik", hintKey: "condition.yikHint" },
] as const satisfies readonly { key: string; labelKey: TranslationKey; hintKey: TranslationKey }[];

export type ConditionKey = (typeof CONDITIONS)[number]["key"];

export function conditionLabel(key: string, lang: Language = "uz") {
  const condition = CONDITIONS.find((c) => c.key === key);
  return condition ? translate(condition.labelKey, lang) : key;
}

export function coveredMedicines(medicines: Medicine[], conditions: string[]) {
  return medicines.filter((m) => isFreeMedicine(m) && m.covered_conditions.some((c) => conditions.includes(c)));
}

export function groupByXpn(medicines: Medicine[]) {
  const map = new Map<string, Medicine[]>();
  for (const m of medicines) map.set(m.generic_name_xpn, [...(map.get(m.generic_name_xpn) ?? []), m]);
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}
