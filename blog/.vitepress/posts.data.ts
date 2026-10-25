import { createContentLoader } from "vitepress";
import { postUrl } from "./routes";
import { formatPostDate, parsePostDate } from "./postDates";

export interface Post {
  title: string;
  url: string;
  description: string;
  // ISO 8601, for the `datetime` attribute.
  date: string;
  dateText: string;
}

declare const data: Post[];
export { data };

function requireString(value: unknown, field: string, url: string): string {
  if (typeof value !== "string") {
    throw new Error(`Post ${url} has no frontmatter ${field}`);
  }
  return value;
}

export default createContentLoader("_posts/*.md", {
  transform(rawPosts): Post[] {
    return rawPosts
      .map(({ url: sourceUrl, frontmatter }) => {
        // The loader derives its url from the source path and does not apply
        // the config's rewrites, so the published url is computed here.
        const url = postUrl(sourceUrl);
        const date = parsePostDate(frontmatter.date, url);
        return {
          title: requireString(frontmatter.title, "title", url),
          url,
          description: requireString(frontmatter.description, "description", url),
          date: date.toISOString(),
          dateText: formatPostDate(date),
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  },
});
