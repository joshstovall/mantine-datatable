/**
 * Imperative API surfaced via the `dataTableRef` prop. Use it to scroll to a
 * specific record / index, or to read the underlying `@tanstack/react-virtual`
 * row virtualizer for advanced use cases.
 *
 * The ref's `current` is `null` until the table mounts. After mount, the API is
 * stable for the table's lifetime — scrollToRecord() can be called freely.
 */
export type DataTableScrollToOptions = {
  /**
   * Where to position the target row in the viewport.
   * - `'auto'` (default) — minimal scroll to bring the row into view
   * - `'start'` — scroll so the row is at the top
   * - `'center'` — scroll so the row is centered
   * - `'end'` — scroll so the row is at the bottom
   * @default `'auto'`
   */
  align?: 'auto' | 'start' | 'center' | 'end';
  /**
   * Scroll behavior. `'smooth'` for animated, `'auto'` for instant.
   * @default `'auto'`
   */
  behavior?: 'auto' | 'smooth';
};

export type DataTableRef<T = Record<string, unknown>> = {
  /**
   * Scroll the body so the row at `index` (in `records`) is visible. Requires
   * `virtualization.rows` to be enabled — no-op otherwise.
   */
  scrollToIndex: (index: number, options?: DataTableScrollToOptions) => void;

  /**
   * Scroll the body so the given record is visible. Matches by identity (`===`)
   * or by `idAccessor` if the record reference doesn't match. Requires
   * `virtualization.rows` to be enabled — no-op otherwise.
   */
  scrollToRecord: (record: T, options?: DataTableScrollToOptions) => void;
};
