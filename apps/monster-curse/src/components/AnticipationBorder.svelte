<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS, REEL_PADDING } from '../game/constants';

	type Props = {
		reel: Reel;
		side: 'left' | 'right';
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// Calculate position
	const boardLayout = context.stateGameDerived.boardLayout();
	const reelCenterX = boardLayout.x - boardLayout.width * 0.5 + (props.reel.reelIndex + REEL_PADDING) * SYMBOL_SIZE;
	
	// Offset to left or right edge of the reel
	const offsetX = props.side === 'left' ? -SYMBOL_SIZE * 0.5 : SYMBOL_SIZE * 0.5;
	const x = reelCenterX + offsetX;
	
	// Position at bottom 10% of the board
	const boardHeight = SYMBOL_SIZE * BOARD_DIMENSIONS.y;
	const y = boardLayout.y + boardHeight * 0.2; // Move down 40% from center = bottom 10%

	// Watch for reel stop to trigger oncomplete
	$effect(() => {
		if (props.reel.reelState.motion === 'stopped') {
			props.oncomplete();
		}
	});
</script>

<SpineProvider
	key="anticipation"
	width={SYMBOL_SIZE * 0.5}
	height={SYMBOL_SIZE * BOARD_DIMENSIONS.y * 0.14}
	{x}
	{y}
	zIndex={10001}
>
	<SpineTrack
		trackIndex={0}
		animationName="payframe3"
		loop={true}
		timeScale={stateBetDerived.timeScale()}
	/>
</SpineProvider>

