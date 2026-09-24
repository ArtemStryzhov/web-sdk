import { DEFAULT_BET_MODE_META, DEFAULT_GAME_RULE_META } from './constants';
import { stateUrlDerived } from './stateUrl.svelte';

export type BetModeData = {
	maxWin?: number;
	mode: string;
	costMultiplier: number;
	type: 'default' | 'activate' | 'buy';
	parent: string;
	children: string;
	assets: {
		icon: string;
		volatility: string;
		button: string;
		dialogImage: string;
		dialogVolatility: string;
	};
	text: {
		bannerText?: string;
		description?: string;
		betAmountLabel?: string;
		title: string;
		dialog: string;
		button: string;
		tickerIdle: string;
		tickerSpin: string;
	};
};

export type BetModeMeta = Record<string, BetModeData>;

/**
 * The player-facing name of a bet mode. One entry per mode, and the single place
 * a mode is named: the game UI, the game rules, the replay panel and the
 * platform manifest (index.json) all read the name from here rather than
 * repeating a literal, so a round can never be called "BONUS" in one surface and
 * "Blades of Fate" in another.
 */
export type BetModeNameData = {
	name: string;
	/** Social (sweepstakes) name, when compliant wording differs from the name above. */
	socialName?: string;
};

export type BetModeNameMap = Record<string, BetModeNameData>;

export type GameRuleContainer = {
	title: string;
	text: string;
	textImages?: { [key: string]: string };
	image: string;
	row: number;
	column: number;
	imagePosition: 'top' | 'left';
};

export type GameRuleData = {
	containers: GameRuleContainer[];
	rows: number;
	columns: number;
	title: string;
};

type GameRuleMeta = {
	gameRules: GameRuleData[];
	payTable: GameRuleData[];
	splashScreen: GameRuleData[];
};

export const stateMeta = $state({
	betModeMeta: DEFAULT_BET_MODE_META as BetModeMeta,
	betModeNameMap: {} as BetModeNameMap,
	gameRuleMeta: DEFAULT_GAME_RULE_META as GameRuleMeta,
});

/**
 * Mode keys travel between the game, the math config and the RGS in whatever
 * case each of them settled on ('BASE', 'base', 'buy_blades'), so every lookup
 * by mode key goes through this instead of indexing a map directly.
 */
const findByBetModeKey = <TValue>(map: Record<string, TValue>, betModeKey: string) => {
	if (!betModeKey) return null;
	return map[betModeKey] ?? map[betModeKey.toUpperCase()] ?? map[betModeKey.toLowerCase()] ?? null;
};

const betModeData = (betModeKey: string) => findByBetModeKey(stateMeta.betModeMeta, betModeKey);

/**
 * The name to print for a bet mode. A game registers its dictionary in
 * `betModeNameMap`; `fallbackName` covers a caller that names a mode the current
 * game does not have, and the mode's own title and raw key cover an unrecognised
 * mode arriving from the RGS.
 */
const betModeName = (betModeKey: string, fallbackName?: string) => {
	const nameData = findByBetModeKey(stateMeta.betModeNameMap, betModeKey);
	if (nameData) return (stateUrlDerived.social() && nameData.socialName) || nameData.name;

	return fallbackName || betModeData(betModeKey)?.text.title || betModeKey.toUpperCase();
};

export const stateMetaDerived = {
	betModeMetaList: () => Object.values(stateMeta.betModeMeta),
	betModeData,
	betModeName,
};
