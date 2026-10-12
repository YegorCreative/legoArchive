/** Prefix an internal path with the GitHub Pages base. */
export function href(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}${path.replace(/^\//, "")}`;
}
