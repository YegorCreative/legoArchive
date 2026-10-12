export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "Unavailable";
  return new Intl.NumberFormat("en-US").format(value);
}

export function decadeLabel(decade: number): string {
  return `${decade}s`;
}
