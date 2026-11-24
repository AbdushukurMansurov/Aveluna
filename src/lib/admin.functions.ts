import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole } from "@/lib/auth";
import { toAuthEmail } from "@/lib/login";
import { staffSchema } from "@/lib/security-validation";
import type { z } from "zod";

/** The signup trigger runs before app_metadata is saved, so set the staff role explicitly. */
async function setRole(userId: string, role: AppRole) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error: dErr } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
  if (dErr) throw new Error(dErr.message);
  const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
  if (error) throw new Error(error.message);
}

type StaffInput = z.input<typeof staffSchema>;

/** Admin-only: creates a doctor or pharmacist account and assigns it to a clinic or pharmacy. */
export const createStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: StaffInput) => {
    return staffSchema.parse(input);
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Faqat admin yangi hisob yarata oladi");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: toAuthEmail(data.login),
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
      app_metadata: { role: data.role },
    });
    if (error || !created.user) {
      throw new Error(error && /already/i.test(error.message) ? "Bu login band. Boshqa login tanlang." : error?.message ?? "Hisob yaratilmadi");
    }
    await setRole(created.user.id, data.role);
    const { error: aErr } = await supabaseAdmin.from("staff_assignments").insert({
      user_id: created.user.id,
      role: data.role,
      login: data.login,
      clinic_name: data.role === "doctor" ? data.clinicName ?? null : null,
      pharmacy_id: data.role === "pharmacist" ? data.pharmacyId || null : null,
    });
    if (aErr) throw new Error(aErr.message);
    return { login: data.login };
  });
