/**
 * Tiny class-name combiner. Skips falsy values.
 * Avoids clsx dependency for now.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
