import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import type { Bet } from './typesBookEvent';
import { SECOND } from 'constants-shared/time';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { RawSymbol } from './types';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import config from './config';
import { SYMBOL_SIZE } from './constants';

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

const animateMultiplierFallUntilTouch = async ({
	symbol,
	fromRowIndex,
	toRowIndex,
	duration = Math.round((220 / 0.65) * 1.2 * 1.1),
}: {
	symbol: any;
	fromRowIndex: number;
	toRowIndex: number;
	duration?: number;
}) => {
	const distance = (toRowIndex - fromRowIndex) * SYMBOL_SIZE;
	if (distance <= 0) return;

	await new Promise<void>((resolve) => {
		const start = Date.now();
		const step = () => {
			const elapsed = Date.now() - start;
			const progress = Math.min(elapsed / duration, 1);
			const currentDistance = distance * progress;
			const remaining = distance - currentDistance;

			symbol.rawSymbol.multiplierOffsetY = currentDistance;

			// Consider as "touch" when symbols are within 5px.
			if (remaining <= 5 || progress >= 1) {
				symbol.rawSymbol.multiplierOffsetY = Math.max(0, distance - 5);
				resolve();
				return;
			}

			requestAnimationFrame(step);
		};

		requestAnimationFrame(step);
	});
};

const collectSwordMultipliersAnimated = async ({
	reel,
	swordRow,
	swordMultiplier,
}: {
	reel: number;
	swordRow: number;
	swordMultiplier: number;
}) => {
	const normalizedSwordRow = normalizeRowIndex(swordRow, reel);
	const reelSymbols = stateGame.board[reel]?.reelState?.symbols;
	if (!reelSymbols) return swordMultiplier;

	const startIndex = Math.floor((reelSymbols.length - 5) / 2);
	const wSymbolsAbove = _.range(startIndex, normalizedSwordRow)
		.map((rowIndex) => ({ rowIndex, symbol: reelSymbols[rowIndex] }))
		.filter(({ symbol }) => symbol?.rawSymbol?.name === 'W' && !!symbol.rawSymbol.multiplier)
		.map(({ rowIndex, symbol }) => ({
			rowIndex,
			symbol,
			value: symbol.rawSymbol.multiplier || 0,
		}));

	if (wSymbolsAbove.length === 0) {
		return swordMultiplier;
	}

	// Ensure all W multipliers are visible before collection starts.
	wSymbolsAbove.forEach(({ symbol }) => {
		symbol.rawSymbol.isCollected = false;
		symbol.rawSymbol.multiplierOffsetY = 0;
		symbol.rawSymbol.collectedMultiplier = undefined;
	});

	// Pause before first falling multiplier.
	await new Promise((resolve) => setTimeout(resolve, 1100));

	let carried = {
		...wSymbolsAbove[0],
		summedValue: wSymbolsAbove[0].value,
	};

	// #1: Topmost W falls to next W and sums. Repeat for all Ws above S.
	for (let i = 1; i < wSymbolsAbove.length; i++) {
		const next = wSymbolsAbove[i];

		await animateMultiplierFallUntilTouch({
			symbol: carried.symbol,
			fromRowIndex: carried.rowIndex,
			toRowIndex: next.rowIndex,
		});

		carried.symbol.rawSymbol.isCollected = true;
		carried.symbol.rawSymbol.multiplierOffsetY = 0;

		const newSummedValue = carried.summedValue + next.value;
		next.symbol.rawSymbol.collectedMultiplier = newSummedValue;

		carried = {
			...next,
			summedValue: newSummedValue,
		};
	}

	// #2: Last remaining W (or the already summed W) falls to S and multiplies with S value.
	await animateMultiplierFallUntilTouch({
		symbol: carried.symbol,
		fromRowIndex: carried.rowIndex,
		toRowIndex: normalizedSwordRow,
	});

	carried.symbol.rawSymbol.isCollected = true;
	carried.symbol.rawSymbol.multiplierOffsetY = 0;

	return carried.summedValue * swordMultiplier;
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		
		// Detect when bonus game ends (transition from bonus to non-bonus)
		const wasInBonusGame = stateGame.isInBonusGame;
		const bonusGameEnded = wasInBonusGame && !isBonusGame;
		
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
		
		// Handle S symbols that should expand even without wins (when W symbols are above them)
		// Import utility functions
		const { calculateSSymbolCollectedMultiplier, generateSSymbolExpansionPositions } = await import('./utils');
		const currentBoard = stateGameDerived.boardRaw();
		
		// Find all S symbols on the board
		const sSymbolPositions: Position[] = [];
		currentBoard.forEach((reel, reelIndex) => {
			const startIndex = Math.floor((reel.length - 5) / 2);
			const visibleSymbols = reel.slice(startIndex, startIndex + 5);
			
			visibleSymbols.forEach((symbol, visibleIndex) => {
				if (symbol.name === 'S') {
					// Convert visible index (0-4) to 1-based row (1-5)
					const row = visibleIndex + 1;
					sSymbolPositions.push({ reel: reelIndex, row });
				}
			});
		});
		
		// For each S symbol, check if it should expand (has W symbols above it)
		const sSymbolsToExpand: Position[] = [];
		for (const sPosition of sSymbolPositions) {
			// Get the S symbol from board state
			const normalizedRow = normalizeRowIndex(sPosition.row, sPosition.reel);
			const reelSymbol = stateGame.board[sPosition.reel]?.reelState?.symbols?.[normalizedRow];
			if (!reelSymbol || reelSymbol.rawSymbol.name !== 'S') continue;
			
			const sOwnMultiplier = reelSymbol.rawSymbol.multiplier || 1;
			
			// Calculate collected multiplier
			const collectedMultiplier = calculateSSymbolCollectedMultiplier(
				currentBoard,
				sPosition.reel,
				sPosition.row,
				sOwnMultiplier
			);
			
			// If collected multiplier > S's own multiplier, there are W symbols above
			if (collectedMultiplier > sOwnMultiplier) {
				sSymbolsToExpand.push(sPosition);

				// Run staged W->W->S collection animation before S expansion.
				const animatedCollectedMultiplier = await collectSwordMultipliersAnimated({
					reel: sPosition.reel,
					swordRow: sPosition.row,
					swordMultiplier: sOwnMultiplier,
				});

				// Set collected multiplier result and expansion state
				reelSymbol.rawSymbol.collectedMultiplier = animatedCollectedMultiplier;
				reelSymbol.rawSymbol.reelPosition = sPosition.row - 1;
				
				// Set to expand state
				reelSymbol.symbolState = 'expand';
			}
		}
		
		// Animate S symbol expansion if any should expand
		if (sSymbolsToExpand.length > 0) {
			const expansionPositions = generateSSymbolExpansionPositions(sSymbolsToExpand);
			if (expansionPositions.length > 0) {
				await animateSymbols({ positions: expansionPositions });
			}
		}
		
		// Add minimum delay to ensure each spin is visible (especially spins without wins)
		// This prevents spins from being "skipped" visually when they process too quickly
		if (isBonusGame) {
			await new Promise(resolve => setTimeout(resolve, 500));
		}
		
		// Update bonus game state
		stateGame.isInBonusGame = isBonusGame;
		
		// If bonus game just ended, broadcast event (StoneFXOverlay will handle timing with win screen)
		if (bonusGameEnded) {
			// Small delay to ensure any win screen has closed
			setTimeout(() => {
				eventEmitter.broadcast({ type: 'bonusGameEnd' });
			}, 200);
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
		
		// If S symbols are in wins, expand them FIRST and keep them expanded throughout all win animations
		if (sSymbolsInWins.length > 0) {
			const expansionPositions = generateSSymbolExpansionPositions(sSymbolsInWins);
			
			// Set S symbols to expand state and ensure they have the correct expandAnimation property
			sSymbolsInWins.forEach(position => {
				const reelSymbol = stateGame.board[position.reel].reelState.symbols[normalizeRowIndex(position.row, position.reel)];
				
				// If expandAnimation is not set (sticky S symbols without swordExpandEvent), calculate it
				if (!reelSymbol.rawSymbol.expandAnimation) {
					// Calculate how many rows this S symbol should expand (rows above it, up to row 1)
					const expandedRowsCount = position.row - 1;
					const animationName = expandedRowsCount === 0 
						? 'sword_expanding_pos0'
						: `sword_expanding_pos${expandedRowsCount}`;
					reelSymbol.rawSymbol.expandAnimation = animationName;
				}
				
				reelSymbol.symbolState = 'expand';
			});
			
			// Animate upward expansion if there are positions to expand
			if (expansionPositions.length > 0) {
				await animateSymbols({ positions: expansionPositions });
			}
		}
		
		// Animate each win line sequentially
	for (let i = 0; i < bookEvent.wins.length; i++) {
		const win = bookEvent.wins[i];
		logHighlight(stateGame.round, win, i + 1, bookEvent.wins.length);
		const winPositionsWithoutS = win.positions.filter((pos: Position) => {
			const reelSymbol = stateGame.board[pos.reel].reelState.symbols[normalizeRowIndex(pos.row, pos.reel)];
			return reelSymbol.rawSymbol.name !== 'S';
		});
		// Set only the current win's symbols to postWinStatic first to reset them before animation
		// BUT: Skip S symbols - they should stay expanded throughout all win animations
		win.positions.forEach((pos: Position) => {
			const reelSymbol = stateGame.board[pos.reel].reelState.symbols[normalizeRowIndex(pos.row, pos.reel)];
			if (reelSymbol.rawSymbol.name !== 'S') {
				reelSymbol.symbolState = 'postWinStatic';
			}
		});
		
		// Then animate current win line, excluding S symbols to avoid re-expansion.
		if (winPositionsWithoutS.length > 0) {
			await animateSymbols({ positions: winPositionsWithoutS });
		}
	}
		
		// After all win animations, check if bonus trigger animation should play
		if (stateGame.pendingBonusTriggerAnimation) {
			// Find all B symbol positions on the board (only visible symbols at indices 1-5)
			const bSymbolPositions: Position[] = [];
			stateGame.board.forEach((reel, reelIndex) => {
				reel.reelState.symbols.forEach((reelSymbol, arrayIndex) => {
					// Only collect visible symbols (indices 1-5 in a 7-symbol reel)
					if (arrayIndex >= 1 && arrayIndex <= 5 && reelSymbol.rawSymbol.name === 'B') {
						// Convert array index to 1-based row number for consistency with Position type
						// For 7-symbol reel: arrayIndex 1→row 1, arrayIndex 2→row 2, etc.
						const row = arrayIndex;
						bSymbolPositions.push({ reel: reelIndex, row });
					}
				});
			});
			
			// Set all B symbols to 'win' state (triggers B_animation win animation)
			bSymbolPositions.forEach(position => {
				const reelSymbol = stateGame.board[position.reel].reelState.symbols[normalizeRowIndex(position.row, position.reel)];
				reelSymbol.symbolState = 'win';
			});
			
			// Wait for animation to complete (B_animation win is ~1.3 seconds, wait 2 seconds to be safe)
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			// Return B symbols to static state
			bSymbolPositions.forEach(position => {
				const reelSymbol = stateGame.board[position.reel].reelState.symbols[normalizeRowIndex(position.row, position.reel)];
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
		// Don't fold drawer in bonus game - keep all UI elements visible
		// Unfold drawer if it was folded, and hide the drawer button (arrow)
		eventEmitter.broadcast({ type: 'drawerUnfold' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonHide' });
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

		// Track if the freegame that's ending was a bonus game
		// This is needed for B symbol triggered bonus games where there may be no setWin during the bonus game
		// Check both isInBonusGame state and lastBet to determine if it was a bonus game
		// (isInBonusGame might be false if bonus game already ended, so check lastBet as fallback)
		const isInBonusGame = stateGame.isInBonusGame;
		const lastBetIsBonusGame = stateBet.lastBet 
			? checkIsMultipleRevealEvents({ bookEvents: (stateBet.lastBet as Bet).state })
			: false;
		const wasBonusGame = isInBonusGame || lastBetIsBonusGame;
		
		if (wasBonusGame) {
			stateGame.wasBonusGameWhenFreegameEnded = true;
		}

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
		// Add 2 second delay before hiding total win display
		const { waitForTimeout } = await import('utils-shared/wait');
		await waitForTimeout(2 * SECOND);
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

		// For big wins (level >= 6), show version 2 mascot 2 seconds before win screen
		if (winLevelData.level >= 6) {
			// Broadcast winUpdate immediately (synchronously) to switch mascot to version 2
			// Use broadcast (not broadcastAsync) to avoid waiting for Win component which isn't shown yet
			// This only updates Game.svelte's winScreenShowing state for the mascot
			eventEmitter.broadcast({
				type: 'winUpdate',
				amount: bookEvent.amount,
				winLevelData,
			});
			
			// Wait 2 seconds before showing win screen
			const { waitForTimeout } = await import('utils-shared/wait');
			await waitForTimeout(2 * SECOND);
			
			// Now show the win screen and update Win component properly
			eventEmitter.broadcast({ type: 'winShow' });
			winLevelSoundsPlay({ winLevelData });
			// Call winUpdate again so Win component can set up and wait for completion
			await eventEmitter.broadcastAsync({
				type: 'winUpdate',
				amount: bookEvent.amount,
				winLevelData,
			});
		} else {
			// For non-big wins, keep current behavior
			eventEmitter.broadcast({ type: 'winShow' });
			winLevelSoundsPlay({ winLevelData });
			await eventEmitter.broadcastAsync({
				type: 'winUpdate',
				amount: bookEvent.amount,
				winLevelData,
			});
		}
		
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
		const { reel, swordMultiplier, wildSum } = bookEvent;
		
		// Find the specific S symbol that matches the swordMultiplier
		// Iterate through all symbols in the reel to find the matching S symbol
		const reelSymbols = stateGame.board[reel]?.reelState?.symbols;
		if (!reelSymbols) return;
		
		// Calculate collected multiplier: (sum of W multipliers above S) × S multiplier
		const collectedMultiplier = wildSum * swordMultiplier;
		
		// Find the S symbol with matching multiplier in the visible area
		const startIndex = Math.floor((reelSymbols.length - 5) / 2);
		for (let i = startIndex; i < startIndex + 5; i++) {
			const reelSymbol = reelSymbols[i];
			if (reelSymbol?.rawSymbol?.name === 'S' && 
				reelSymbol.rawSymbol.multiplier === swordMultiplier) {
				reelSymbol.rawSymbol.collectedMultiplier = collectedMultiplier;
				break; // Found the matching S symbol, no need to continue
			}
		}
	},
	stickySwordEvent: async (bookEvent: BookEventOfType<'stickySwordEvent'>) => {
		const { waitForResolve } = await import('utils-shared/wait');
		
		// Store sticky positions for next reveal (as per backend specification)
		stateGame.stickySwordPositions = bookEvent.stickyPositions;
		
		for (const position of bookEvent.stickyPositions) {
			// Normalize row index from backend (1-5) to array index
			const normalizedRow = normalizeRowIndex(position.row, position.reel);
			const reelSymbol = stateGame.board[position.reel]?.reelState?.symbols?.[normalizedRow];
			
			if (!reelSymbol) {
				continue;
			}
			
			// PRESERVE existing rawSymbol and update/add necessary fields
			// This prevents losing collectedMultiplier set by swordExpandEvent
			reelSymbol.rawSymbol = {
				...reelSymbol.rawSymbol, // Preserve existing fields like collectedMultiplier
				name: 'S',
				scatter: true,
				// reelPosition represents expansion level (0-4) based on which visible row (1-5)
				reelPosition: position.row - 1,
				multiplier: position.multiplier,
			} as any;

			// Only play expanding animation if the S symbol has expandAnimation set
			// (meaning it was just expanded via swordExpandEvent in this spin)
			// Otherwise, just keep it in 'expand' state without replaying animation
			if (reelSymbol.rawSymbol.expandAnimation) {
				// This S was just expanded in this spin - play the animation
				reelSymbol.symbolState = 'postWinStatic';
				await new Promise(resolve => setTimeout(resolve, 50));
				reelSymbol.symbolState = 'expand';

				// Wait for animation with timeout protection (5 seconds max)
				const animationPromise = waitForResolve((resolve: () => void) => (reelSymbol.oncomplete = resolve));
				const timeoutPromise = new Promise<void>(resolve => {
					setTimeout(() => resolve(), 5000);
				});
				await Promise.race([animationPromise, timeoutPromise]);
			}

			// Keep sticky S symbols in 'expand' state to maintain visual expansion
			// even when they don't participate in win combinations
			reelSymbol.symbolState = 'expand';
		}
	},
	swordExpandEvent: async (bookEvent: BookEventOfType<'swordExpandEvent'>) => {
		const { reel, swordRow, expandedRows, multiplier } = bookEvent;
		
		// swordRow is 1-based (1-5), normalize to array index
		const normalizedSwordRow = normalizeRowIndex(swordRow, reel);
		const reelSymbol = stateGame.board[reel]?.reelState?.symbols?.[normalizedSwordRow];
		
		// Safety check - ensure symbol exists
		if (!reelSymbol) {
			return;
		}
		
		// Calculate animation name based on expandedRows length
		const animationName = expandedRows.length === 0 
			? 'sword_expanding_pos0'
			: `sword_expanding_pos${expandedRows.length}`;
		
		// Store the custom animation name on the symbol
		reelSymbol.rawSymbol.expandAnimation = animationName;
		
		// Run staged collection animation:
		// 1) W-to-W sum merges (top-to-bottom), 2) final W-to-S multiplication.
		const animatedCollectedMultiplier = await collectSwordMultipliersAnimated({
			reel,
			swordRow,
			swordMultiplier: reelSymbol.rawSymbol.multiplier || 1,
		});

		// Show animated result immediately before backend authoritative value arrives.
		reelSymbol.rawSymbol.collectedMultiplier = animatedCollectedMultiplier;
		// reelPosition represents expansion level (0-4) based on which visible row (1-5)
		reelSymbol.rawSymbol.reelPosition = swordRow - 1;
		
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
