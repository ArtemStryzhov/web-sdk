/**
 * Shared vertical layout for the win presentation popups (big/mega/super/sensational and total win).
 *
 * All values are in board-container space, i.e. relative to `stateGameDerived.boardLayout()`.
 */

/** Y of the win amount text, which is anchored at its centre. */
export const WIN_AMOUNT_Y = 120;

/** Gap between the bottom edge of the win level image and the top of the win amount glyphs. */
const WIN_IMAGE_GAP = 16;

/**
 * Portion of the font size the amount glyphs occupy above the text's vertical centre.
 * Derived from the cap height of the Crom digits rather than the full line box, so the
 * image sits against the visible text instead of its bounding box.
 */
const AMOUNT_CAP_HEIGHT_RATIO = 0.42;

/**
 * Y for a win level image anchored at 0.5, so its bottom edge sits right above the win amount.
 */
export const getWinImageY = ({
	spriteHeight,
	amountFontSize,
}: {
	spriteHeight: number;
	amountFontSize: number;
}) => WIN_AMOUNT_Y - amountFontSize * AMOUNT_CAP_HEIGHT_RATIO - WIN_IMAGE_GAP - spriteHeight * 0.5;

/**
 * Render order inside the win popups. The coins fountain sits above the dimmed backdrop but
 * below the win level image and the amount, so it never covers the text.
 */
export const WIN_POPUP_Z = {
	background: 0,
	coins: 10,
	image: 20,
	amount: 30,
	pressToContinue: 40,
} as const;
