/**
 * A stable element id from a name: "Sierra Concepts E-Solutions" with the
 * prefix "role" becomes "role-sierra-concepts-e-solutions". Shared by the
 * sections that carry the ids and the evidence map that links to them, so the
 * two cannot drift apart.
 */
export function anchorId(prefix: string, name: string): string {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `${prefix}-${slug}`;
}
