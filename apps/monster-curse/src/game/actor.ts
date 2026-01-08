import _ from 'lodash';

import { stateBet } from 'state-shared';
import { checkIsMultipleRevealEvents } from 'utils-book';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { stateXstateDerived } from './stateXstate';
import { playBet, convertTorResumableBet } from './utils';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import config from './config';

const primaryMachines = createPrimaryMachines<Bet>({
	onResumeGameActive: (lastBetData) => convertTorResumableBet(lastBetData),
	onResumeGameInactive: (lastBetData) => {
		const lastRevealEvent = _.findLast(
			lastBetData.state,
			(bookEvent) => bookEvent?.type === 'reveal',
		);

		if (lastRevealEvent) stateGameDerived.enhancedBoard.settle(lastRevealEvent.board);
	},
	onNewGameStart: async () => {
		// Stop win animation looping immediately when user presses spin
		stateGame.shouldLoopWinAnimations = false;
		stateGame.winAnimationData = null;
		
		// Note: Don't reset isInBonusGame here - let the reveal handler detect the transition
		// from bonus to non-bonus when processing the first reveal of the new bet
		
		// Clear isCollected flags from previous spin
		stateGame.board.forEach(reel => {
			reel.reelState.symbols.forEach(symbol => {
				if (symbol.rawSymbol.isCollected) {
					symbol.rawSymbol.isCollected = false;
				}
			});
		});
		
		if ((stateBet.isTurbo && stateXstateDerived.isAutoBetting()) || stateBet.isSpaceHold) return;
		stateBet.winBookEventAmount = 0;
		await stateGameDerived.enhancedBoard.preSpin({
			paddingBoard: config.paddingReels[stateGame.gameType],
		});
	},
	onNewGameError: () => stateGameDerived.enhancedBoard.settle(),
	onPlayGame: async (bet) => await playBet(bet),
	checkIsBonusGame: (bet) => checkIsMultipleRevealEvents({ bookEvents: bet.state }),
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
