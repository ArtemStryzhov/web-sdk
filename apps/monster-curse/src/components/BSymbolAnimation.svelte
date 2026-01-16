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
	// Move right by 2% of SYMBOL_SIZE, move down by 5% + 3% = 8% of SYMBOL_SIZE
	const xOffset = 21 + (SYMBOL_SIZE * 0.02); // Original offset + 2% right
	const yOffset = SYMBOL_SIZE * 0.12 - 3 + (SYMBOL_SIZE * 0.05) + (SYMBOL_SIZE * 0.03); // Original offset + 5% down + 3% more down
</script>

<SpineProvider
	key="B_animation"
	x={xOffset}
	y={yOffset}
	anchor={0.5}
	height={SYMBOL_SIZE * props.sizeMultiplier * 1.15 * 1.1 * 1.05}
	zIndex={props.zIndex}
>
	<BAnimationController state={props.state} oncomplete={props.oncomplete} />
</SpineProvider>

