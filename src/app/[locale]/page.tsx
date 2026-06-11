import { THEMES, DEFAULT_THEME } from "@/themes/registry";

/**
 * Root endpoint serves the design chosen by NEXT_PUBLIC_THEME
 * (cosmic | terminal | editorial | odyssey — default cosmic).
 * Every design is also always reachable at its own endpoint:
 * /cosmic, /terminal, /editorial, /odyssey.
 */
export default function Home() {
  const Theme = THEMES[DEFAULT_THEME];
  return <Theme />;
}
