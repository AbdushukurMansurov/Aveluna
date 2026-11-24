import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Stethoscope, Store, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { createStaffAccount } from "@/lib/admin.functions";
import { playChime } from "@/lib/ui-sound";
import { cn } from "@/lib/utils";
import { sanitizeText, staffSchema, validationMessage } from "@/lib/security-validation";

const fieldCls = "h-14 w-full rounded-xl border-2 border-input bg-card px-4 text-lg font-medium text-foreground focus:border-primary focus:outline-none";
type StaffRole = "doctor" | "pharmacist";

/** Admin Paneli: create doctor and pharmacist accounts and assign them to a clinic or pharmacy. */
export function AdminPortal() {
  const qc = useQueryClient();
  const create = useServerFn(createStaffAccount);
  const [role, setRole] = useState<StaffRole>("doctor");
  const [busy, setBusy] = useState(false);

  const { data: pharmacies = [] } = useQuery({
    queryKey: ["pharmacies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pharmacies").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_assignments")
        .select("user_id, role, login, clinic_name, created_at, profiles(full_name), pharmacies(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    try {
      const res = await create({
        data: staffSchema.parse({
          role,
          fullName: String(f.get("full_name") ?? ""),
          login: String(f.get("login") ?? ""),
          password: String(f.get("password") ?? ""),
          clinicName: String(f.get("clinic") ?? ""),
          pharmacyId: String(f.get("pharmacy") ?? ""),
        }),
      });
      playChime();
      toast.success(`Hisob yaratildi. Login: ${res.login}`);
      form.reset();
      qc.invalidateQueries({ queryKey: ["staff"] });
    } catch (err) {
      toast.error(validationMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 border-b-2 pb-4">
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="h-7 w-7" /></span>
        <div>
          <h2 className="text-3xl font-bold">Admin Paneli</h2>
          <p className="text-lg text-muted-foreground">Shifokor va dorixona xodimlari uchun hisob yarating.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <form onSubmit={submit} className="space-y-4 rounded-2xl border-2 bg-card p-5">
          <p className="text-xl font-bold">Yangi hisob</p>
          <div className="grid grid-cols-2 gap-2">
            {([["doctor", "Shifokor", Stethoscope], ["pharmacist", "Dorixona", Store]] as const).map(([value, label, Icon]) => (
              <button key={value} type="button" aria-pressed={role === value} onClick={() => setRole(value)}
                className={cn("flex items-center justify-center gap-2 rounded-xl border-2 p-4 text-lg font-bold transition-colors",
                  role === value ? "border-primary bg-secondary" : "hover:bg-muted")}>
                <Icon className="h-5 w-5" /> {label}
              </button>
            ))}
          </div>
          <label className="block space-y-1.5"><span className="font-semibold">To'liq ism-sharif</span>
            <input name="full_name" required minLength={3} maxLength={120} onChange={(e) => { e.target.value = sanitizeText(e.target.value, 120); }} className={fieldCls} /></label>
          {role === "doctor" ? (
            <label className="block space-y-1.5"><span className="font-semibold">Klinika / poliklinika</span>
              <input name="clinic" required maxLength={160} onChange={(e) => { e.target.value = sanitizeText(e.target.value); }} placeholder="Masalan: 12-oilaviy poliklinika (Yunusobod)" className={fieldCls} /></label>
          ) : (
            <label className="block space-y-1.5"><span className="font-semibold">Dorixona</span>
              <select name="pharmacy" required className={fieldCls} defaultValue="">
                <option value="" disabled>Dorixonani tanlang</option>
                {pharmacies.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.address}</option>)}
              </select></label>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5"><span className="font-semibold">Login</span>
              <input name="login" required maxLength={32} pattern="[A-Za-z0-9._\-]{3,32}" autoComplete="off" placeholder="dr.karimov" className={fieldCls} /></label>
            <label className="block space-y-1.5"><span className="font-semibold">Parol (kamida 8 belgi)</span>
              <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={fieldCls} /></label>
          </div>
          <Button size="xl" className="w-full" disabled={busy}><UserPlus /> {busy ? "Yaratilmoqda…" : "Hisob yaratish"}</Button>
        </form>

        <section className="space-y-3 rounded-2xl border-2 bg-card p-5">
          <h3 className="text-2xl font-bold">Xodimlar ({staff.length})</h3>
          {staff.length === 0 ? <p className="text-lg text-muted-foreground">Hali xodim qo'shilmagan.</p> : (
            <ul className="divide-y">
              {staff.map((s) => (
                <li key={s.user_id} className="py-3">
                  <p className="text-lg font-bold">{s.profiles?.full_name || s.login}</p>
                  <p className="text-muted-foreground">
                    {s.role === "doctor" ? "Shifokor" : "Dorixona"} · login: <span className="font-mono">{s.login}</span> · {s.role === "doctor" ? s.clinic_name : s.pharmacies?.name}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
