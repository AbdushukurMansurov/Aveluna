import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Globe, LogIn, LogOut, Menu, Moon, Pill, Store, Sun, Volume2, VolumeX, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { useLargeMode } from "@/lib/large-mode";
import { useSoundSetting } from "@/lib/ui-sound";
import { useDarkMode } from "@/lib/theme";
import { LANGUAGES, useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { user, ready } = useUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const large = useLargeMode();
  const sound = useSoundSetting();
  const dark = useDarkMode();
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);

  async function signOut() {
    setOpen(false);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const item = "flex h-11 items-center gap-3 rounded-xl px-3 text-base font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors whitespace-nowrap overflow-hidden";
  const label = cn("transition-opacity", open ? "opacity-100" : "sr-only");
  const active = LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[0]!;
  const nav = [
    { to: "/qollanma", icon: BookOpen, text: t("nav.guide") },
    { to: "/medicines", icon: Pill, text: t("nav.medicines") },
    { to: "/pharmacies", icon: Store, text: t("nav.pharmacies") },
  ] as const;

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto grid min-h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Link to="/" className="flex shrink-0 items-center" aria-label="Aveluna"><BrandLogo /></Link>
            {ready && user ? (
              <Button asChild variant="ghost" size="sm" className="h-10 min-w-0 rounded-xl px-2 text-base sm:px-3"><Link to="/dashboard"><span className="truncate">{t("nav.home")}</span></Link></Button>
            ) : ready ? (
              <Button asChild size="sm" className="h-10 rounded-xl px-3 text-base"><Link to="/auth">{t("nav.login")}</Link></Button>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" aria-pressed={dark.on} aria-label={t("nav.dark")} title={t("nav.dark")} onClick={dark.toggle}>
              {dark.on ? <Sun className="!size-5" /> : <Moon className="!size-5" />}
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" aria-expanded={open} aria-label={t("nav.menu")} onClick={() => setOpen((v) => !v)}>
              {open ? <X className="!size-5" /> : <Menu className="!size-5" />}
            </Button>
          </div>
        </div>
      </header>
      {open && <div className="fixed inset-0 z-30 bg-foreground/20" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside className={cn("fixed right-0 top-16 z-30 flex max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto overflow-x-hidden rounded-bl-2xl border-b border-l bg-card p-2 shadow-soft transition-[width] duration-300", open ? "w-72 max-w-[85vw]" : "hidden w-16 md:flex")} aria-label={t("nav.menu")}>
        {nav.map(({ to, icon: Icon, text }) => (
          <Link key={to} to={to} className={item} activeProps={{ className: "bg-muted text-foreground" }} title={text} onClick={() => setOpen(false)}>
            <Icon className="size-5 shrink-0" /><span className={label}>{text}</span>
          </Link>
        ))}
        <div className="my-1 border-t" />
        {open ? (
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-3 px-3 text-sm font-semibold text-muted-foreground"><Globe className="size-5" />{t("nav.language")}</span>
            {LANGUAGES.map((l) => (
              <button key={l.id} type="button" onClick={() => setLang(l.id)} className={cn(item, "h-10", l.id === lang && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")}>
                <span className="w-8 shrink-0 text-center text-xs font-bold">{l.short}</span>{l.label}
              </button>
            ))}
            <div className="my-1 border-t" />
            <button type="button" className={item} aria-pressed={large.on} onClick={large.toggle}><span className="w-5 shrink-0 font-display font-bold">A+</span>{t("nav.large")}</button>
            <button type="button" className={item} aria-pressed={sound.on} onClick={sound.toggle} data-sound="off">
              {sound.on ? <Volume2 className="size-5 shrink-0 text-primary" /> : <VolumeX className="size-5 shrink-0" />}{t("nav.sound")}
            </button>
            {ready && user ? (
              <button type="button" className={item} onClick={signOut}><LogOut className="size-5 shrink-0" />{t("nav.logout")}</button>
            ) : ready ? (
              <Link to="/auth" className={item} onClick={() => setOpen(false)}><LogIn className="size-5 shrink-0" />{t("nav.login")}</Link>
            ) : null}
          </div>
        ) : (
          <button type="button" className={cn(item, "justify-center px-0")} title={active.label} onClick={() => setOpen(true)}><span className="text-xs font-bold">{active.short}</span></button>
        )}
      </aside>
    </>
  );
}
