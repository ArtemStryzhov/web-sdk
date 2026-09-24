import { stateMetaDerived } from './stateMeta.svelte';

/**
 * The recorded round a replay plays back. Only the fields the replay panel reads
 * are named here; everything else is the game's own book, handed to the
 * book-event player untouched.
 *
 * `amount`, `payout`, `payoutMultiplier` and `mode` are the round as the RGS
 * recorded it — the panel prints them, it never re-derives them from what the
 * animation happens to show.
 */
export type ReplayRound = {
	amount?: number;
	payout?: number;
	payoutMultiplier?: number;
	mode?: string;
	state?: unknown[];
};

/**
 * `idle`    – not a replay session, or the round has not arrived yet
 * `ready`   – the round is loaded and the start panel is waiting for the player
 * `playing` – book events are being played back
 * `finished` – the round reached its final win and can be played again
 */
export type ReplayStatus = 'idle' | 'ready' | 'playing' | 'finished';

export const stateReplay = $state({
	status: 'idle' as ReplayStatus,
	/** The pristine round, kept so the same round can be played again from the start. */
	round: null as ReplayRound | null,
	/** Base wager of the round, in game currency (`round.amount`, converted from API units). */
	baseBetAmount: 0,
	/** Total win of the round, in game currency (`round.payout`), or null when the round omits it. */
	totalWinAmount: null as number | null,
	/** `round.payoutMultiplier`, i.e. payout / amount as the RGS recorded it. */
	payoutMultiplier: 0,
	/** `round.mode`, the protocol key — resolve the printable name through `summary()`. */
	betModeKey: '',
});

/**
 * Everything the start panel prints, sourced from the round book.
 *
 * The one value the book itself cannot carry is the mode's cost multiplier: a
 * replay never calls `authenticate()`, so it comes from the game's bet-mode
 * dictionary, which mirrors the same math config the RGS charges from. The total
 * cost and, when the round omits `payout`, the total win follow from those
 * recorded numbers — no other front-end arithmetic feeds this panel.
 */
const summary = () => {
	const betModeData = stateMetaDerived.betModeData(stateReplay.betModeKey);
	const costMultiplier = betModeData?.costMultiplier ?? 1;
	const { baseBetAmount, payoutMultiplier } = stateReplay;

	return {
		betModeKey: stateReplay.betModeKey,
		betModeName: stateMetaDerived.betModeName(stateReplay.betModeKey),
		baseBetAmount,
		costMultiplier,
		totalBetCost: baseBetAmount * costMultiplier,
		payoutMultiplier,
		totalWinAmount: stateReplay.totalWinAmount ?? baseBetAmount * payoutMultiplier,
	};
};

const isReady = () => stateReplay.status === 'ready';
const isPlaying = () => stateReplay.status === 'playing';
const isFinished = () => stateReplay.status === 'finished';

/** Called by the replay loader once the recorded round is in hand. */
const load = (options: {
	round: ReplayRound;
	baseBetAmount: number;
	totalWinAmount: number | null;
	payoutMultiplier: number;
	betModeKey: string;
}) => {
	stateReplay.round = options.round;
	stateReplay.baseBetAmount = options.baseBetAmount;
	stateReplay.totalWinAmount = options.totalWinAmount;
	stateReplay.payoutMultiplier = options.payoutMultiplier;
	stateReplay.betModeKey = options.betModeKey;
	stateReplay.status = 'ready';
};

/** Called when playback of the round starts, both the first time and on every replay. */
const start = () => {
	stateReplay.status = 'playing';
};

/** Called on the round's final win, which is what puts the replay button on screen. */
const finish = () => {
	if (stateReplay.status === 'playing') stateReplay.status = 'finished';
};

export const stateReplayDerived = {
	summary,
	isReady,
	isPlaying,
	isFinished,
	load,
	start,
	finish,
};
