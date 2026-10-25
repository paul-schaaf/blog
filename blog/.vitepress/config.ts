import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vitepress";
import type MarkdownIt from "markdown-it";
import container from "markdown-it-container";
import readingTime from "reading-time";
import { BLOG_INDEX_URL, isPostSourcePath, rewritePostPath } from "./routes";
import { formatPostDate, parsePostDate } from "./postDates";
import { googleFontUrl } from "./googleFonts";

// The text font set as --vp-font-family-base in the theme's custom.css.
const TEXT_FONT_GOOGLE_FAMILY = "Lora";

// A `::: name` block whose body is rendered as markdown between fixed
// opening and closing HTML.
interface WrappedContainer {
  name: string;
  before: string;
  after: string;
}

// The border of a boxed section is an SVG rectangle that the stylesheet sizes
// and strokes, so the markup only has to provide it.
const SECTION_BORDER_HTML = '<svg class="section-border" aria-hidden="true"><rect /></svg>';

function boxedSectionOpening(title: string): string {
  return `<div class="boxed-section">${SECTION_BORDER_HTML}<div class="title">${title}</div>`;
}

const WRAPPED_CONTAINERS: WrappedContainer[] = [
  {
    name: "note",
    before: boxedSectionOpening("Note ⚠️"),
    after: "</div>",
  },
  {
    name: "theory-recap",
    before: boxedSectionOpening("theory recap"),
    after: "</div>",
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

const FULLSCREEN_BUTTON_HTML = '<button title="View full screen" class="fullscreen"></button>';

/** The theme's code block markup: the wrapper, immediately followed by its copy button. */
const CODE_BLOCK_OPENING = /^<div class="language-[^"]*">(?=<button )/;

// The full screen button goes in front of the theme's copy button, because the
// theme's styling and copy handler rely on what follows the copy button.
function addFullscreenButton(md: MarkdownIt): void {
  const renderFence = md.renderer.rules.fence;
  if (renderFence === undefined) {
    throw new Error("Expected a fence renderer to add the full screen button to");
  }
  md.renderer.rules.fence = (...args) => {
    const html = renderFence(...args);
    const opening = CODE_BLOCK_OPENING.exec(html);
    if (opening === null) {
      throw new Error(`Code block markup does not start with the theme's wrapper and copy button: ${html.slice(0, 120)}`);
    }
    const insertAt = opening[0].length;
    return html.slice(0, insertAt) + FULLSCREEN_BUTTON_HTML + html.slice(insertAt);
  };
}

const FRONTMATTER_BLOCK = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;

function readingTimeMinutesOf(markdownSource: string): number {
  const body = markdownSource.replace(FRONTMATTER_BLOCK, "");
  return Math.ceil(readingTime(body).minutes);
}

export default defineConfig({
  title: "paulx",
  lang: "en",
  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    ["link", { rel: "stylesheet", href: googleFontUrl(TEXT_FONT_GOOGLE_FAMILY) }],
  ],
  rewrites: rewritePostPath,
  markdown: {
    lineNumbers: true,
    config(md) {
      for (const spec of WRAPPED_CONTAINERS) {
        registerWrappedContainer(md, spec);
      }
      addFullscreenButton(md);
    },
  },
  transformPageData(pageData, { siteConfig }) {
    const source = readFileSync(join(siteConfig.srcDir, pageData.filePath), "utf8");
    pageData.frontmatter.readingTimeMinutes = readingTimeMinutesOf(source);

    // The theme shows post-only elements (date header, reading progress) based on
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
    outline: [2, 3],
  },
});
