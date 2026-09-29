import type { BetModeMeta } from 'state-shared';

import { BET_MODE_MAP } from './betModes';

const BASE = BET_MODE_MAP.BASE;
const CONTRACT = BET_MODE_MAP.feature_contract;
const BLADES = BET_MODE_MAP.feature_blades;

const EMPTY_ASSETS = {
	icon: '',
	dialogImage: '',
	dialogVolatility: '',
	volatility: '',
	button: '',
};

/**
 * Custom bet mode metadata for Monster Curse.
 *
 * Mode names, cost multipliers and max wins come from `betModes.ts`, the single
 * dictionary the game, the rules, the replay panel and `index.json` all read —
 * this file only adds the copy around them.
 */
export const customBetModeMeta: BetModeMeta = {
	[BASE.key]: {
		mode: BASE.key,
		costMultiplier: BASE.costMultiplier,
		type: 'default',
		parent: '',
		children: '',
		assets: EMPTY_ASSETS,
		text: {
			title: BASE.name,
			dialog: '',
			button: '',
			betAmountLabel: '',
			tickerIdle: '',
			tickerSpin: '',
			bannerText: '',
		},
		maxWin: BASE.maxWin,
	},
	[CONTRACT.key]: {
		mode: CONTRACT.key,
		costMultiplier: CONTRACT.costMultiplier,
		type: 'buy',
		parent: '',
		children: '',
		assets: EMPTY_ASSETS,
		text: {
			title: CONTRACT.name,
			description:
				'Unlock 10 free spins with boosted odds for Silver Sword and Elixir Flask symbols to emerge.',
			dialog: `Are you sure you want to buy ${CONTRACT.name} for ${CONTRACT.costMultiplier}x your bet? This will trigger 10 free spins with increased chances of landing bonus symbols.`,
			button: 'BUY',
			betAmountLabel: CONTRACT.name.toUpperCase(),
			tickerIdle: 'PLACE YOUR BET',
			tickerSpin: `${CONTRACT.name.toUpperCase()} ACTIVATED`,
			bannerText: '',
		},
		maxWin: CONTRACT.maxWin,
	},
	[BLADES.key]: {
		mode: BLADES.key,
		costMultiplier: BLADES.costMultiplier,
		type: 'buy',
		parent: '',
		children: '',
		assets: EMPTY_ASSETS,
		text: {
			title: BLADES.name,
			description:
				'Unlock 10 free spins with sticky Silver Sword symbols, expanding to the top of the reel on every spin.',
			dialog: `Are you sure you want to buy ${BLADES.name} for ${BLADES.costMultiplier}x your bet? This will trigger 10 free spins with sticky expanding Silver Sword symbols.`,
			button: 'BUY',
			betAmountLabel: BLADES.name.toUpperCase(),
			tickerIdle: 'PLACE YOUR BET',
			tickerSpin: `${BLADES.name.toUpperCase()} ACTIVATED`,
			bannerText: '',
		},
		maxWin: BLADES.maxWin,
	},
};

export const getBetModeMeta = (social: boolean): BetModeMeta => {
	if (!social) return customBetModeMeta;

	// Social (sweepstakes) wording: a bonus is played, never bought or bet on.
	// The mode names themselves are unchanged — they come from `betModes.ts`,
	// which carries the social name for every mode.
	return {
		...customBetModeMeta,
		[CONTRACT.key]: {
			...customBetModeMeta[CONTRACT.key],
			text: {
				...customBetModeMeta[CONTRACT.key].text,
				title: CONTRACT.socialName,
				button: 'PLAY',
				dialog: `Are you sure you want to play ${CONTRACT.socialName} for ${CONTRACT.costMultiplier}x your play amount? This will trigger 10 free spins with increased chances of landing bonus symbols.`,
				tickerIdle: 'PLACE YOUR PLAY',
			},
		},
		[BLADES.key]: {
			...customBetModeMeta[BLADES.key],
			text: {
				...customBetModeMeta[BLADES.key].text,
				title: BLADES.socialName,
				button: 'PLAY',
				dialog: `Are you sure you want to play ${BLADES.socialName} for ${BLADES.costMultiplier}x your play amount? This will trigger 10 free spins with sticky expanding Silver Sword symbols.`,
				tickerIdle: 'PLACE YOUR PLAY',
			},
		},
	};
};
