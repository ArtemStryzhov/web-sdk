<script lang="ts" module>
	/**
	 * Broadcast this (with `broadcastAsync`) right before switching anything the player can
	 * see on the board - game type, background, reel padding. It resolves once the falling
	 * stones fully cover the screen, so the swap happens behind them. It resolves
	 * immediately when no stones transition is running, and is safety-capped so a book
	 * event can never hang on it.
	 */
	export type EmitterEventStoneFX = { type: 'stonesCoverWait' };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
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

	// How long a `stonesCoverWait` waits before giving up and letting the caller continue,
	// so a missed `onCover` can never stall the book event queue.
	const COVER_WAIT_TIMEOUT = 3000;

	let show = $state(false);
	let playedTransitions = $state(new Set<string>());
	let wasInBonusGameWhenWinShowed = $state(false);
	let isCovered = false;
	let coverWaiters: (() => void)[] = [];

	const playTransitionSound = (reason: string) => {
		if (!sound.players) {
			return;
		}

		sound.players.once.play({ name: 'sfx_transition', forcePlay: true });
	};

	const resolveCoverWaiters = () => {
		const waiters = coverWaiters;
		coverWaiters = [];
		waiters.forEach((resolve) => resolve());
	};

	const onCover = () => {
		isCovered = true;
		resolveCoverWaiters();
	};

	const startTransition = (reason: string) => {
		isCovered = false;
		show = true;
		playTransitionSound(reason);
	};

	const waitForCover = () => {
		if (!show || isCovered) return;

		return new Promise<void>((resolve) => {
			let settled = false;
			const settle = () => {
				if (settled) return;
				settled = true;
				resolve();
			};
			coverWaiters.push(settle);
			setTimeout(settle, COVER_WAIT_TIMEOUT);
		});
	};

	// Listen for freeSpinOutroHide to trigger stones animation after total win.
	// Store the unsubscribe function so we can clean up on component destroy and
	// prevent orphaned handlers accumulating in the global event emitter.
	const unsubscribe = eventEmitter.subscribeHandlerMap({
		freeSpinIntroShow: async () => {
			// Base to free: play immediately when freespin intro shows
			if (!show) {
				startTransition('freeSpinIntroShow');
			}
		},
		// `freeSpinOutroHide` is only ever broadcast at the end of a freegame, so it always
		// marks a free -> base boundary. The board itself is still 'freegame' here on purpose
		// (bookEventHandlerMap switches it once these stones cover the screen), so the game
		// type must not be part of these guards.
		freeSpinOutroHide: async () => {
			// Free to base transition: play stones animation after total win outro hides
			if (!show && !wasInBonusGameWhenWinShowed && !context.stateGame.wasBonusGameWhenFreegameEnded) {
				startTransition('freeSpinOutroHide free->base');
			}
			// Also check if we were in a bonus game when win screen showed
			if (wasInBonusGameWhenWinShowed) {
				const transitionKey = 'bonusGameEnd';
				if (!playedTransitions.has(transitionKey) && !show) {
					playedTransitions.add(transitionKey);
					wasInBonusGameWhenWinShowed = false;
					startTransition('freeSpinOutroHide bonusGameEnd');
				}
			}
			// Also check if the freegame that just ended was a bonus game
			if (context.stateGame.wasBonusGameWhenFreegameEnded) {
				const transitionKey = 'bonusGameEnd';
				if (!playedTransitions.has(transitionKey) && !show) {
					playedTransitions.add(transitionKey);
					context.stateGame.wasBonusGameWhenFreegameEnded = false;
					startTransition('freeSpinOutroHide wasBonusGameWhenFreegameEnded');
				}
			}
		},
		winShow: async () => {
			if (context.stateGame.isInBonusGame) {
				wasInBonusGameWhenWinShowed = true;
				playedTransitions.delete('bonusGameEnd');
			}
		},
		stonesCoverWait: async () => waitForCover(),
		bonusGameEnd: async () => {
			if (wasInBonusGameWhenWinShowed) {
				const transitionKey = 'bonusGameEnd';
				if (!playedTransitions.has(transitionKey) && !show) {
					playedTransitions.add(transitionKey);
					wasInBonusGameWhenWinShowed = false;
					startTransition('bonusGameEnd');
				}
			}
		},
	});

	onDestroy(unsubscribe);
</script>

<!-- No cross-fade: the stones ramp their own cover in, and fading the whole overlay would
     make the veil translucent exactly when the board state is swapped behind it. -->
<FadeContainer show={show} duration={0} zIndex={props.zIndex ?? 10050}>
	<StoneAnimation
		{onCover}
		onComplete={() => {
			show = false;
			isCovered = false;
			resolveCoverWaiters();
		}}
	/>
</FadeContainer>