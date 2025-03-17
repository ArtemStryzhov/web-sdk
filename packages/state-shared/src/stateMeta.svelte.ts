import { DEFAULT_BET_MODE_META, DEFAULT_GAME_RULE_META } from './constants';

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

type BetModeMeta = Record<string, BetModeData>;

export const stateMeta = $state({
	betModeMeta: DEFAULT_BET_MODE_META as BetModeMeta,
	gameRuleMeta: DEFAULT_GAME_RULE_META,
});
