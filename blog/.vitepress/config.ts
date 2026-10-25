import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vitepress";
import type MarkdownIt from "markdown-it";
import container from "markdown-it-container";
import readingTime from "reading-time";
import { BLOG_INDEX_URL, isPostSourcePath, rewritePostPath } from "./routes";
import { formatPostDate, parsePostDate } from "./postDates";

// A `::: name` block whose body is rendered as markdown between fixed
// opening and closing HTML.
interface WrappedContainer {
  name: string;
  before: string;
  after: string;
}

const WRAPPED_CONTAINERS: WrappedContainer[] = [
  {
    name: "note",
    before: '<div class="gray-section"><div class="title">Note ⚠️</div>',
    after: "</div>",
  },
  {
    name: "theory-recap",
    before: '<div class="gray-section"><div class="title">theory recap 📚</div>',
    after: "</div>",
  },
  // The body of this block is empty; the component reads everything it
  // shows from page data.
  {
    name: "blog-meta",
    before: "<BlogMeta />",
    after: "",
  },
];

function registerWrappedContainer(md: MarkdownIt, spec: WrappedContainer): void {
  md.use(container, spec.name, {
    render(tokens, idx) {
      const isOpeningTag = tokens[idx].nesting === 1;
      return isOpeningTag ? spec.before : spec.after;
    },
  });
}

const FRONTMATTER_BLOCK = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;

function readingTimeMinutesOf(markdownSource: string): number {
  const body = markdownSource.replace(FRONTMATTER_BLOCK, "");
  return Math.ceil(readingTime(body).minutes);
}

export default defineConfig({
  title: "paulx",
  lang: "en",
  lastUpdated: true,
  head: [["link", { rel: "icon", href: "/favicon.ico" }]],
  rewrites: rewritePostPath,
  markdown: {
    lineNumbers: true,
    config(md) {
      for (const spec of WRAPPED_CONTAINERS) {
        registerWrappedContainer(md, spec);
      }
    },
  },
  transformPageData(pageData, { siteConfig }) {
    const source = readFileSync(join(siteConfig.srcDir, pageData.filePath), "utf8");
    pageData.frontmatter.readingTimeMinutes = readingTimeMinutesOf(source);

    // The theme shows post-only elements (date header, blog meta) based on
    // this flag rather than guessing from the URL.
    const isPost = isPostSourcePath(pageData.filePath);
    pageData.frontmatter.isPost = isPost;
    if (isPost) {
      const date = parsePostDate(pageData.frontmatter.date, pageData.filePath);
      pageData.frontmatter.date = date.toISOString();
      pageData.frontmatter.dateText = formatPostDate(date);
    }
  },
  themeConfig: {
    // The site title is kept for the browser tab but not shown in the nav bar.
    siteTitle: false,
    nav: [
      { text: "Home", link: "/" },
      { text: "Blog", link: BLOG_INDEX_URL },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/paul-schaaf" },
      { icon: "twitter", link: "https://twitter.com/paulxpaulxpaulx" },
    ],
    outline: [2, 4],
  },
});
