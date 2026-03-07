import { type SpinningReelSymbolState } from 'utils-slots';
import type config from './config';

export type SymbolName = keyof typeof config.symbols;
export type RawSymbol = {
	name: SymbolName;
	multiplier?: number;
	scatter?: boolean;
	wild?: boolean;
	collectedMultiplier?: number; // For S symbols that collect W multipliers
	multiplierOffsetY?: number; // Temporary Y offset for multiplier collection fall animation
	reelPosition?: number; // Position on reel (0-4) for S symbols to determine expansion height
	isCollected?: boolean; // For W symbols that have been collected by S symbols
	expandAnimation?: string; // Custom animation name for S symbol expansion (e.g., 'sword_expanding_pos2')
};
export type BetMode = keyof typeof config.betModes;
export type GameType = keyof typeof config.paddingReels;

export const SYMBOL_STATES = [
	'static',
	'spin',
	'land',
	'win',
	'postWinStatic',
	'expand',
] as const;

export type SymbolState = SpinningReelSymbolState | (typeof SYMBOL_STATES)[number];

export type Position = {
	reel: number;
	row: number;
};
