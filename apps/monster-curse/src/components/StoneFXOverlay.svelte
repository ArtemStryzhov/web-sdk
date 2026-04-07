<script lang="ts">
	import { FadeContainer } from 'components-pixi';
	import { eventEmitter } from '../game/eventEmitter';
	import { getContext } from '../game/context';
	import { sound } from '../game/sound';
	import StoneAnimation from './StoneAnimation.svelte';

	type Props = {
		zIndex?: number;
	};

	const props: Props = $props();
	const context = getContext();

	let show = $state(false);
	let playedTransitions = $state(new Set<string>());
	let wasInBonusGameWhenWinShowed = $state(false);

	const playTransitionSound = (reason: string) => {
		if (!sound.players) {
			return;
		}

		sound.players.once.play({ name: 'sfx_transition', forcePlay: true });
	};

	// Listen for freeSpinOutroHide to trigger stones animation after total win
	eventEmitter.subscribeHandlerMap({
		freeSpinIntroShow: async () => {
			// Base to free: play immediately when freespin intro shows
			if (!show) {
				show = true;
				playTransitionSound('freeSpinIntroShow');
			}
		},
		freeSpinOutroHide: async () => {
			const currentGameType = context.stateGame.gameType;
			// Free to base transition: play stones animation after total win outro hides
			if (currentGameType === 'basegame' && !show && !wasInBonusGameWhenWinShowed && !context.stateGame.wasBonusGameWhenFreegameEnded) {
				show = true;
				playTransitionSound('freeSpinOutroHide free->base');
			}
			// Also check if we were in a bonus game when win screen showed
			if (wasInBonusGameWhenWinShowed && currentGameType === 'basegame') {
				const transitionKey = 'bonusGameEnd';
				if (!playedTransitions.has(transitionKey) && !show) {
					show = true;
					playedTransitions.add(transitionKey);
					wasInBonusGameWhenWinShowed = false;
					playTransitionSound('freeSpinOutroHide bonusGameEnd');
				}
			}
			// Also check if the freegame that just ended was a bonus game
			if (context.stateGame.wasBonusGameWhenFreegameEnded && currentGameType === 'basegame') {
				const transitionKey = 'bonusGameEnd';
				if (!playedTransitions.has(transitionKey) && !show) {
					show = true;
					playedTransitions.add(transitionKey);
					context.stateGame.wasBonusGameWhenFreegameEnded = false;
					playTransitionSound('freeSpinOutroHide wasBonusGameWhenFreegameEnded');
				}
			}
		},
		winShow: async () => {
			if (context.stateGame.isInBonusGame) {
				wasInBonusGameWhenWinShowed = true;
				playedTransitions.delete('bonusGameEnd');
			}
		},
		bonusGameEnd: async () => {
			if (wasInBonusGameWhenWinShowed) {
				const transitionKey = 'bonusGameEnd';
				if (!playedTransitions.has(transitionKey) && !show) {
					show = true;
					playedTransitions.add(transitionKey);
					wasInBonusGameWhenWinShowed = false;
					playTransitionSound('bonusGameEnd');
				}
			}
		},
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