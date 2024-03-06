import i18next, { type TOptions } from "i18next";
import enUS from "./locales/en-US.json";
import ptBr from "./locales/pt-BR.json";

i18next.init({
  ns: ["locales"],
  defaultNS: "locales",
});
i18next.addResourceBundle("en-US", "locales", enUS, true, true);
i18next.addResourceBundle("pt-BR", "locales", ptBr, true, true);

export type TranslationKey = keyof typeof ptBr | keyof typeof enUS;

export default function translate(
  key: TranslationKey,
  options?: TOptions
): string {
  return i18next.t(key, options);
}

export function translateFactory(lng: "pt-BR" | "en-US") {
  return (key: TranslationKey, options?: TOptions) =>
    translate(key, { lng, ...options });
}
