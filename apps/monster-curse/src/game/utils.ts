import _ from 'lodash';
import { stateBet } from 'state-shared';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import { SYMBOL_SIZE, REEL_PADDING, SYMBOL_INFO_MAP, BOARD_DIMENSIONS } from './constants';
import { eventEmitter } from './eventEmitter';
import type { Bet, BookEventOfType } from './typesBookEvent';
import { bookEventHandlerMap } from './bookEventHandlerMap';
import type { RawSymbol, SymbolState, Position } from './types';
import { stateGame } from './stateGame.svelte.js';

// general utils
export const { getEmptyBoard } = createGetEmptyPaddedBoard({ reelsDimensions: BOARD_DIMENSIONS });
export const { playBookEvent, playBookEvents } = createPlayBookUtils({ bookEventHandlerMap });
export const playBet = async (bet: Bet) => {
	stateBet.winBookEventAmount = 0;
	
	// Stop any ongoing win animation looping
	stateGame.shouldLoopWinAnimations = false;
	
	await playBookEvents(bet.state);
	eventEmitter.broadcast({ type: 'stopButtonEnable' });
	
	// Debug: Log all symbol states after spin completes
	console.log('📊 Board state after spin:');
	stateGame.board.forEach((reel, reelIndex) => {
		reel.reelState.symbols.forEach((symbol, rowIndex) => {
			console.log(`  (${reelIndex},${rowIndex}): ${symbol.rawSymbol.name} - state: ${symbol.symbolState}`);
		});
	});
	
	// Start win animation looping if there are wins
	if (stateGame.winAnimationData) {
		stateGame.shouldLoopWinAnimations = true;
		loopWinAnimations();
	}
};

// Loop win animations until user presses spin
const loopWinAnimations = async () => {
	console.log('🔄 Starting win animation loop');
	let loopCount = 0;
	
	while (stateGame.shouldLoopWinAnimations && stateGame.winAnimationData) {
		loopCount++;
		console.log(`🔄 Loop iteration ${loopCount}`);
		const { wins, sSymbols } = stateGame.winAnimationData;
		
		// Clear isCollected flags and collectedMultiplier before each loop iteration
		stateGame.board.forEach(reel => {
			reel.reelState.symbols.forEach(symbol => {
				if (symbol.rawSymbol.isCollected) {
					symbol.rawSymbol.isCollected = false;
				}
				if (symbol.rawSymbol.collectedMultiplier) {
					symbol.rawSymbol.collectedMultiplier = undefined;
				}
			});
		});
		
		// Animate regular win positions (each line sequentially)
		for (const win of wins) {
			if (!stateGame.shouldLoopWinAnimations) break;
			
			// Reset symbols to 'land' before animating to 'win' for proper re-triggering
			console.log(`  Resetting symbols to 'land' for win line:`, win.positions.map(p => `(${p.reel},${p.row})`).join(', '));
			for (const pos of win.positions) {
				const reelSymbol = stateGame.board[pos.reel].reelState.symbols[pos.row];
				console.log(`    Symbol at (${pos.reel},${pos.row}): ${reelSymbol.rawSymbol.name}, currentState: ${reelSymbol.symbolState} → land`);
				if (reelSymbol.rawSymbol.name !== 'S') {
					reelSymbol.symbolState = 'land';
				}
			}
			
			// Small delay for state reset
			await new Promise(resolve => setTimeout(resolve, 50));
			
			// Animate to win state
			await eventEmitter.broadcastAsync({
				type: 'boardWithAnimateSymbols',
				symbolPositions: win.positions,
			});
		}
		
		// If S symbols are in wins, animate their upward expansion
		if (stateGame.shouldLoopWinAnimations && sSymbols.length > 0) {
			const expansionPositions = generateSSymbolExpansionPositions(sSymbols);
			
			// Reset S symbols to 'land' state
			sSymbols.forEach((position: any) => {
				const reelSymbol = stateGame.board[position.reel].reelState.symbols[position.row];
				reelSymbol.symbolState = 'land';
			});
			
			await new Promise(resolve => setTimeout(resolve, 50));
			
			// Set the original S symbols to expand state
			sSymbols.forEach((position: any) => {
				const reelSymbol = stateGame.board[position.reel].reelState.symbols[position.row];
				reelSymbol.symbolState = 'expand';
			});
			
			// Then animate the expansion positions
			if (expansionPositions.length > 0) {
				await eventEmitter.broadcastAsync({
					type: 'boardWithAnimateSymbols',
					symbolPositions: expansionPositions,
				});
			}
		}
		
		// Small delay before next loop
		if (stateGame.shouldLoopWinAnimations) {
			await new Promise(resolve => setTimeout(resolve, 500));
		}
	}
};

// resume bet
const BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT = [
	'updateGlobalMult',
	'freeSpinTrigger',
	'updateFreeSpin',
	'setTotalWin',
];

export const convertTorResumableBet = (lastBetData: Bet) => {
	const resumingIndex = Number((lastBetData as any).event);
	const bookEventsBeforeResume = lastBetData.state.filter(
		(_, eventIndex) => eventIndex < resumingIndex,
	);
	const bookEventsAfterResume = lastBetData.state.filter(
		(_, eventIndex) => eventIndex >= resumingIndex,
	);

	const bookEventToCreateSnapshot: BookEventOfType<'createBonusSnapshot'> = {
		index: 0,
		type: 'createBonusSnapshot',
		bookEvents: bookEventsBeforeResume.filter((bookEvent) =>
			BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT.includes(bookEvent.type),
		),
	};

	const stateToResume = [bookEventToCreateSnapshot, ...bookEventsAfterResume];

	return { ...lastBetData, state: stateToResume };
};

// other utils
export const getSymbolX = (reelIndex: number) => SYMBOL_SIZE * (reelIndex + REEL_PADDING);
export const getSymbolY = (symbolIndexOfBoard: number) => (symbolIndexOfBoard + 0.5) * SYMBOL_SIZE;

export const getSymbolInfo = ({
	rawSymbol,
	state,
}: {
	rawSymbol: RawSymbol;
	state: SymbolState;
}) => {
	const symbolStateInfo = SYMBOL_INFO_MAP[rawSymbol.name] as any;
	if (!symbolStateInfo) return undefined;

	const symbolInfo = symbolStateInfo[state];

	// Handle function-based symbol info (e.g., S symbol with position-based animations)
	if (typeof symbolInfo === 'function') {
		return symbolInfo(rawSymbol);
	}


	return symbolInfo;
};

/**
 * Calculate the collected multiplier for an S symbol during expansion.
 * Collects only W symbol multipliers ABOVE the S symbol in the same reel and multiplies by S symbol's own multiplier.
 * Formula: (sum of W multipliers above S) × S multiplier
 */
export const calculateSSymbolCollectedMultiplier = (
	board: RawSymbol[][],
	sSymbolReelIndex: number,
	sSymbolRowIndex: number,
	sSymbolMultiplier: number = 1
): number => {
	const reelSymbols = board[sSymbolReelIndex];
	if (!reelSymbols) return sSymbolMultiplier;

	// Calculate the starting index for visible symbols (middle 5 symbols)
	const startIndex = Math.floor((reelSymbols.length - 5) / 2);
	const sSymbolAbsoluteIndex = startIndex + sSymbolRowIndex;

	// Find all W symbols ABOVE the S symbol in the same reel and sum their multipliers
	const wMultipliersSum = reelSymbols
		.map((symbol, index) => ({ symbol, index }))
		.filter(({ symbol, index }) => 
			index >= startIndex && // Within visible area
			index < sSymbolAbsoluteIndex && // Above S symbol
			symbol.name === 'W' && 
			symbol.multiplier
		)
		.reduce((sum, { symbol }) => sum + (symbol.multiplier || 0), 0);

	// If no W multipliers found, return the S symbol's own multiplier
	if (wMultipliersSum === 0) return sSymbolMultiplier;

	// Calculate: (sum of W multipliers above) × S multiplier
	return wMultipliersSum * sSymbolMultiplier;
};

/**
 * Check if S symbols participate in any winning combinations.
 * S symbols should expand upwards when they are part of a win.
 */
export const checkSSymbolsInWins = (
	wins: Array<{ positions: Position[]; symbol: string }>,
	board: RawSymbol[][]
): Position[] => {
	const sSymbolsInWins: Position[] = [];
	
	wins.forEach(win => {
		win.positions.forEach(position => {
			const startIndex = Math.floor((board[position.reel].length - 5) / 2);
			const symbolAtPosition = board[position.reel][startIndex + position.row];
			
			// Check if this position has an S symbol
			if (symbolAtPosition && symbolAtPosition.name === 'S') {
				// Add this S symbol position if not already added
				const alreadyAdded = sSymbolsInWins.some(
					existing => existing.reel === position.reel && existing.row === position.row
				);
				if (!alreadyAdded) {
					sSymbolsInWins.push(position);
				}
			}
		});
	});
	
	return sSymbolsInWins;
};

/**
 * Calculate combined multipliers for winning combinations.
 * If a win includes multiple S or W symbols with multipliers, add them together.
 */
export const calculateCombinedMultipliers = (
	winPositions: Position[],
	board: RawSymbol[][]
): number => {
	let totalMultiplier = 0;
	let hasMultiplierSymbols = false;
	
	winPositions.forEach(position => {
		const startIndex = Math.floor((board[position.reel].length - 5) / 2);
		const symbol = board[position.reel][startIndex + position.row];
		
		if (symbol && (symbol.name === 'S' || symbol.name === 'W') && symbol.multiplier) {
			totalMultiplier += symbol.multiplier;
			hasMultiplierSymbols = true;
		}
		
		// For S symbols, also add their collected multiplier
		if (symbol && symbol.name === 'S' && symbol.collectedMultiplier) {
			totalMultiplier += symbol.collectedMultiplier;
			hasMultiplierSymbols = true;
		}
	});
	
	// Return 1 if no multiplier symbols found (no effect on win)
	return hasMultiplierSymbols ? totalMultiplier : 1;
};

/**
 * Generate upward expansion positions for S symbols.
 * S symbols expand upwards to the top of the grid when participating in wins.
 */
export const generateSSymbolExpansionPositions = (
	sSymbolPositions: Position[]
): Position[] => {
	const expansionPositions: Position[] = [];
	
	sSymbolPositions.forEach(sPosition => {
		// Add positions from the S symbol's row up to the top (row 0)
		for (let row = sPosition.row - 1; row >= 0; row--) {
			// Check if this position is already an S symbol position (skip it)
			const isSSybolPosition = sSymbolPositions.some(
				sPos => sPos.reel === sPosition.reel && sPos.row === row
			);
			
			// Check if this position is already in the array (to avoid duplicates when multiple S symbols in same reel)
			const alreadyAdded = expansionPositions.some(
				existing => existing.reel === sPosition.reel && existing.row === row
			);
			
			// Only add if it's not an S symbol position and not already added
			if (!isSSybolPosition && !alreadyAdded) {
				expansionPositions.push({
					reel: sPosition.reel,
					row: row
				});
			}
		}
	});
	
	return expansionPositions;
};
