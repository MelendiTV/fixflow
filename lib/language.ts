export type AppLanguage = "es" | "en";

export function getBrowserLanguage(): AppLanguage {
  if (typeof window === "undefined") {
    return "en";
  }

  const languages =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  const primaryLanguage = languages[0]?.toLowerCase() || "en";

  if (primaryLanguage.startsWith("es")) {
    return "es";
  }

  return "en";
}