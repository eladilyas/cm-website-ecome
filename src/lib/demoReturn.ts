// Shared sessionStorage key the demo simulator uses to remember the
// page that launched it. POSChrome's exit button reads this value and
// routes there; if empty, it falls back to the home page.

export const DEMO_RETURN_KEY = "demo:returnTo";

export function rememberDemoReturn(path: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DEMO_RETURN_KEY, path);
  } catch {
    // SessionStorage may be unavailable in private mode; the exit
    // button will fall back to "/" which is acceptable.
  }
}

export function consumeDemoReturn(): string {
  if (typeof window === "undefined") return "/";
  try {
    const v = window.sessionStorage.getItem(DEMO_RETURN_KEY);
    if (v) {
      window.sessionStorage.removeItem(DEMO_RETURN_KEY);
      return v;
    }
  } catch {
    // ignore
  }
  return "/";
}
