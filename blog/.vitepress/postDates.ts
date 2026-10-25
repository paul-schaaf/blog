const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

// `context` names the post in error messages.
export function parsePostDate(frontmatterDate: unknown, context: string): Date {
  // gray-matter parses unquoted YAML dates into Date objects already.
  if (frontmatterDate instanceof Date) {
    return frontmatterDate;
  }
  if (typeof frontmatterDate === "string") {
    const parsed = new Date(frontmatterDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  throw new Error(`Post ${context} has no valid frontmatter date`);
}

// Human readable, formatted at build time so the client never formats
// dates itself and server and client markup cannot drift apart.
export function formatPostDate(date: Date): string {
  return DATE_FORMAT.format(date);
}
