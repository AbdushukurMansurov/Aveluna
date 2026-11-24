import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toAuthEmail } from "@/lib/login";
import { sanitizeText, signInSchema, signUpSchema, validationMessage } from "@/lib/security-validation";
import { useAuthCooldown } from "@/lib/auth-cooldown";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Kirish va ro'yxatdan o'tish — Aveluna" },
      { name: "description", content: "Avelunaga bemor, shifokor yoki farmatsevt sifatida kiring yoki yangi hisob oching." },
      { property: "og:title", content: "Kirish va ro'yxatdan o'tish — Aveluna" },
      { property: "og:description", content: "Avelunaga bemor, shifokor yoki farmatsevt sifatida kiring yoki yangi hisob oching." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function uzError(message: string) {
  if (/invalid login credentials/i.test(message)) return "Email yoki parol noto'g'ri.";
  if (/already registered|already exists/i.test(message)) return "Bu email bilan hisob allaqachon mavjud. «Kirish» bo'limidan foydalaning.";
  if (/password/i.test(message) && /(weak|pwned|leaked|known)/i.test(message)) return "Bu parol juda oddiy yoki oshkor bo'lgan. Boshqa, murakkabroq parol tanlang.";
  if (/at least/i.test(message)) return "Parol kamida 8 ta belgidan iborat bo'lishi kerak.";
  return "Xatolik yuz berdi: " + message;
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const loginLimit = useAuthCooldown("login");
  const signupLimit = useAuthCooldown("signup");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || !loginLimit.ready || loginLimit.isLocked()) return;
    const f = new FormData(e.currentTarget);
    try {
      const { login, password } = signInSchema.parse({ login: f.get("email"), password: f.get("password") });
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email: toAuthEmail(login), password });
      if (error) { loginLimit.fail(); toast.error(uzError(error.message)); return; }
      loginLimit.reset();
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(validationMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || !signupLimit.ready || signupLimit.isLocked()) return;
    const f = new FormData(e.currentTarget);
    if (f.get("website")) return;
    try {
      const { email, password, fullName } = signUpSchema.parse({ email: f.get("email"), password: f.get("password"), fullName: f.get("full_name") });
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ email, password, options: {
        emailRedirectTo: window.location.origin, data: { full_name: fullName },
      } });
      if (error) { signupLimit.fail(); toast.error(uzError(error.message)); return; }
      signupLimit.reset();
      if (data.session) { toast.success("Hisobingiz yaratildi. Xush kelibsiz!"); navigate({ to: "/dashboard" }); }
      else setSent(email);
    } catch (error) {
      toast.error(validationMessage(error));
    } finally { setLoading(false); }
  }

  return (
    <main className="bg-hero min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
        <div className="rounded-2xl border bg-card p-6 shadow-soft sm:p-8">
          <BrandLogo size="lg" className="mb-6" />
          <h1 className="text-3xl font-semibold">Avelunaga xush kelibsiz</h1>
          <p className="mt-1 text-lg text-muted-foreground">Hisobingizga kiring yoki yangi hisob oching.</p>
          {sent ? (
            <p className="mt-6 rounded-lg bg-secondary p-4 text-lg text-secondary-foreground">
              <strong>{sent}</strong> manziliga tasdiqlash havolasi yuborildi. Havolani bosing, so'ng tizimga kiring.
            </p>
          ) : (
            <Tabs defaultValue="signin" className="mt-6">
              <TabsList className="grid h-12 w-full grid-cols-2">
                <TabsTrigger value="signin" className="text-base">Kirish</TabsTrigger>
                <TabsTrigger value="signup" className="text-base">Ro'yxatdan o'tish</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={signIn} className="mt-4 space-y-4">
                  <Field name="email" label="Elektron pochta yoki login" />
                  <Field name="password" label="Parol" type="password" />
                  {loginLimit.seconds > 0 && <p role="alert" className="text-destructive">Juda ko'p noto'g'ri urinish. {loginLimit.seconds} soniyadan so'ng qayta urinib ko'ring</p>}
                  <Button size="xl" className="w-full" disabled={loading || !loginLimit.ready || loginLimit.seconds > 0}>{loading ? "Kirilmoqda…" : "Kirish"}</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={signUp} className="mt-4 space-y-4">
                  <div className="sr-only" aria-hidden="true"><label htmlFor="website">Veb-sayt</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
                  <p className="rounded-lg bg-secondary p-3 text-base text-secondary-foreground">Ro'yxatdan o'tish faqat bemorlar uchun. Shifokor va dorixona hisoblarini admin beradi.</p>
                  <Field name="full_name" label="To'liq ism-sharif" />
                  <Field name="email" label="Elektron pochta" type="email" />
                  <Field name="password" label="Parol (kamida 8 belgi)" type="password" minLength={8} />
                  {signupLimit.seconds > 0 && <p role="alert" className="text-destructive">Juda ko'p noto'g'ri urinish. {signupLimit.seconds} soniyadan so'ng qayta urinib ko'ring</p>}
                  <Button size="xl" className="w-full" disabled={loading || !signupLimit.ready || signupLimit.seconds > 0}>{loading ? "Yaratilmoqda…" : "Bemor hisobini yaratish"}</Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ name, label, type = "text", minLength }: { name: string; label: string; type?: string; minLength?: number }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-base">{label}</Label>
      <Input id={name} name={name} type={type} required minLength={minLength} maxLength={type === "password" ? 72 : name === "full_name" ? 120 : 254}
        onChange={name === "full_name" ? (e) => { e.target.value = sanitizeText(e.target.value, 120); } : undefined}
        className="h-12 text-lg" />
    </div>
  );
}
