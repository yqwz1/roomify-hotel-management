import { useTranslation } from "react-i18next";

export function useRadixDir(explicitDir) {
  const { i18n } = useTranslation();

  if (explicitDir === "rtl" || explicitDir === "ltr") {
    return explicitDir;
  }

  return i18n.dir(i18n.resolvedLanguage || i18n.language) === "rtl" ? "rtl" : "ltr";
}
