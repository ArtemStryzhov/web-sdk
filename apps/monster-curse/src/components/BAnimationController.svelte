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
		
		// Animate in both 'win' and 'land' states
		if (currentState !== 'win' && currentState !== 'land') {
			return;
		}
		
		// Always allow animation to restart - remove the blocking check
		// This ensures animation plays every time state changes to 'win'
		
		// Clear any existing tracks to start fresh
		spine.state.clearTracks();
		
		// Reset animation state completely
		spine.state.timeScale = 1;
		spine.skeleton.setToSetupPose();
		spine.state.apply(spine.skeleton);
		
		// Set animation with loop=false EXPLICITLY
		const track = spine.state.setAnimation(0, 'win', false);
		
		// FORCE settings
		if (track) {
			track.loop = false;
			track.timeScale = 1; // Normal speed
			track.mixDuration = 0; // No mixing/blending
			track.trackTime = 0; // Start from beginning
			track.animationStart = 0; // Start from beginning
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
		
		// Fallback timeout: animation duration is 3.025 seconds + buffer
		// 3.025 * 1000 = 3025ms, add 500ms buffer = 3525ms
		timeout = setTimeout(() => {
			if (!hasCompleted) {
				hasCompleted = true;
				spine.state.clearTracks();
				props.oncomplete?.();
			}
		}, 3525);
		
		// Cleanup when effect re-runs or component destroys
		return () => {
			if (timeout) clearTimeout(timeout);
		};
	});

</script>

