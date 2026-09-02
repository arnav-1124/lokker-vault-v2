/**
 * Identifier and random-value helpers.
 *
 * Identifiers use crypto.randomUUID() — collision-resistant and sourced
 * from the platform CSPRNG. Date.now()/Math.random() concatenations are
 * forbidden for identifiers (see AGENTS.md security rules).
 */
export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

/** Cryptographically random lowercase hex string of exactly `length` characters. */
export function randomHex(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length / 2)));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}
