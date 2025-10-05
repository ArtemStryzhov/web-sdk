<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX } from '../game/utils';

	const context = getContext();
</script>

<!-- Render payframes for all win state symbols at the highest z-index -->
{#each context.stateGame.board as reel, reelIndex}
	{#each reel.reelState.symbols as reelSymbol}
		{#if reelSymbol.symbolState === 'win' && !['S'].includes(reelSymbol.rawSymbol.name)}
			<SpineProvider
				x={getSymbolX(reelIndex)}
				y={reelSymbol.symbolY()}
				key="anticipation"
				width={SYMBOL_SIZE * 0.6}
				zIndex={10000}
			>
				<SpineTrack trackIndex={0} animationName={'payframe'} loop />
			</SpineProvider>
		{/if}
	{/each}
{/each}

