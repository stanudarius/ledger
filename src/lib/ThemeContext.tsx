/** Chart colors resolve through CSS variables so dark mode updates without React state. */
export function useChartColors() {
  return {
    ink: "var(--ink)",
    muted: "var(--ink-muted)",
    positive: "var(--positive)",
    positiveLight: "var(--positive)",
    negative: "var(--negative)",
    negativeStrong: "var(--negative)",
    blue: "var(--accent-blue)",
    purple: "var(--accent-purple)",
    orange: "var(--accent-orange)",
    ruleDash: "var(--rule-dashed)",
  } as const;
}

/** Toggle dark mode and persist the preference in a cookie. */
export function toggleTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  const next = !isDark;
  document.cookie = `ledger-theme=${next ? "dark" : "light"};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  if (next) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}
