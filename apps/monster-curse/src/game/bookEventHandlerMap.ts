import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { RawSymbol } from './types';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import config from './config';

// Convert payload row (1..5, top-based visible rows) to board array index.
// The board contains 7 symbols; visible window is the middle 5 with startIndex = floor((len-5)/2).
// Mapping: boardIndex = startIndex + (row - 1). If row not in 1..5, pass through.
const normalizeRowIndex = (row: number, reel: number) => {
	if (row >= 1 && row <= 5) {
		const len = stateGame.board[reel]?.reelState?.symbols?.length ?? 7;
		const startIndex = Math.floor((len - 5) / 2);
		return startIndex + (row - 1);
	}
	return row;
};

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

		// Clear anticipating flags from previous spin
		stateGame.board.forEach(reel => {
			reel.reelState.anticipating = false;
		});

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
		
		// Add minimum delay to ensure each spin is visible (especially spins without wins)
		// This prevents spins from being "skipped" visually when they process too quickly
		if (isBonusGame) {
			await new Promise(resolve => setTimeout(resolve, 500));
		}
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		// Skip stale highlights right after freegame → basegame transition
		if (stateGame.skipNextWinHighlight && stateGame.gameType === 'basegame') {
			stateGame.skipNextWinHighlight = false;
			stateGame.round += 1;
			const { logSpin } = await import('./debugSpins');
			logSpin(stateGame.round, { wins: bookEvent.wins });
			// Do not animate; just exit
			return;
		}
		// Get current board state for S symbol expansion logic
		const currentBoard = stateGameDerived.boardRaw();
		
		// Import utility functions
		const { checkSSymbolsInWins, generateSSymbolExpansionPositions } = await import('./utils');
		const { waitForResolve } = await import('utils-shared/wait');
		
		// Check if any S symbols participate in wins
		const sSymbolsInWins = checkSSymbolsInWins(bookEvent.wins, currentBoard);
		
		// Store win data for potential looping with logging and round increment
		stateGame.round += 1;
		const { logSpin, logHighlight } = await import('./debugSpins');
		logSpin(stateGame.round, { wins: bookEvent.wins });
		stateGame.winAnimationData = { wins: bookEvent.wins, sSymbols: sSymbolsInWins };
		
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		
	// Animate each win line sequentially
	for (let i = 0; i < bookEvent.wins.length; i++) {
		const win = bookEvent.wins[i];
		logHighlight(stateGame.round, win, i + 1, bookEvent.wins.length);
		// Set only the current win's symbols to postWinStatic first to reset them before animation
		win.positions.forEach((pos: Position) => {
			const reelSymbol = stateGame.board[pos.reel].reelState.symbols[normalizeRowIndex(pos.row, pos.reel)];
			if (reelSymbol.rawSymbol.name !== 'S') {
				reelSymbol.symbolState = 'postWinStatic';
			}
		});
		
		// Then animate current win line
		await animateSymbols({ positions: win.positions });
	}
		
		// If S symbols are in wins, animate their upward expansion
		if (sSymbolsInWins.length > 0) {
			const expansionPositions = generateSSymbolExpansionPositions(sSymbolsInWins);
			
			// Reset S symbols first to force animation to replay (in case they're already in 'expand' state)
			sSymbolsInWins.forEach(position => {
				const reelSymbol = stateGame.board[position.reel].reelState.symbols[position.row];
				reelSymbol.symbolState = 'postWinStatic';
			});
			
			// Small delay to ensure state change is registered
			await new Promise(resolve => setTimeout(resolve, 50));
			
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
		// Ensure we don't continue in a buy_ mode during freespins (prevents re-purchase loops)
		try {
			const { stateBet } = await import('state-shared');
			stateBet.activeBetModeKey = 'BASE';
			if (stateBet.lastBet) stateBet.lastBet.mode = 'BASE' as any;
		} catch {}
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
		// Clear any looping/stale win data and reset symbols before returning to basegame
		stateGame.shouldLoopWinAnimations = false;
		stateGame.winAnimationData = null;
		stateGame.board.forEach((reel) => {
			reel.reelState.symbols.forEach((symbol) => {
				symbol.symbolState = 'static';
				symbol.oncomplete = () => {};
			});
		});
		// Skip the first basegame win highlight after FS to avoid leftover animations
		stateGame.skipNextWinHighlight = true;
		// Reset bet mode to BASE after freespins complete
		stateBet.activeBetModeKey = 'BASE';
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
		
		for (const position of bookEvent.stickyPositions) {
			const reelSymbol = stateGame.board[position.reel]?.reelState?.symbols?.[position.row];
			
			if (!reelSymbol) {
				continue;
			}
			
			if (reelSymbol.rawSymbol.name === 'S') {
				// reelPosition represents expansion level (0-4) based on which visible row (1-5)
				reelSymbol.rawSymbol.reelPosition = position.row - 1;
				
				// Reset symbol state first to ensure animation re-triggers even if already in 'expand' state
				reelSymbol.symbolState = 'postWinStatic';
				
				// Small delay to ensure state change is registered
				await new Promise(resolve => setTimeout(resolve, 50));
				
				reelSymbol.symbolState = 'expand';
				
				// Wait for animation with timeout protection (5 seconds max)
				const animationPromise = waitForResolve((resolve: () => void) => (reelSymbol.oncomplete = resolve));
				const timeoutPromise = new Promise<void>(resolve => {
					setTimeout(() => resolve(), 5000);
				});
				await Promise.race([animationPromise, timeoutPromise]);
				
				reelSymbol.symbolState = 'static';
			}
		}
	},
	swordExpandEvent: async (bookEvent: BookEventOfType<'swordExpandEvent'>) => {
		const { reel, swordRow, expandedRows, multiplier } = bookEvent;
		
		const reelSymbol = stateGame.board[reel]?.reelState?.symbols?.[swordRow];
		
		// Safety check - ensure symbol exists
		if (!reelSymbol) {
			return;
		}
		
		// Import utility functions
		const { calculateSSymbolCollectedMultiplier } = await import('./utils');
		const currentBoard = stateGameDerived.boardRaw();
		
		// Calculate animation name based on expandedRows length
		const animationName = expandedRows.length === 0 
			? 'sword_expanding_pos0'
			: `sword_expanding_pos${expandedRows.length}`;
		
		// Store the custom animation name on the symbol
		reelSymbol.rawSymbol.expandAnimation = animationName;
		
		// Calculate collected multiplier from W symbols above (for display before backend value)
		const frontendCollectedMultiplier = calculateSSymbolCollectedMultiplier(
			currentBoard,
			reel,
			swordRow,
			reelSymbol.rawSymbol.multiplier || 1
		);
		
		// Show collected multipliers from W symbols above S (visual collection animation)
		// Mark W symbols above S as collected to hide their multipliers
		stateGame.board[reel].reelState.symbols.forEach((symbol, rowIndex) => {
			if (rowIndex < swordRow && symbol.rawSymbol.name === 'W' && symbol.rawSymbol.multiplier) {
				symbol.rawSymbol.isCollected = true;
			}
		});
		
		// Set the frontend calculated multiplier temporarily
		reelSymbol.rawSymbol.collectedMultiplier = frontendCollectedMultiplier;
		// reelPosition represents expansion level (0-4) based on which visible row (1-5)
		reelSymbol.rawSymbol.reelPosition = swordRow - 1;
		
		// Wait a moment for multiplier collection animation
		await new Promise(resolve => setTimeout(resolve, 300));
		
		// Update to backend multiplier value (the authoritative value)
		reelSymbol.rawSymbol.collectedMultiplier = multiplier;
		
		// Set symbol to expand state to trigger animation
		reelSymbol.symbolState = 'expand';
		
		// Wait for expansion animation to complete with timeout protection
		// Use a race between animation complete and timeout to prevent infinite hangs
		const animationPromise = eventEmitter.broadcastAsync({
			type: 'boardWithAnimateSymbols',
			symbolPositions: [{ reel, row: swordRow }]
		});
		const timeoutPromise = new Promise(resolve => {
			setTimeout(() => resolve(undefined), 5000);
		});
		
		await Promise.race([animationPromise, timeoutPromise]);
	},
};
