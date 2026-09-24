<script lang="ts">
/**
 * The frame round a pane brought to the front (architecture.md §5.5): the shell's
 * notched border, a size up, with corner brackets and a rail of ticks - so a pane
 * lifted out of the workspace reads as the one being looked at, not as a pane
 * that lost its place.
 *
 * It sits just outside the pane's box, behind the pane (styles/frames.css,
 * `.zoom-frame`), so the widget keeps the size the zoom gave it; and it is a child
 * of the pinned element, so it flies in and out with the pane's own transform and
 * costs nothing of its own. Drawn once: nothing in it moves.
 */
</script>

<div class="zoom-frame" aria-hidden="true" data-testid="zoom-frame">
  <span class="zoom-bracket tl"></span>
  <span class="zoom-bracket br"></span>
  <span class="zoom-rail top"></span>
  <span class="zoom-rail bottom"></span>
  <span class="zoom-hint">ESC · RETURN</span>
</div>
