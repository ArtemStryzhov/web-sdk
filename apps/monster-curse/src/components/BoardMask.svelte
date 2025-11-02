<script lang="ts">
	import { Rectangle } from 'pixi-svelte';
	import { getContextBoard } from 'components-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	type Props = { debug?: boolean };

	const props: Props = $props();
	const context = getContext();
	const boardContext = getContextBoard();
	
	// Conditional mask height: normal during spin to hide padding, extended during win for S symbols
	const maskHeight = $derived(
		boardContext.animate 
			? context.stateGameDerived.boardLayout().height // 600px during spin - clips padding
			: context.stateGameDerived.boardLayout().height + SYMBOL_SIZE * 4 // 1080px during win - allows S expansion
	);
</script>

{#if props.debug}
	<Rectangle
		alpha={0.5}
		backgroundColor={0xffffff}
		width={context.stateGameDerived.boardLayout().width}
		height={context.stateGameDerived.boardLayout().height}
	/>
{/if}

<Rectangle
	isMask
	x={-SYMBOL_SIZE}
	y={0}
	width={context.stateGameDerived.boardLayout().width + SYMBOL_SIZE * 2}
	height={maskHeight}
/>
