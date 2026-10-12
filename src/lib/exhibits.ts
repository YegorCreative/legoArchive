/** Editorial gallery titles. They are not verified historical period names. */
export const GALLERY_TITLES: Record<number, string> = {
  1940: "Opening rooms",
  1950: "Early plastic years",
  1960: "Systems and wheels",
  1970: "The foundations",
  1980: "New worlds",
  1990: "An era of expansion",
  2000: "Licensed adventures",
  2010: "The collector generation",
  2020: "The current rooms",
};

export function galleryTitle(decade: number): string {
  return GALLERY_TITLES[decade] ?? "Later catalog years";
}
