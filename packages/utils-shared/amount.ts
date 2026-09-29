import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { stateBet } from 'state-shared';

// Social (sweepstakes) balances arrive under codes Intl cannot localise — it would
// either echo the raw code or throw on a non-ISO one. Every ticker listed here is
// rendered verbatim in front of the amount instead, e.g. "SC 1.00".
// This map is the single source of truth for what the player sees: nothing outside
// `currencyTicker` / `currencyPrefix` may hardcode a currency symbol.
const NO_LOCALISATION_CURRENCY_MAP: Record<string, string> = {
	XEC: 'SC',
	XSC: 'SC',
	XGC: 'GC',
	SC: 'SC',
	GC: 'GC',
};

// bookEventAmount: is the amount or win numbers in the events of books, e.g. the amount in setTotalWin bookEvent
// {
// 	"index": 3,
// 	"type": "setTotalWin",
// 	"amount": 100
// },
// if betting on $1,   100 bookEventAmount equals to $1.    betAmountMultiplier is (100 / BOOK_AMOUNT_MULTIPLIER =) 1
// if betting on $1,    50 bookEventAmount equals to $0.5.  betAmountMultiplier is ( 50 / BOOK_AMOUNT_MULTIPLIER =) 0.5
// if betting on $0.5, 100 bookEventAmount equals to $0.5.  betAmountMultiplier is (100 / BOOK_AMOUNT_MULTIPLIER =) 1
// if betting on $0.5,  50 bookEventAmount equals to $0.25. betAmountMultiplier is ( 50 / BOOK_AMOUNT_MULTIPLIER =) 0.5

export const bookEventAmountToBetAmountMultiplier = (bookEventAmount: number) =>
	bookEventAmount / BOOK_AMOUNT_MULTIPLIER;

export const bookEventAmountToNormalisedAmount = (bookEventAmount: number) => {
	const betAmountMultiplier = bookEventAmountToBetAmountMultiplier(bookEventAmount);
	return stateBet.wageredBetAmount * betAmountMultiplier;
};

export const numberToFloat = (value: number) => Number.parseFloat(`${value}`);

// Two decimals is the house style, but a win must never read as nothing: at low
// bet levels a real payout lands below a cent (bet 0.01 at 0.2x pays 0.002) and
// two decimals would show it as 0.00. Sub-cent amounts therefore stretch to at
// most four decimals, and only as far as they actually need — trailing zeros are
// dropped, so 0.002 never renders as "0.0020" and 1.5 stays "1.50".
const MIN_FRACTION_DIGITS = 2;
const MAX_FRACTION_DIGITS = 4;

/**
 * How many decimals an amount should be rendered with. The single source of
 * truth for amount precision: every place that shows a sum — win field, count-up
 * tickers, total win, big win, replay and history — goes through this, directly
 * or through one of the formatters below.
 */
export const amountFractionDigits = (value: number) => {
	const amount = Math.abs(value);
	if (amount === 0 || amount >= 0.01) return MIN_FRACTION_DIGITS;

	// the shortest precision that still shows something: "0.0020" -> "0.002" -> 3
	const trimmed = amount.toFixed(MAX_FRACTION_DIGITS).replace(/0+$/, '');
	const digits = trimmed.length - trimmed.indexOf('.') - 1;

	// an amount below the fourth decimal rounds away entirely and there is
	// nothing left to show, so fall back to the usual two decimals
	return Math.max(MIN_FRACTION_DIGITS, digits);
};

/**
 * The digits of an amount with no currency attached, at the precision the amount
 * needs. Use it together with `currencyPrefix` wherever the amount is rendered
 * piecewise instead of through `numberToCurrencyString`.
 */
export const numberToAmountString = (value: number) =>
	numberToFloat(value).toFixed(amountFractionDigits(value));

/**
 * The player-facing ticker for a currency that must not be localised
 * ("SC", "GC"), or null when Intl should format the currency itself.
 */
export const currencyTicker = (currency: string = stateBet.currency): string | null =>
	Object.hasOwn(NO_LOCALISATION_CURRENCY_MAP, currency)
		? NO_LOCALISATION_CURRENCY_MAP[currency]
		: null;

/**
 * The locale every amount is written in, whatever language the player picked.
 * A currency must read the same in all languages — the symbol, where it sits and
 * the digits around it — so the game language is deliberately not consulted:
 * with it, one USD amount comes out as "$1,234.50", "1234,50 US$", "1 234,50 $US"
 * or even "1,234.50 US$" with Arabic-Indic digits, depending on the language.
 */
const AMOUNT_LOCALE = 'en-US';

/**
 * The currency part of a formatted amount, ready to sit in front of the digits.
 * Use it wherever the amount is rendered piecewise instead of through
 * `numberToCurrencyString` — never a literal symbol.
 */
export const currencyPrefix = (currency: string = stateBet.currency) => {
	const ticker = currencyTicker(currency);
	if (ticker) return `${ticker} `;

	try {
		const symbol = new Intl.NumberFormat(AMOUNT_LOCALE, {
			style: 'currency',
			currency,
		})
			.formatToParts(0)
			.find((part) => part.type === 'currency')?.value;

		// a one-character symbol ("$", "€") hugs the amount, a word-like one ("CA$") does not
		if (symbol) return symbol.length > 1 ? `${symbol} ` : symbol;
	} catch {
		// an unknown code: fall through to rendering the code itself
	}

	return `${currency} `;
};

export const numberToCurrencyString = (value: number) => {
	const fractionDigits = amountFractionDigits(value);
	const ticker = currencyTicker();
	if (ticker) return `${ticker} ${numberToFloat(value).toFixed(fractionDigits)}`;

	// Symbol first, then the digits — always, in every language (see AMOUNT_LOCALE).
	const digits = new Intl.NumberFormat(AMOUNT_LOCALE, {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	}).format(Math.abs(value));

	return `${value < 0 ? '-' : ''}${currencyPrefix()}${digits}`;
};

export const bookEventAmountToCurrencyString = (bookEventAmount: number) => {
	const normalisedAmount = bookEventAmountToNormalisedAmount(bookEventAmount);
	return numberToCurrencyString(normalisedAmount);
};
