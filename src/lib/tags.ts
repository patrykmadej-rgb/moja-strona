export function tagToSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/ą/g, "a").replace(/ć/g, "c").replace(/ę/g, "e")
    .replace(/ł/g, "l").replace(/ń/g, "n").replace(/ó/g, "o")
    .replace(/ś/g, "s").replace(/ź/g, "z").replace(/ż/g, "z")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function slugToTag(slug: string, allTags: string[]): string | undefined {
  return allTags.find((t) => tagToSlug(t) === slug);
}

export function getAllTags(publications: { tags: string[] }[]): string[] {
  const set = new Set<string>();
  publications.forEach((p) => p.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort();
}
