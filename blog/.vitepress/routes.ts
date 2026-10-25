// URL scheme of the site. Posts keep the paths of the previous site so
// existing links stay valid.

export const BLOG_INDEX_URL = "/blog/";

// Posts live in `_posts/<yyyy>-<mm>-<dd>-<slug>.md`. The same pattern also
// matches the `.html` URL that VitePress derives from that source path.
const POST_SOURCE_PATTERN = /^\/?_posts\/(\d{4})-(\d{2})-(\d{2})-(.+?)(?:\.md|\.html)?$/;

interface PostLocation {
  year: string;
  month: string;
  day: string;
  slug: string;
}

function parsePostLocation(sourcePath: string): PostLocation | null {
  const match = POST_SOURCE_PATTERN.exec(sourcePath);
  if (match === null) {
    return null;
  }
  const [, year, month, day, slug] = match;
  return { year, month, day, slug };
}

function postDirectory({ year, month, day, slug }: PostLocation): string {
  return `blog/${year}/${month}/${day}/${slug}/`;
}

// Rewriting a post to an `index.md` inside its dated directory makes the
// build emit `.../index.html`, so the trailing-slash URL is served directly
// without relying on host-side redirects. Non-post paths are left untouched.
export function rewritePostPath(sourcePath: string): string {
  const location = parsePostLocation(sourcePath);
  if (location === null) {
    return sourcePath;
  }
  return `${postDirectory(location)}index.md`;
}

export function isPostSourcePath(sourcePath: string): boolean {
  return parsePostLocation(sourcePath) !== null;
}

export function postUrl(sourcePath: string): string {
  const location = parsePostLocation(sourcePath);
  if (location === null) {
    throw new Error(`${sourcePath} is not a post source path`);
  }
  return `/${postDirectory(location)}`;
}
