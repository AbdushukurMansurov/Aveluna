import { expect, it } from "vitest";
import { failedAttempt, prescriptionCodeSchema, staffSchema, sanitizeText } from "@/lib/security-validation";

it("locks after five failures, not four", () => {
  let state = { failures: 0, lockedUntil: 0 };
  for (let i = 0; i < 4; i++) state = failedAttempt(state, 1000);
  expect(state.lockedUntil).toBe(0);
  expect(failedAttempt(state, 1000).lockedUntil).toBe(61_000);
});
it("allows attempts again after the 60 second lock", () => {
  expect(failedAttempt({ failures: 0, lockedUntil: 61_000 }, 60_999).lockedUntil).toBe(61_000);
  expect(failedAttempt({ failures: 0, lockedUntil: 61_000 }, 61_000)).toEqual({ failures: 1, lockedUntil: 0 });
});
it("requires exactly 12 digits", () => {
  expect(prescriptionCodeSchema.safeParse("123456789012").success).toBe(true);
  expect(prescriptionCodeSchema.safeParse("12345678901'").success).toBe(false);
});
it("rejects unsupported staff roles", () => {
  expect(staffSchema.safeParse({ role: "admin", fullName: "Test User", login: "test", password: "testpassword", clinicName: "Clinic" }).success).toBe(false);
});
it("removes HTML and disallowed query delimiters from text", () => {
  expect(sanitizeText('<script>alert(1)</script>;DROP TABLE--')).toBe("alert(1)DROP TABLE--");
});