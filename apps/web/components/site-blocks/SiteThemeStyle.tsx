interface ThemeData {
  id: string;
  slug: string;
  name: string;
  colors: Record<string, string>;
  typography: Record<string, string | number>;
  borderRadius?: Record<string, number>;
}

// Default fallback theme so a site without explicit theme still renders
const DEFAULT_COLORS = {
  primary: "#6366F1",
  secondary: "#8B5CF6",
  accent: "#06B6D4",
  background: "#FFFFFF",
  surface: "#F8FAFC",
  text: "#0F172A",
  textMuted: "#64748B",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
};

const DEFAULT_TYPOGRAPHY = {
  fontFamilyHeading: "system-ui, sans-serif",
  fontFamilyBody: "system-ui, sans-serif",
  baseFontSize: 16,
  headingScale: 1.333,
  lineHeight: 1.6,
};

const DEFAULT_RADIUS = { none: 0, sm: 4, md: 8, lg: 16, full: 9999 };

export function SiteThemeStyle({ theme }: { theme: ThemeData | null }) {
  const colors = { ...DEFAULT_COLORS, ...(theme?.colors || {}) };
  const typography = { ...DEFAULT_TYPOGRAPHY, ...(theme?.typography || {}) };
  const radius = { ...DEFAULT_RADIUS, ...(theme?.borderRadius || {}) };

  const css = `
    :root {
      --site-primary: ${colors.primary};
      --site-secondary: ${colors.secondary};
      --site-accent: ${colors.accent};
      --site-bg: ${colors.background};
      --site-surface: ${colors.surface};
      --site-text: ${colors.text};
      --site-text-muted: ${colors.textMuted};
      --site-success: ${colors.success};
      --site-warning: ${colors.warning};
      --site-error: ${colors.error};

      --site-font-heading: ${typography.fontFamilyHeading};
      --site-font-body: ${typography.fontFamilyBody};
      --site-font-base-size: ${typography.baseFontSize}px;
      --site-line-height: ${typography.lineHeight};

      --site-radius-sm: ${radius.sm}px;
      --site-radius-md: ${radius.md}px;
      --site-radius-lg: ${radius.lg}px;
      --site-radius-full: ${radius.full}px;
    }

    body {
      margin: 0;
      padding: 0;
      background: var(--site-bg);
      color: var(--site-text);
      font-family: var(--site-font-body);
      font-size: var(--site-font-base-size);
      line-height: var(--site-line-height);
      -webkit-font-smoothing: antialiased;
    }

    * {
      box-sizing: border-box;
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
