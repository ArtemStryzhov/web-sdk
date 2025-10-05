<script lang="ts">
	import { Container } from 'pixi-svelte';
	import ReelSymbol from './ReelSymbol.svelte';
	import { getContext } from '../game/context';

	const context = getContext();
</script>

<Container sortableChildren={true}>
	{#each context.stateGame.board as reel, reelIndex (reelIndex)}
		{#each reel.reelState.symbols as reelSymbol}
			<ReelSymbol {reelIndex} {reelSymbol} />
		{/each}
	{/each}
</Container>
