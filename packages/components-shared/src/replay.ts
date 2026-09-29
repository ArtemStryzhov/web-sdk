/**
 * A replay URL asks the game to play one recorded round back, deterministically
 * and without touching the wallet:
 *
 *   ?replay=true&rgs_url=…&game=…&version=…&mode=…&event=…
 *     &lang=en&currency=USD&amount=1000000
 *
 * | parameter  | meaning                                                          |
 * | ---------- | ---------------------------------------------------------------- |
 * | `replay`   | `true` puts the whole app in replay mode                          |
 * | `rgs_url`  | host the round is fetched from                                    |
 * | `game`     | game id the round belongs to                                      |
 * | `version`  | math version the round was recorded against                       |
 * | `mode`     | bet mode key of the round, e.g. `BASE`, `feature_blades`              |
 * | `event`    | the recorded round (book) to load                                 |
 * | `lang`     | locale for the round request and for the UI (optional, 'en')      |
 * | `currency` | currency the amounts are printed in (optional)                    |
 * | `amount`   | base wager in API units, when the round itself omits it (optional)|
 *
 * `game`, `version`, `mode` and `event` address the round; the rest is
 * presentation. Nothing here places a bet: `/wallet/play` is never called in a
 * replay, so the same URL always plays the same round the same way.
 */

import { API_AMOUNT_MULTIPLIER, BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { requestReplay } from 'rgs-requests';
import {
	SOCIAL_CURRENCY,
	stateBet,
	stateReplay,
	stateReplayDerived,
	stateUrlDerived,
	type ReplayRound,
} from 'state-shared';

const apiAmountToNumber = (apiAmount: number | undefined) =>
	apiAmount === undefined || apiAmount === null ? null : apiAmount / API_AMOUNT_MULTIPLIER;

/**
 * The round's win as its own book states it, for a round record that comes back
 * without `payout` / `payoutMultiplier`. The last `finalWin` book event carries
 * the win in book units — 100 book units is one base wager — so this is still
 * the book's number, not a figure the panel made up.
 */
const bookFinalWinMultiplier = (round: ReplayRound) => {
	const bookEvents = (round.state ?? []) as { type?: string; amount?: number }[];
	const finalWin = [...bookEvents].reverse().find((bookEvent) => bookEvent.type === 'finalWin');
	if (finalWin?.amount === undefined) return null;

	return finalWin.amount / BOOK_AMOUNT_MULTIPLIER;
};

/**
 * Reads the replay parameters off the URL, fetches that one round and puts it in
 * front of the player. Throws whatever the RGS answered on failure — the caller
 * owns the error modal.
 */
export const loadReplayRound = async () => {
	// A replay never calls authenticate(), so the session values the UI needs —
	// wager, mode and currency — can only come from the URL.
	const urlBetAmount = apiAmountToNumber(stateUrlDerived.amount()) ?? 0;
	stateBet.betAmount = urlBetAmount;
	stateBet.wageredBetAmount = urlBetAmount;

	// an unknown key would make stateBetDerived.activeBetMode() null, so only
	// take the mode from the URL when it is actually there
	if (stateUrlDerived.mode()) stateBet.activeBetModeKey = stateUrlDerived.mode();

	// Without a currency a social replay would keep the USD default and print "$".
	if (stateUrlDerived.currency()) stateBet.currency = stateUrlDerived.currency();
	else if (stateUrlDerived.social()) stateBet.currency = SOCIAL_CURRENCY;

	const replayData = await requestReplay({
		rgsUrl: stateUrlDerived.rgsUrl(),
		game: stateUrlDerived.game(),
		mode: stateUrlDerived.mode(),
		version: stateUrlDerived.version(),
		event: stateUrlDerived.event(),
		language: stateUrlDerived.lang(),
	});

	// error
	if ((replayData as { error?: unknown })?.error) throw replayData;

	// The endpoint returns the recorded round itself, but a wrapped
	// { round } envelope (the shape /wallet/play uses) is accepted too.
	const round = ((replayData as { round?: unknown })?.round ?? replayData) as ReplayRound;

	if (!round?.state?.length) {
		throw {
			error: 'Empty state in replay response',
			message: JSON.stringify({ replayData }),
		};
	}

	const betModeKey = round.mode || stateBet.activeBetModeKey;
	// The round's own wager wins over the URL: the URL parameter is the fallback
	// for a round record that does not carry one. `amount` is the base wager the
	// RGS applies `payoutMultiplier` to (schema: PayoutMultiplier = Payout /
	// Amount), not the total a feature buy was charged — the panel's Total Bet
	// Cost puts the cost multiplier back on top of it.
	const baseBetAmount = apiAmountToNumber(round.amount) ?? urlBetAmount;
	const payoutMultiplier = round.payoutMultiplier ?? bookFinalWinMultiplier(round) ?? 0;

	stateBet.betAmount = baseBetAmount;
	stateBet.wageredBetAmount = baseBetAmount;
	stateBet.activeBetModeKey = betModeKey;

	stateReplayDerived.load({
		round,
		betModeKey,
		baseBetAmount,
		payoutMultiplier,
		totalWinAmount: apiAmountToNumber(round.payout) ?? baseBetAmount * payoutMultiplier,
	});
};

/**
 * The round as the book-event player wants it: `event: '0'` replays it from its
 * first book event, `active: true` sends it down the resume-bet path. A replay
 * has no session and no wallet, so that path is what plays it back — and because
 * the pristine round stays in state, the same bet can be rebuilt for every
 * repeat of the replay.
 *
 * The mode comes from the snapshot rather than `stateBet.activeBetModeKey`: book
 * events rewrite that key to 'BASE' when free spins start, so on a second
 * playback the live key no longer describes the round.
 */
export const getReplayBet = () => {
	if (!stateReplay.round) return null;

	return {
		...stateReplay.round,
		event: '0',
		active: true,
		mode: stateReplay.betModeKey,
	};
};
