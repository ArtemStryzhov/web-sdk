<script lang="ts">
	import { onMount } from 'svelte';

	import { getReplayBet } from 'components-shared';
	import {
		stateBet,
		stateMetaDerived,
		stateReplay,
		stateReplayDerived,
		stateUi,
		stateUrlDerived,
	} from 'state-shared';

	import { getContext } from '../game/context';
	import { INITIAL_BOARD } from '../game/constants';

	const context = getContext();

	/**
	 * The scene as the round starts: an untouched board, no win or free-spin
	 * overlay, and none of the counters a previous playback left behind. A replay
	 * can be played any number of times, so a restart has to put all of it back —
	 * resetting the board alone would leave the second run showing the first run's
	 * free spins and win.
	 */
	const resetSceneToRoundStart = () => {
		const { stateGame, stateGameDerived, eventEmitter } = context;

		// stop the looping win animation before touching the board it animates
		stateGame.shouldLoopWinAnimations = false;
		stateGame.winAnimationData = null;

		// Overlays restore themselves on `replayReset` rather than on their own hide
		// events: `freeSpinOutroHide` is a step in the round, not a reset — it plays
		// the total-win sting and makes the stones run their free-to-base
		// transition. It also clears the latches no hide event touches, such as the
		// set of stone transitions already played.
		eventEmitter.broadcast({ type: 'replayReset' });
		eventEmitter.broadcast({ type: 'winLineHide' });
		eventEmitter.broadcast({ type: 'boardShow' });

		// A clone, not INITIAL_BOARD itself: the reels hold their raw symbols by
		// reference inside `$state`, so a played round writes its multipliers and
		// collected flags straight back into the module-level constant. Settling
		// the original would restore the previous run's leftovers.
		stateGameDerived.enhancedBoard.settle(structuredClone(INITIAL_BOARD));

		stateGame.gameType = 'basegame';
		stateGame.round = 0;
		stateGame.skipNextWinHighlight = false;
		stateGame.multiplierBoard = [];
		stateGame.scatterCounter = 0;
		stateGame.pendingBonusTriggerAnimation = false;
		stateGame.isInBonusGame = false;
		stateGame.wasBonusGameWhenFreegameEnded = false;
		stateGame.currentSpinIsTurbo = false;
		stateGame.pendingTurboLandingSound = false;
		stateGame.plannedSwordExpandKeys = [];
		stateGame.activeStickySwordKeys = [];
		stateGame.stickySwordPositions = [];

		stateBet.winBookEventAmount = 0;
		// free spins rewrite the active mode to BASE mid-round, so put the round's
		// own mode back before playing it again
		stateBet.activeBetModeKey = stateReplay.betModeKey;

		stateUi.freeSpinCounterShow = false;
		stateUi.freeSpinCounterCurrent = 0;
		stateUi.freeSpinCounterTotal = 0;
	};

	/**
	 * Plays the recorded round from its first book event. `resumeGame` consumes
	 * `stateBet.lastBet` and clears it, so the bet is rebuilt from the pristine
	 * round each time — which is what makes a second and third playback identical
	 * to the first.
	 */
	const playReplay = () => {
		const bet = getReplayBet();
		if (!bet) return;

		resetSceneToRoundStart();

		// @ts-ignore the replay round is the same shape the bet machine plays
		stateBet.lastBet = bet;
		stateReplayDerived.start();
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	};

	// The game actor only accepts RESUME_BET while it is idle, and the round's
	// machine is still settling for a moment after the final win the replay button
	// appears on. A press is therefore remembered and spent as soon as it can be.
	let replayRequested = $state(false);

	$effect(() => {
		if (!replayRequested) return;
		if (!context.stateXstateDerived.isIdle()) return;

		replayRequested = false;
		playReplay();
	});

	onMount(() => {
		// A replay does not start on its own: the start panel shows the round's
		// cost and win first, and playback begins on Start Replay.
		if (stateUrlDerived.replay()) return;

		if (stateBet.lastBet?.active && stateBet.lastBet.mode) {
			// Buy bonus modes (feature_contract, feature_blades, etc.) should only be used for the initial purchase
			// Once in an active freespin session, all continuation bets should use BASE mode
			// This prevents trying to re-purchase the bonus when resuming during freespins
			const isBuyBonusMode = stateMetaDerived.betModeData(stateBet.lastBet.mode)?.type === 'buy';
			if (isBuyBonusMode) {
				// Update both activeBetModeKey and the lastBet.mode itself
				stateBet.activeBetModeKey = 'BASE';
				stateBet.lastBet.mode = 'BASE';
			} else {
				stateBet.activeBetModeKey = stateBet.lastBet.mode;
			}
		}
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	});

	context.eventEmitter.subscribeOnMount({
		replayStart: () => (replayRequested = true),
	});
</script>
