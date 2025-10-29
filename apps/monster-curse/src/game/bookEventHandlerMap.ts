import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { sequence } from 'utils-shared/sequence';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { RawSymbol } from './types';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import config from './config';

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.sound?.bgm) {
		eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
	}
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
};

const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	if (stateBet.activeBetModeKey === 'SUPERSPIN' || stateGame.gameType === 'freegame') {
		// check if SUPERSPIN, when finishing a bet.
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: bookEvent,
			paddingBoard: config.paddingReels[bookEvent.gameType] as any,
		});

		// Count B symbols for bonus trigger animation
		let bSymbolCount = 0;
		(bookEvent.board as RawSymbol[][]).forEach((reel) => {
			const startIndex = Math.floor((reel.length - 5) / 2);
			const visibleSymbols = reel.slice(startIndex, startIndex + 5);
			
			visibleSymbols.forEach((symbol) => {
				if (symbol.name === 'B') bSymbolCount++;
			});
		});

		// Check if 3+ B symbols landed for bonus trigger animation
		if (bSymbolCount >= 3) {
			stateGame.pendingBonusTriggerAnimation = true;
		} else {
			stateGame.pendingBonusTriggerAnimation = false;
		}

		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		// Get current board state for S symbol expansion logic
		const currentBoard = stateGameDerived.boardRaw();
		
		// Import utility functions
		const { checkSSymbolsInWins, generateSSymbolExpansionPositions } = await import('./utils');
		const { waitForResolve } = await import('utils-shared/wait');
		
		// Check if any S symbols participate in wins
		const sSymbolsInWins = checkSSymbolsInWins(bookEvent.wins, currentBoard);
		
		// Store win data for potential looping
		stateGame.winAnimationData = {
			wins: bookEvent.wins,
			sSymbols: sSymbolsInWins,
		};
		
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		
		await sequence(bookEvent.wins, async (win) => {
			await animateSymbols({ positions: win.positions });
		});
		
		// If S symbols are in wins, animate their upward expansion
		if (sSymbolsInWins.length > 0) {
			const expansionPositions = generateSSymbolExpansionPositions(sSymbolsInWins);
			
			sSymbolsInWins.forEach(position => {
				const reelSymbol = stateGame.board[position.reel].reelState.symbols[position.row];
				reelSymbol.symbolState = 'expand';
			});
			
			if (expansionPositions.length > 0) {
				await animateSymbols({ positions: expansionPositions });
			}
		}
		
		// After all win animations, check if bonus trigger animation should play
		if (stateGame.pendingBonusTriggerAnimation) {
			// Find all B symbol positions on the board
			const bSymbolPositions: Position[] = [];
			stateGame.board.forEach((reel, reelIndex) => {
				reel.reelState.symbols.forEach((reelSymbol, rowIndex) => {
					if (reelSymbol.rawSymbol.name === 'B') {
						bSymbolPositions.push({ reel: reelIndex, row: rowIndex });
					}
				});
			});
			
			// Set all B symbols to 'win' state (triggers looping video animation)
			bSymbolPositions.forEach(position => {
				const reelSymbol = stateGame.board[position.reel].reelState.symbols[position.row];
				reelSymbol.symbolState = 'win';
			});
			
			// Wait for 2 animation cycles (assuming ~1 second per cycle)
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			// Return B symbols to static state
			bSymbolPositions.forEach(position => {
				const reelSymbol = stateGame.board[position.reel].reelState.symbols[position.row];
				reelSymbol.symbolState = 'static';
			});
			
			// Clear the flag
			stateGame.pendingBonusTriggerAnimation = false;
		}
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// animate scatters
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		// show free spin intro
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount + 1,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount + 1;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'winHide' });
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		// Do nothing
	},
	// customised
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				| BookEventOfType<T>
				| undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		const lastUpdateGlobalMultEvent = findLastBookEvent('updateGlobalMult' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		if (lastUpdateGlobalMultEvent) playBookEvent(lastUpdateGlobalMultEvent, { bookEvents });
	},
	swordCollectEvent: async (bookEvent: BookEventOfType<'swordCollectEvent'>) => {
		const currentBoard = stateGameDerived.boardRaw();
		const startIndex = Math.floor((currentBoard[bookEvent.reel].length - 5) / 2);
		const visibleSymbols = currentBoard[bookEvent.reel].slice(startIndex, startIndex + 5);
		
		visibleSymbols.forEach((symbol, rowIndex) => {
			if (symbol.name === 'S') {
				const reelSymbol = stateGame.board[bookEvent.reel].reelState.symbols[rowIndex];
				reelSymbol.rawSymbol.collectedMultiplier = bookEvent.collectWin / (bookEvent.wildSum || 1);
			}
		});
	},
	stickySwordEvent: async (bookEvent: BookEventOfType<'stickySwordEvent'>) => {
		const { waitForResolve } = await import('utils-shared/wait');
		
		await sequence(bookEvent.stickyPositions, async (position) => {
			const reelSymbol = stateGame.board[position.reel].reelState.symbols[position.row];
			
			if (reelSymbol.rawSymbol.name === 'S') {
				reelSymbol.rawSymbol.reelPosition = position.row;
				reelSymbol.symbolState = 'expand';
				
				const promise = waitForResolve((resolve: () => void) => (reelSymbol.oncomplete = resolve));
				await promise;
				
				reelSymbol.symbolState = 'static';
			}
		});
	},
};
