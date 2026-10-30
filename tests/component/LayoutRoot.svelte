<script lang="ts">
// The layout's tree drawn as the workspace draws it, following the store: a change to the
// tree and the panes it ends happen in one flush, as they do in the app.
import LayoutNodeView from '../../src/renderer/layout/LayoutNodeView.svelte'
import { layout } from '../../src/renderer/stores/layout.svelte.ts'
</script>

<LayoutNodeView node={layout.tree.root} />
