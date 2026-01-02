<script lang="ts">
	import { SpineProvider } from 'pixi-svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import BAnimationController from './BAnimationController.svelte';
	import type { SymbolState } from '../game/types';

	type Props = {
		sizeMultiplier: number;
		zIndex: number;
		oncomplete?: () => void;
		positionKey: string; // For debugging
		state: SymbolState;
	};

	const props: Props = $props();
	
	// Position offsets
	const xOffset = 21; // 1px right from original 20
	const yOffset = SYMBOL_SIZE * 0.12 - 3; // 3px up
</script>

<SpineProvider
	key="B_animation"
	x={xOffset}
	y={yOffset}
	anchor={0.5}
	height={SYMBOL_SIZE * props.sizeMultiplier}
	zIndex={props.zIndex}
>
	<BAnimationController state={props.state} oncomplete={props.oncomplete} />
</SpineProvider>

