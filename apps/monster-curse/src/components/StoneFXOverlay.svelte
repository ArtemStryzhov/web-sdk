<script lang="ts">
	import { FadeContainer } from 'components-pixi';
	import { getContext } from '../game/context';
	import StoneAnimation from './StoneAnimation.svelte';

	type Props = {
		zIndex?: number;
	};

	const props: Props = $props();
	const context = getContext();

	let show = $state(false);
	let prevGameType = $state<string | null>(null);
	let playedTransitions = $state(new Set<string>());
	let waitingForOutro = $state(false);

	// Listen for freeSpinOutroHide to trigger stones animation after total win
	context.eventEmitter.subscribeOnMount({
		freeSpinOutroHide: async () => {
			// If we're waiting for outro to complete, trigger stones animation now
			if (waitingForOutro && prevGameType === 'freegame' && context.stateGame.gameType === 'basegame') {
				const transitionKey = 'freegame->basegame';
				if (!playedTransitions.has(transitionKey) && !show) {
					show = true;
					playedTransitions.add(transitionKey);
					waitingForOutro = false;
				}
			}
		},
	});

	$effect(() => {
		const loading = context.stateLayout.showLoadingScreen;
		const current = context.stateGame.gameType;

		if (prevGameType === null) {
			prevGameType = current;
			return;
		}

		if (loading) {
			prevGameType = current;
			return;
		}

		const transitionKey = `${prevGameType}->${current}`;

		// Only trigger animation once per unique transition
		const isBaseToFree = prevGameType === 'basegame' && current === 'freegame';
		const isFreeToBase = prevGameType === 'freegame' && current === 'basegame';

		if (isBaseToFree && !playedTransitions.has(transitionKey) && !show) {
			// Base to free: play immediately
			show = true;
			playedTransitions.add(transitionKey);
		} else if (isFreeToBase && !playedTransitions.has(transitionKey) && !show) {
			// Free to base: wait for total win animation to complete
			waitingForOutro = true;
		}

		prevGameType = current;
	});
</script>

<FadeContainer show={show} zIndex={props.zIndex ?? 10050}>
	<StoneAnimation
		duration={500}
		speed={4500}
		scale={1/2}
		onComplete={() => {
			show = false;
		}}
	/>
</FadeContainer>