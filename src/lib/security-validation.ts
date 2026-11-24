import { z } from "zod";
import { translate, type Language, type TranslationKey } from "@/i18n/translations";

export function sanitizeText(value: string, max = 160) {
  return value.replace(/<[^>]*>/g, "").replace(/[^\p{L}\p{N}\s'’‘ʻʼ.,()\-+/]/gu, "").slice(0, max);
}
const text = (max: number) => z.string().max(max).regex(/^[\p{L}\p{N}\s'’‘ʻʼ.,()\-+/]*$/u, "Faqat oddiy matn kiriting").transform((v) => v.trim());
export const fullNameSchema = text(120).refine((v) => v.length >= 3, "Ism-sharifni to'liq kiriting");
export const loginSchema = z.string().trim().toLowerCase().min(3).max(254).refine((v) => /^[a-z0-9._-]{3,32}$/.test(v) || z.string().email().safeParse(v).success, "Login yoki email noto'g'ri");
export const passwordSchema = z.string().min(8, "Parol kamida 8 ta belgidan iborat bo'lsin").max(72);
export const signInSchema = z.object({ login: loginSchema, password: z.string().min(1).max(72) });
export const signUpSchema = z.object({ email: z.string().trim().email().max(254), password: passwordSchema, fullName: fullNameSchema });
export const staffSchema = z.object({
  role: z.enum(["doctor", "pharmacist"]), fullName: fullNameSchema,
  login: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,32}$/, "Login 3–32 ta lotin harfi, raqam yoki . _ - belgisidan iborat bo'lsin"),
  password: passwordSchema, clinicName: text(160).optional(), pharmacyId: z.union([z.string().uuid(), z.literal("")]).optional(),
}).superRefine((v, ctx) => {
  if (v.role === "doctor" && !v.clinicName) ctx.addIssue({ code: "custom", message: "Klinika nomini kiriting", path: ["clinicName"] });
  if (v.role === "pharmacist" && !v.pharmacyId) ctx.addIssue({ code: "custom", message: "Dorixonani tanlang", path: ["pharmacyId"] });
});
export const prescriptionCodeSchema = z.string().regex(/^\d{12}$/, "Retsept kodi 12 ta raqamdan iborat bo'lishi kerak");
export const smsCodeSchema = z.string().regex(/^\d{4}$/);
export const prescriptionInputSchema = z.object({ patient_id: z.string().uuid(), medicine_id: z.string().uuid(), diagnosis: text(80), quantity: z.number().int().min(1).max(10), dosage: text(300) });

const VALIDATION_KEYS: Record<string, TranslationKey> = {
  "Faqat oddiy matn kiriting": "validation.text",
  "Ism-sharifni to'liq kiriting": "validation.fullName",
  "Login yoki email noto'g'ri": "validation.login",
  "Parol kamida 8 ta belgidan iborat bo'lsin": "validation.password",
  "Login 3–32 ta lotin harfi, raqam yoki . _ - belgisidan iborat bo'lsin": "validation.staffLogin",
  "Klinika nomini kiriting": "validation.clinic",
  "Dorixonani tanlang": "validation.pharmacy",
  "Retsept kodi 12 ta raqamdan iborat bo'lishi kerak": "calendar.invalidCode",
};
export function validationMessage(error: unknown, lang: Language = "uz") {
  if (error instanceof z.ZodError) {
    const message = error.issues[0]?.message;
    return translate(message && VALIDATION_KEYS[message] ? VALIDATION_KEYS[message] : "validation.check", lang);
  }
  return translate("common.requestError", lang);
}
export type AttemptState = { failures: number; lockedUntil: number };
export function failedAttempt(state: AttemptState, now: number): AttemptState {
  if (state.lockedUntil > now) return state;
  const failures = (state.lockedUntil ? 0 : state.failures) + 1;
  return failures >= 5 ? { failures: 0, lockedUntil: now + 60_000 } : { failures, lockedUntil: 0 };
}
