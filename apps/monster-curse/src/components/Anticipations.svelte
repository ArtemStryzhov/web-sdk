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
					
					// Remove this reel from the played set so the next reel can play its sound
					reelsWithSoundPlayed.delete(reelIndex);
					
					// Check if there are other reels that are still anticipating or will start
					const hasOtherAnticipatingReels = context.stateGame.board.some(
						(otherReel, otherIndex) => 
							otherIndex !== reelIndex && otherReel.reelState.anticipating
					);
					
					// If there are more reels coming, stop the current sound so it can restart for the next reel
					if (hasOtherAnticipatingReels && lastAnticipationSound) {
						context.eventEmitter.broadcast({ type: 'soundStop', name: lastAnticipationSound });
					}
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

	// Map reel index (0-based) to the correct anticipation sound name.
	// Reel 2 (3rd) → _1, reel 3 (4th) → _2, reel 4 (5th) → _3.
	// If only the last reel anticipates, it gets _3 regardless.
	function getAnticipationSound(reelIndex: number): 'sfx_symbol_anticipation_1' | 'sfx_symbol_anticipation_2' | 'sfx_symbol_anticipation_3' {
		if (reelIndex >= 4) return 'sfx_symbol_anticipation_3';
		if (reelIndex >= 3) return 'sfx_symbol_anticipation_2';
		return 'sfx_symbol_anticipation_1';
	}

	// Track which reels have already played their anticipation sound
	const reelsWithSoundPlayed = $state<Set<number>>(new Set());
	let lastAnticipationSound = $state<'sfx_symbol_anticipation_1' | 'sfx_symbol_anticipation_2' | 'sfx_symbol_anticipation_3' | null>(null);

	// Play anticipation sound for each reel when it becomes the current anticipating reel
	$effect(() => {
		// Only play sound for the current anticipating reel, not all anticipating reels
		if (currentAnticipatingReelIndex >= 0 && !reelsWithSoundPlayed.has(currentAnticipatingReelIndex)) {
			const reel = context.stateGame.board[currentAnticipatingReelIndex];
			if (reel && reel.reelState.anticipating) {
				// Mark this reel as having played its sound
				reelsWithSoundPlayed.add(currentAnticipatingReelIndex);

				const soundName = getAnticipationSound(currentAnticipatingReelIndex);

				// Stop any previous anticipation sound first
				if (lastAnticipationSound) {
					context.eventEmitter.broadcast({ type: 'soundStop', name: lastAnticipationSound });
				}
				lastAnticipationSound = soundName;

				// Play the reel-specific anticipation sound
				context.eventEmitter.broadcast({ type: 'soundLoop', name: soundName });
				context.eventEmitter.broadcast({
					type: 'soundFade',
					name: soundName,
					from: 0,
					to: 1,
					duration: SECOND,
				});
			}
		}
	});

	// Clean up sound tracking when anticipation ends
	$effect(() => {
		if (!hasAnticipation) {
			reelsWithSoundPlayed.clear();
			// Stop whichever anticipation sound was last playing
			if (lastAnticipationSound) {
				context.eventEmitter.broadcast({ type: 'soundStop', name: lastAnticipationSound });
				lastAnticipationSound = null;
			}
		}
	});
</script>

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
