<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolX } from '../game/utils';

	const context = getContext();
	
	// Define visible frame boundaries (same as SymbolWrap)
	const top = 0;
	const bottom = SYMBOL_SIZE * BOARD_DIMENSIONS.y;
</script>

<!-- Render payframes for all win state symbols at the highest z-index -->
{#each context.stateGame.board as reel, reelIndex}
	{#each reel.reelState.symbols as reelSymbol}
		{@const symbolY = reelSymbol.symbolY()}
		{@const inFrame = symbolY >= top && symbolY <= bottom}
		{#if inFrame && reelSymbol.symbolState === 'win' && !['S'].includes(reelSymbol.rawSymbol.name)}
			<SpineProvider
				x={getSymbolX(reelIndex)}
				y={symbolY}
				key="anticipation"
				width={SYMBOL_SIZE * 0.6}
				zIndex={10000}
			>
				<SpineTrack trackIndex={0} animationName={'payframe'} loop />
			</SpineProvider>
		{/if}
	{/each}
{/each}

