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
	let wasInBonusGameWhenWinShowed = $state(false);

	// Listen for freeSpinOutroHide to trigger stones animation after total win
	context.eventEmitter.subscribeOnMount({
		freeSpinOutroHide: async () => {
			const currentGameType = context.stateGame.gameType;
			// If we're waiting for outro to complete, trigger stones animation now
			if (waitingForOutro && prevGameType === 'freegame' && currentGameType === 'basegame') {
				const transitionKey = 'freegame->basegame';
				if (!playedTransitions.has(transitionKey) && !show) {
					show = true;
					playedTransitions.add(transitionKey);
					waitingForOutro = false;
				}
			}
			// Also check if we were in a bonus game when win screen showed
			// This handles the case where bonus game ends when freegame ends (bought bonus game)
			// Check currentGameType instead of prevGameType since effect may have updated it
			if (wasInBonusGameWhenWinShowed && currentGameType === 'basegame') {
				const transitionKey = 'bonusGameEnd';
				if (!playedTransitions.has(transitionKey) && !show) {
					show = true;
					playedTransitions.add(transitionKey);
					wasInBonusGameWhenWinShowed = false;
				}
			}
			// Also check if the freegame that just ended was a bonus game
			// This handles the case where B symbols trigger freegame (no setWin during bonus game)
			if (context.stateGame.wasBonusGameWhenFreegameEnded && currentGameType === 'basegame') {
				const transitionKey = 'bonusGameEnd';
				if (!playedTransitions.has(transitionKey) && !show) {
					show = true;
					playedTransitions.add(transitionKey);
					context.stateGame.wasBonusGameWhenFreegameEnded = false;
				}
			}
		},
		winShow: async () => {
			// Track if we were in a bonus game when win screen shows
			// Only set it if we're in a bonus game (don't overwrite if already set)
			if (context.stateGame.isInBonusGame) {
				wasInBonusGameWhenWinShowed = true;
				// Reset the transition key when a new win screen shows during bonus game
				// This allows the animation to play when bonus game ends
				playedTransitions.delete('bonusGameEnd');
			}
		},
		bonusGameEnd: async () => {
			// If we were waiting for bonus game win screen to close, trigger stones animation now
			if (wasInBonusGameWhenWinShowed) {
				const transitionKey = 'bonusGameEnd';
				if (!playedTransitions.has(transitionKey) && !show) {
					show = true;
					playedTransitions.add(transitionKey);
					wasInBonusGameWhenWinShowed = false;
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