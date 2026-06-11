import type { ComponentType } from "react";
import CosmicTheme from "@/themes/cosmic/CosmicTheme";
import TerminalTheme from "@/themes/terminal/TerminalTheme";
import EditorialTheme from "@/themes/editorial/EditorialTheme";
import OdysseyTheme from "@/themes/odyssey/OdysseyTheme";

/**
 * Every complete site design, addressable two ways:
 *  - /<theme> endpoints (e.g. /cosmic, /odyssey) — always available
 *  - NEXT_PUBLIC_THEME env var — picks which design the root URL serves
 */
export const THEMES = {
  cosmic: CosmicTheme,
  terminal: TerminalTheme,
  editorial: EditorialTheme,
  odyssey: OdysseyTheme,
} satisfies Record<string, ComponentType>;

export type ThemeName = keyof typeof THEMES;

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

export const DEFAULT_THEME: ThemeName = (() => {
  const env = process.env.NEXT_PUBLIC_THEME;
  return env && env in THEMES ? (env as ThemeName) : "cosmic";
})();
