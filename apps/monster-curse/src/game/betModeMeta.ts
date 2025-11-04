import type { BetModeMeta } from 'state-shared';

/**
 * Custom bet mode metadata for Monster Curse game
 * Defines two buy bonus options:
 * - buy_contract: Monster Contract ($100)
 * - buy_blades: Blades of Fate ($300)
 */
export const customBetModeMeta: BetModeMeta = {
	BASE: {
		mode: 'BASE',
		costMultiplier: 1.0,
		type: 'default',
		parent: '',
		children: '',
		assets: {
			icon: '',
			dialogImage: '',
			dialogVolatility: '',
			volatility: '',
			button: '',
		},
		text: {
			title: 'BASE GAME',
			dialog: '',
			button: '',
			betAmountLabel: '',
			tickerIdle: '',
			tickerSpin: '',
			bannerText: '',
		},
		maxWin: 5000,
	},
	buy_contract: {
		mode: 'buy_contract',
		costMultiplier: 100.0,
		type: 'buy',
		parent: '',
		children: '',
		assets: {
			icon: '',
			dialogImage: '',
			dialogVolatility: '',
			volatility: '',
			button: '',
		},
		text: {
			title: 'Monster Contract',
			description: 'Unlock 10 free spins with boosted odds for Silver Sword and Elixir Flask symbols to emerge.',
			dialog: 'Are you sure you want to buy Monster Contract for 100x your bet? This will trigger 10 free spins with increased chances of landing bonus symbols.',
			button: 'BUY',
			betAmountLabel: 'MONSTER CONTRACT',
			tickerIdle: 'PLACE YOUR BET',
			tickerSpin: 'MONSTER CONTRACT ACTIVATED',
			bannerText: '',
		},
		maxWin: 5000,
	},
	buy_blades: {
		mode: 'buy_blades',
		costMultiplier: 300.0,
		type: 'buy',
		parent: '',
		children: '',
		assets: {
			icon: '',
			dialogImage: '',
			dialogVolatility: '',
			volatility: '',
			button: '',
		},
		text: {
			title: 'Blades of Fate',
			description: 'Unlock 10 free spins with sticky Silver Sword symbols, expanding to the top of the reel on every spin.',
			dialog: 'Are you sure you want to buy Blades of Fate for 300x your bet? This will trigger 10 free spins with sticky expanding Silver Sword symbols.',
			button: 'BUY',
			betAmountLabel: 'BLADES OF FATE',
			tickerIdle: 'PLACE YOUR BET',
			tickerSpin: 'BLADES OF FATE ACTIVATED',
			bannerText: '',
		},
		maxWin: 5000,
	},
};

