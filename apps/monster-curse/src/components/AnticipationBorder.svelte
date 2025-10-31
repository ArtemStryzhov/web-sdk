<script lang="ts">
	import { onMount } from 'svelte';
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
	
	onMount(() => {
		return () => {
			// Cleanup if needed
		};
	});

	// Calculate position reactively - memoized in single derivation to prevent duplicate renders
	const position = $derived.by(() => {
		if (!props.reel) {
			return { x: 0, y: 0 };
		}
		
		const boardLayout = context.stateGameDerived.boardLayout();
		const boardHeight = SYMBOL_SIZE * BOARD_DIMENSIONS.y;
		
		const reelCenterX = boardLayout.x - boardLayout.width * 0.5 + (props.reel.reelIndex + REEL_PADDING) * SYMBOL_SIZE;
		const offsetX = props.side === 'left' ? -SYMBOL_SIZE * 0.5 : SYMBOL_SIZE * 0.5;
		const x = reelCenterX + offsetX;
		const y = boardLayout.y + boardHeight * 0.2;
		
		return { x, y };
	});

	// Watch for reel stop to trigger oncomplete
	$effect(() => {
		if (props.reel && props.reel.reelState.motion === 'stopped') {
			props.oncomplete();
		}
	});
</script>

<SpineProvider
	key="anticipation"
	width={SYMBOL_SIZE * 0.5}
	height={SYMBOL_SIZE * BOARD_DIMENSIONS.y * 0.14}
	x={position.x}
	y={position.y}
	zIndex={10001}
>
	<SpineTrack
		trackIndex={0}
		animationName="payframe3"
		loop={true}
		timeScale={stateBetDerived.timeScale()}
	/>
</SpineProvider>

