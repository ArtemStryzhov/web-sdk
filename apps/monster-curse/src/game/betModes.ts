import type { BetModeNameMap } from 'state-shared';

/**
 * The single dictionary of bet modes for Monster Curse.
 *
 * Every surface that names a mode reads it from here — the game UI, the game
 * rules modal, the replay panel and the platform manifest (`index.json`) — so a
 * round can never be called one thing on the reels and another in the rules.
 *
 * - `key` is the protocol key the RGS sends back on a round and the replay URL
 *   carries in `mode`. It must match the key in `config.betModes`.
 * - `name` is what the player reads.
 * - `socialName` is the social (sweepstakes) name, for a mode whose name would
 *   otherwise carry restricted wording. The feature names here are not
 *   restricted, so they are the same in both builds; the separate mapping exists
 *   so social wording never has to be patched into a display name at a call site.
 * - `costMultiplier` mirrors `cost` in `config.betModes`, which is what the RGS
 *   actually charges. The replay panel needs it because a replay has no
 *   `authenticate()` response to read it from.
 */
export type BetModeDefinition = {
	key: string;
	name: string;
	socialName: string;
	costMultiplier: number;
	type: 'default' | 'buy';
	maxWin: number;
};

export const BET_MODES: BetModeDefinition[] = [
	{
		key: 'BASE',
		name: 'BASE',
		socialName: 'BASE',
		costMultiplier: 1.0,
		type: 'default',
		maxWin: 5000,
	},
	{
		key: 'buy_contract',
		name: 'Monster Contract',
		socialName: 'Monster Contract',
		costMultiplier: 100.0,
		type: 'buy',
		maxWin: 5000,
	},
	{
		key: 'buy_blades',
		name: 'Blades of Fate',
		socialName: 'Blades of Fate',
		costMultiplier: 300.0,
		type: 'buy',
		maxWin: 5000,
	},
];

export const BET_MODE_MAP = Object.fromEntries(
	BET_MODES.map((betMode) => [betMode.key, betMode]),
) as Record<string, BetModeDefinition>;

/**
 * The name map handed to `stateMeta`, which is how shared components (the replay
 * panel, the rules modal) reach this dictionary without importing game code.
 */
export const betModeNameMap: BetModeNameMap = Object.fromEntries(
	BET_MODES.map((betMode) => [betMode.key, { name: betMode.name, socialName: betMode.socialName }]),
);

/**
 * The mode list in the shape the platform manifest (`index.json`) wants. The
 * manifest is uploaded with the build rather than checked in, so this is what it
 * must be generated from — never a hand-written second list of names.
 */
export const toIndexJsonBetModes = () =>
	BET_MODES.map((betMode) => ({
		mode: betMode.key,
		name: betMode.name,
		costMultiplier: betMode.costMultiplier,
		feature: betMode.type === 'buy',
	}));
