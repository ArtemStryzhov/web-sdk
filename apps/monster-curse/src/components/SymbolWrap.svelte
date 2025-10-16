<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';
	import { getContextBoard } from 'components-shared';

	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

	type Props = {
		debug?: boolean;
		x: number;
		y: number;
		symbolIndex: number;
		animating: boolean;
		children: Snippet;
	};

	const props: Props = $props();
	const boardContext = getContextBoard();
	// Show symbols that are in frame, regardless of animation state
	// The animating prop controls animation, not visibility
	const show = $derived(true);

	// During spinning: use Y position to allow smooth animation through visible area
	// During static: use symbolIndex to only show indices 1-5
	const isSpinning = $derived(boardContext.animate);
	const inFrame = $derived(
		isSpinning
			? (props.y > 0 && props.y < SYMBOL_SIZE * 5.5) // During spin: tight bounds to exclude index 6
			: (props.symbolIndex >= 1 && props.symbolIndex <= 5) // During static: only indices 1-5
	);
</script>

{#if props.debug || (show && inFrame)}
	<Container x={props.x} y={props.y} sortableChildren={true}>
		{@render props.children()}
	</Container>
{/if}
