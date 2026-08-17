/**
 * Applies the agency's accent colour over the shadcn theme.
 *
 * Scoped to CSS variables rather than letting an agency supply styles: the
 * layout stays ours, so every showroom stays legible and nobody can ship a
 * broken page. The value is hex-validated on write, and re-checked here because
 * this string lands inside a <style> tag.
 */

/**
 * Picks black or white text for the accent, from its perceived brightness.
 *
 * Without this an agency that chooses a pale yellow gets white-on-pale buttons ,
 * and the same colour has to work on both the light and the dark theme, so a
 * fixed foreground cannot be right for every brand.
 */
function readableForeground(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return luminance > 0.45 ? "oklch(0.15 0 0)" : "oklch(0.985 0 0)"
}

export function AccentTheme({ color }: { color: string | null | undefined }) {
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return null

  const foreground = readableForeground(color)

  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html:
          `:root,.dark{--primary:${color};--primary-foreground:${foreground};` +
          `--ring:${color};--sidebar-primary:${color};` +
          `--sidebar-primary-foreground:${foreground};}`,
      }}
    />
  )
}
