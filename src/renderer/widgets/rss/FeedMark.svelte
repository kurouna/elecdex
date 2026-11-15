<script lang="ts">
import type { FeedMark } from '@shared/feeds-view'

/**
 * A feed's mark: its tag in a box, in its hue (QUAKES' magnitude box, in the feed's colour).
 * `solid` fills the box, for TICKER's one headline; `read` dims it and dashes its edge.
 */
interface Props {
  mark: FeedMark
  solid?: boolean
  read?: boolean
}

const { mark, solid = false, read = false }: Props = $props()
</script>

<span class="mark" class:solid class:read style:--mark-turn={mark.turn} data-testid="rss-mark">{mark.tag}</span>

<style>
.mark {
  --tone: hsl(calc(var(--mark-h) + var(--mark-turn, 0)) var(--mark-s) var(--mark-l));
  display: inline-block;
  flex: none;
  width: 2.4rem;
  padding: 0.05rem 0;
  border: 1px solid var(--tone);
  color: var(--tone);
  font-family: var(--font-mono);
  font-size: var(--step--2);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.04em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
}

.mark.solid {
  background: var(--tone);
  color: var(--surface-1);
}

.mark.read {
  border-style: dashed;
  opacity: 0.5;
}
</style>
