<script lang="ts">
	import { OnMount } from 'components-shared';
	import { SECOND } from 'constants-shared/time';

	import { getContext } from '../game/context';
	import AnticipationBorder from './AnticipationBorder.svelte';

	const context = getContext();
	const hasAnticipation = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);

	// Track completion state for left and right border animations
	type CompletionState = {
		left: boolean;
		right: boolean;
	};
	
	const completionStates = $state<Map<number, CompletionState>>(new Map());

	// Mark animation as complete and check if both are done
	function markComplete(reelIndex: number, type: keyof CompletionState) {
		// Initialize state if it doesn't exist
		if (!completionStates.has(reelIndex)) {
			completionStates.set(reelIndex, { left: false, right: false });
		}
		
		const state = completionStates.get(reelIndex);
		if (state) {
			state[type] = true;
			
			// If both animations are complete, set anticipating to false
			if (state.left && state.right) {
				const reel = context.stateGame.board[reelIndex];
				reel.reelState.anticipating = false;
				completionStates.delete(reelIndex);
			}
		}
	}
</script>

{#if hasAnticipation}
	<OnMount
		onmount={() => {
			context.eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_anticipation' });
			context.eventEmitter.broadcast({
				type: 'soundFade',
				name: 'sfx_anticipation',
				from: 0,
				to: 1,
				duration: SECOND,
			});

			return () => {
				context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_anticipation' });
			};
		}}
	/>
{/if}

{#each context.stateGame.board as reel}
	{#if reel.reelState.anticipating}
		<AnticipationBorder {reel} side="left" oncomplete={() => markComplete(reel.reelIndex, 'left')} />
		<AnticipationBorder {reel} side="right" oncomplete={() => markComplete(reel.reelIndex, 'right')} />
	{/if}
{/each}
