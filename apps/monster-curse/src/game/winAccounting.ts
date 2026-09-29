/**
 * What the WIN field holds, as a function of the book alone.
 *
 * A round's win is never computed on the client: the book states it, and the
 * client only decides which book event it believes. Two events carry a total:
 *
 * - `setTotalWin` — the round's running total, updated after every reveal.
 * - `finalWin`    — the round's settled payout, once, at the end of the book.
 *
 * They agree on almost every round, which is why reading only `setTotalWin` went
 * unnoticed. They do not agree on a win-capped round: the math stops the running
 * total where the reels left it and puts the capped amount in `finalWin` alone
 * (in the shipped Monster Curse math, 100 of 100 000 base books and 100 of
 * 100 000 `feature_contract` books do exactly this, some of them running `finalWin`
 * up to 20 000x from a `setTotalWin` of 0). `finalWin` is the amount the RGS
 * settles and the amount `payoutMultiplier` reports, so it wins every tie.
 *
 * `bookEventHandlerMap` applies this per event as the round plays; the payout
 * verification script (`scripts/verifyPayouts.ts`) folds a whole book through
 * the same function and checks the result against the lookup table, so the two
 * cannot drift apart.
 */

/** The shape this module needs from a book event; the real union is wider. */
export type WinAccountingBookEvent = { type: string; amount?: number };

/** The WIN field's book amount after `bookEvent` has been played. */
export const nextWinBookEventAmount = (
	currentAmount: number,
	bookEvent: WinAccountingBookEvent,
): number => {
	// `finalWin` is authoritative: on a win-capped round it is the only event
	// holding the amount that is actually paid.
	if (bookEvent.type === 'finalWin') return bookEvent.amount ?? currentAmount;
	// `setTotalWin` is the running total the field tracks while the round plays.
	if (bookEvent.type === 'setTotalWin') return bookEvent.amount ?? currentAmount;

	return currentAmount;
};

/** The WIN field's book amount once the whole book has played out. */
export const roundWinBookEventAmount = (bookEvents: WinAccountingBookEvent[]): number =>
	bookEvents.reduce(nextWinBookEventAmount, 0);
