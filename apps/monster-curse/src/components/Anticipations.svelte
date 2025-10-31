<script lang="ts">
	import { onMount } from 'svelte';
	import { OnMount } from 'components-shared';
	import { SECOND } from 'constants-shared/time';

	import { getContext } from '../game/context';
	import AnticipationBorder from './AnticipationBorder.svelte';

	const context = getContext();
	
	onMount(() => {
		return () => {
			// Cleanup if needed
		};
	});
	const hasAnticipation = $derived(
		context.stateGame.board.some((reel) => reel.reelState.anticipating),
	);

	// Use state to prevent re-renders when index hasn't actually changed
	let currentAnticipatingReelIndex = $state(-1);
	let lastCalculatedIndex = -1;
	
	$effect(() => {
		const anticipatingReels = context.stateGame.board.filter(
			(reel) => reel.reelState.anticipating && reel.reelState.motion !== 'stopped'
		);
		
		const newIndex = anticipatingReels.length === 0 
			? -1
			: anticipatingReels.reduce((leftmost, current) => 
				current.reelIndex < leftmost.reelIndex ? current : leftmost
			  ).reelIndex;
		
		// Only update if index actually changed
		if (newIndex !== lastCalculatedIndex) {
			lastCalculatedIndex = newIndex;
			currentAnticipatingReelIndex = newIndex;
		}
	});
	
	// Cache the current reel to prevent reactive dependencies in template
	const currentReel = $derived.by(() => {
		return currentAnticipatingReelIndex >= 0 && currentAnticipatingReelIndex < context.stateGame.board.length
			? context.stateGame.board[currentAnticipatingReelIndex]
			: null;
	});

	// Track completion state for left and right border animations
	type CompletionState = {
		left: boolean;
		right: boolean;
	};
	
	const completionStates = $state<Map<number, CompletionState>>(new Map());

	// Mark animation as complete and check if both are done
	function markComplete(reelIndex: number, type: keyof CompletionState) {
		// Add safety check for invalid indices
		if (reelIndex < 0 || reelIndex >= context.stateGame.board.length) {
			return;
		}
		
		if (!completionStates.has(reelIndex)) {
			completionStates.set(reelIndex, { left: false, right: false });
		}
		
		const state = completionStates.get(reelIndex);
		if (state) {
			state[type] = true;
			
			if (state.left && state.right) {
				const reel = context.stateGame.board[reelIndex];
				if (reel) {
					reel.reelState.anticipating = false;
				}
				completionStates.delete(reelIndex);
			}
		}
	}
	
	// Clean up completion states when anticipation ends
	$effect(() => {
		if (!hasAnticipation) {
			completionStates.clear();
		}
	});
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

{#if currentReel}
	<AnticipationBorder 
		reel={currentReel} 
		side="left" 
		oncomplete={() => markComplete(currentAnticipatingReelIndex, 'left')} 
	/>
	<AnticipationBorder 
		reel={currentReel} 
		side="right" 
		oncomplete={() => markComplete(currentAnticipatingReelIndex, 'right')} 
	/>
{/if}
