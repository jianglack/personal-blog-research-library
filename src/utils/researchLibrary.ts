type EntryWithDraft = {
  id: string;
  data: {
    draft?: boolean;
    date?: Date;
  };
};

export function filterPublicEntries<T extends EntryWithDraft>(entries: T[]): T[] {
  return entries.filter(entry => entry.data.draft !== true);
}

export function sortByDateDesc<T extends EntryWithDraft>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const left = a.data.date?.getTime() ?? 0;
    const right = b.data.date?.getTime() ?? 0;
    return right - left;
  });
}

export function getSeriesEntries<T extends { id: string }>(
  orderedPostIds: string[],
  entries: T[]
): T[] {
  const byId = new Map(entries.map(entry => [entry.id, entry]));

  return orderedPostIds.map(postId => {
    const entry = byId.get(postId);
    if (!entry) {
      throw new Error(`Series references missing post: ${postId}`);
    }
    return entry;
  });
}

export function assertKnownReferences({
  entryId,
  fieldName,
  referencedSlugs,
  knownSlugs,
}: {
  entryId: string;
  fieldName: string;
  referencedSlugs: string[];
  knownSlugs: string[];
}): void {
  const known = new Set(knownSlugs);
  const missing = referencedSlugs.filter(slug => !known.has(slug));

  if (missing.length > 0) {
    throw new Error(`${entryId} references unknown ${fieldName}: ${missing.join(", ")}`);
  }
}
