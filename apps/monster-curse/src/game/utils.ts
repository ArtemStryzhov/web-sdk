import _ from 'lodash';
import { stateBet } from 'state-shared';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import { SYMBOL_SIZE, REEL_PADDING, SYMBOL_INFO_MAP, BOARD_DIMENSIONS } from './constants';
import { eventEmitter } from './eventEmitter';
import type { Bet, BookEventOfType } from './typesBookEvent';
import { bookEventHandlerMap } from './bookEventHandlerMap';
import type { RawSymbol, SymbolState, Position } from './types';

// general utils
export const { getEmptyBoard } = createGetEmptyPaddedBoard({ reelsDimensions: BOARD_DIMENSIONS });
export const { playBookEvent, playBookEvents } = createPlayBookUtils({ bookEventHandlerMap });
export const playBet = async (bet: Bet) => {
	stateBet.winBookEventAmount = 0;
	
	// Debug logging for event 
		console.log(`   bet.state`, bet.state);
 
	await playBookEvents(bet.state);
	eventEmitter.broadcast({ type: 'stopButtonEnable' });
};

// resume bet
const BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT = [
	'updateGlobalMult',
	'freeSpinTrigger',
	'updateFreeSpin',
	'setTotalWin',
];

export const convertTorResumableBet = (lastBetData: Bet) => {
	const resumingIndex = Number(lastBetData.event);
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
 * Collects all W symbol multipliers in the same reel and multiplies by S symbol's own multiplier.
 * Formula: (sum of W multipliers in reel) × S multiplier
 */
export const calculateSSymbolCollectedMultiplier = (
	board: RawSymbol[][],
	sSymbolReelIndex: number,
	sSymbolMultiplier: number = 1
): number => {
	const reelSymbols = board[sSymbolReelIndex];
	if (!reelSymbols) return sSymbolMultiplier;

	// Find all W symbols in the same reel and sum their multipliers
	const wMultipliersSum = reelSymbols
		.filter(symbol => symbol.name === 'W' && symbol.multiplier)
		.reduce((sum, wSymbol) => sum + (wSymbol.multiplier || 0), 0);

	// If no W multipliers found, return the S symbol's own multiplier
	if (wMultipliersSum === 0) return sSymbolMultiplier;

	// Calculate: (sum of W multipliers) × S multiplier
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
			expansionPositions.push({
				reel: sPosition.reel,
				row: row
			});
		}
	});
	
	return expansionPositions;
};
