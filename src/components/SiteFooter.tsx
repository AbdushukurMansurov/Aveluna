import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/i18n/LanguageContext";

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="mt-16 border-t border-border bg-card text-card-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2">
        <div className="space-y-3">
          <BrandLogo />
          <p className="max-w-sm text-sm text-muted-foreground">{t("footer.description")}</p>
        </div>
        <div>
          <h2 className="mb-3 font-semibold">{t("footer.contact")}</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>{t("footer.mainPhone")}: <a className="text-foreground hover:text-primary" href="tel:+998200097287">(+998) 20-009-72-87</a></li>
            <li>{t("footer.extraPhone")}: <a className="text-foreground hover:text-primary" href="tel:+998337007287">(+998) 33-700-72-87</a></li>
            <li>Telegram: <a className="text-foreground hover:text-primary" href="https://t.me/Abdushukur09" target="_blank" rel="noopener noreferrer">@Abdushukur09</a></li>
            <li>Email: <a className="break-all text-foreground hover:text-primary" href="mailto:abdushukurmansurov433@gmail.com">abdushukurmansurov433@gmail.com</a></li>
            <li>{t("common.address")}: {t("footer.location")}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">{t("footer.copyright")}</div>
    </footer>
  );
}
