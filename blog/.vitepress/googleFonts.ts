/** Stylesheet URL for a Google Fonts family in the weights the site uses. */
export function googleFontUrl(family: string): string {
  const encodedFamily = encodeURIComponent(family).replaceAll("%20", "+");
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@400;500;600;700&display=swap`;
}
