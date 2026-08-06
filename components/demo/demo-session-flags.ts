const SKIP_END_KEY = "nsps_demo_skip_end";

export function markDemoSkipEnd() {
  try {
    sessionStorage.setItem(SKIP_END_KEY, "1");
  } catch {
    // ignore
  }
}

export function consumeDemoSkipEnd() {
  try {
    const value = sessionStorage.getItem(SKIP_END_KEY);
    sessionStorage.removeItem(SKIP_END_KEY);
    return value === "1";
  } catch {
    return false;
  }
}

export function shouldSkipDemoEnd() {
  try {
    return sessionStorage.getItem(SKIP_END_KEY) === "1";
  } catch {
    return false;
  }
}
