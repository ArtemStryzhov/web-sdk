<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import type { Reel } from '../game/stateGame.svelte';

	const context = getContext();
	
	// Define visible frame boundaries (same as SymbolWrap)
	const top = 0;
	const bottom = SYMBOL_SIZE * BOARD_DIMENSIONS.y;
	
	// Helper function to check if a symbol is covered by an expanded S symbol
	function isCoveredByExpandedS(reelIndex: number, symbolRow: number, board: Reel[]): boolean {
		const reel = board[reelIndex];
		if (!reel) return false;
		
		// Find all S symbols in this reel that are in 'expand' or 'win' state
		for (const sSymbol of reel.reelState.symbols) {
			const isExpandedS = sSymbol.rawSymbol.name === 'S' && 
				(sSymbol.symbolState === 'expand' || sSymbol.symbolState === 'win');
			
			if (isExpandedS) {
				// Check if current symbol is above the S symbol (covered by expansion)
				if (symbolRow < sSymbol.symbolIndex) {
					return true;
				}
			}
		}
		
		return false;
	}
</script>

<!-- Render payframes only for symbols actively in 'win' state -->
{#each context.stateGame.board as reel, reelIndex}
	{#each reel.reelState.symbols as reelSymbol}
		{@const symbolY = reelSymbol.symbolY()}
		{@const inFrame = symbolY >= top && symbolY <= bottom}
		{@const shouldShowPayframe = reelSymbol.symbolState === 'win' && !['S'].includes(reelSymbol.rawSymbol.name) && !isCoveredByExpandedS(reelIndex, reelSymbol.symbolIndex, context.stateGame.board)}
		{#if inFrame && shouldShowPayframe}
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

