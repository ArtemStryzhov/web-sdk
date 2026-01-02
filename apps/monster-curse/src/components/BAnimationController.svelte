<script lang="ts" module>
	// Track which states each spine instance has already animated in
	// Using WeakMap<Spine, Set<State>> so each spine can animate in multiple states
	const startedSpines = new WeakMap<any, Set<string>>();
</script>

<script lang="ts">
	import { getContextSpine } from 'pixi-svelte';
	import type { SymbolState } from '../game/types';

	type Props = {
		state: SymbolState;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const spine = getContextSpine();
	
	let timeout: ReturnType<typeof setTimeout> | null = null;
	
	// Use effect to react to state changes (not onMount which only runs once)
	$effect(() => {
		const currentState = props.state;
		
		if (!spine) {
			return;
		}
		
		// Get or initialize the set of animated states for this spine instance
		const animatedStates = startedSpines.get(spine) || new Set<string>();
		
		// Check if this spine has already animated in this state
		if (animatedStates.has(currentState)) {
			return;
		}
		
		// Mark this state as animated for this spine instance
		animatedStates.add(currentState);
		startedSpines.set(spine, animatedStates);
		
		// Clear any existing tracks to start fresh
		spine.state.clearTracks();
		
		// Set animation with loop=false EXPLICITLY
		const track = spine.state.setAnimation(0, 'win', false);
		
		// FORCE settings
		if (track) {
			track.loop = false;
			track.timeScale = 0.85; // 15% slower
			track.mixDuration = 0; // No mixing/blending
		}
		
		// Track when animation completes
		let hasCompleted = false;
		
		// Add completion listener directly on the track
		if (track) {
			track.listener = {
				complete: () => {
					if (hasCompleted) return;
					hasCompleted = true;
					
					if (timeout) clearTimeout(timeout);
					
					// STOP the animation completely
					spine.state.setEmptyAnimation(0, 0);
					
					props.oncomplete?.();
				}
			};
		}
		
		// Fallback timeout in case listener doesn't fire (0.6s / 0.85 + buffer = ~900ms)
		timeout = setTimeout(() => {
			if (!hasCompleted) {
				hasCompleted = true;
				spine.state.clearTracks();
				props.oncomplete?.();
			}
		}, 900);
		
		// Cleanup when effect re-runs or component destroys
		return () => {
			if (timeout) clearTimeout(timeout);
		};
	});

</script>

