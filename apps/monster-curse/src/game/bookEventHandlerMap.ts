import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { sequence } from 'utils-shared/sequence';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
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
			paddingBoard: config.paddingReels[bookEvent.gameType],
		});

		// Debug logging: Show visible symbols that landed on this spin (middle 5 per reel)
		const landedSymbols = bookEvent.board.map((reel, reelIndex) => {
			// Skip padding symbols, show only the visible middle symbols
			const startIndex = Math.floor((reel.length - 5) / 2);
			const visibleSymbols = reel.slice(startIndex, startIndex + 5);
			
			// Log multipliers if present
			visibleSymbols.forEach((symbol, rowIndex) => {
				if (symbol.multiplier) {
					console.log(`  Reel ${reelIndex}, Row ${rowIndex}: ${symbol.name} ×${symbol.multiplier}`);
				}
			});
			
			return visibleSymbols.map(symbol => symbol.name).join('');
		}).join(' ');
		console.log(`🎰 Spin: ${landedSymbols}`);

		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		// Get current board state for S symbol expansion logic
		const currentBoard = stateGameDerived.boardRaw();
		
		// Import utility functions
		const { checkSSymbolsInWins, generateSSymbolExpansionPositions } = await import('./utils');
		
		// Check if any S symbols participate in wins
		const sSymbolsInWins = checkSSymbolsInWins(bookEvent.wins, currentBoard);
		
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		
		// Animate regular win positions (each line sequentially)
		await sequence(bookEvent.wins, async (win) => {
			await animateSymbols({ positions: win.positions });
		});
		
		// If S symbols are in wins, animate their upward expansion
		if (sSymbolsInWins.length > 0) {
			// Set S symbols to expand state and animate upward expansion
			const expansionPositions = generateSSymbolExpansionPositions(sSymbolsInWins);
			
			// First, set the original S symbols to expand state
			sSymbolsInWins.forEach(position => {
				const reelSymbol = stateGame.board[position.reel].reelState.symbols[position.row];
				reelSymbol.symbolState = 'expand';
			});
			
			// Then animate the expansion positions
			if (expansionPositions.length > 0) {
				await animateSymbols({ positions: expansionPositions });
			}
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
		// S symbol (Silver Sword) collects W symbol multipliers in the same reel
		// Update the S symbol to show the collected multiplier (no expansion animation)
		const currentBoard = stateGameDerived.boardRaw();
		const startIndex = Math.floor((currentBoard[bookEvent.reel].length - 5) / 2);
		const visibleSymbols = currentBoard[bookEvent.reel].slice(startIndex, startIndex + 5);
		
		// Find the S symbol in this reel and update its collected multiplier
		visibleSymbols.forEach((symbol, rowIndex) => {
			if (symbol.name === 'S') {
				const reelSymbol = stateGame.board[bookEvent.reel].reelState.symbols[rowIndex];
				// Set the collected multiplier (wildSum * swordMultiplier)
				reelSymbol.rawSymbol.collectedMultiplier = bookEvent.collectWin / (bookEvent.wildSum || 1);
			}
		});
	},
	stickySwordEvent: async (bookEvent: BookEventOfType<'stickySwordEvent'>) => {
		// Blades of Fate mode: Sticky swords expand sequentially based on their positions
		// Each sword expands to its position height, then returns to static state
		
		// Import utility for waiting on promises
		const { waitForResolve } = await import('utils-shared/wait');
		
		// Process each sticky sword position sequentially
		await sequence(bookEvent.stickyPositions, async (position) => {
			// Get the reel symbol at this position
			const reelSymbol = stateGame.board[position.reel].reelState.symbols[position.row];
			
			// Ensure it's an S symbol
			if (reelSymbol.rawSymbol.name === 'S') {
				// Set the reel position for animation selection (0-4 based on row)
				reelSymbol.rawSymbol.reelPosition = position.row;
				
				// Trigger expansion animation
				reelSymbol.symbolState = 'expand';
				
				// Wait for expansion animation to complete
				const promise = waitForResolve((resolve: () => void) => (reelSymbol.oncomplete = resolve));
				await promise;
				
				// Return to static state after animation
				reelSymbol.symbolState = 'static';
			}
		});
	},
};
