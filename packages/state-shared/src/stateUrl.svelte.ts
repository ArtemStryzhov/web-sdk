import { locales } from 'config-lingui';
import { page } from '$app/state';

import { stateConfig } from './stateConfig.svelte';

export type Language = (typeof locales)[number];

/** Social (sweepstakes) builds ship English only. */
export const SOCIAL_LANGUAGE: Language = 'en';

export type Key =
	// keys for play
	| 'sessionID'
	| 'rgs_url'
	| 'lang'
	| 'currency'
	| 'device'
	| 'social'
	| 'demo'
	| 'force'
	// keys for replay
	| 'replay'
	| 'amount'
	| 'game'
	| 'mode'
	| 'version'
	| 'event'
;

const getUrlSearchParam = (key: Key) => page.url.searchParams.get(key);

// params for play
const social = () => getUrlSearchParam('social') === 'true';

// Two signals mark a social (sweepstakes) session: the `social=true` URL param, and
// the `socialCasino` jurisdiction flag from authenticate(). Either one locks the game
// to English — the `lang` param is ignored and no other locale is selectable, so any
// language switcher must read this before offering a choice.
const languageLocked = () => social() || stateConfig.jurisdiction.socialCasino;

const lang = (): Language => {
	if (languageLocked()) return SOCIAL_LANGUAGE;
	const value = getUrlSearchParam('lang');
	return value === 'br' ? 'pt' : (value as Language) || 'en';
};
const sessionID = () => getUrlSearchParam('sessionID') || '';
const rgsUrl = () => getUrlSearchParam('rgs_url') || '';
const force = () => getUrlSearchParam('force') === 'true';

// params for replay
const replay = () => getUrlSearchParam('replay') === 'true';
const amount = () => Number(getUrlSearchParam('amount')) || 0;
const currency = () => getUrlSearchParam('currency') || '';
const game = () => getUrlSearchParam('game') || '';
const version = () => getUrlSearchParam('version') || '';
const mode = () => getUrlSearchParam('mode') || '';
const event = () => getUrlSearchParam('event') || '';

export const stateUrlDerived = {
	// states for play
	lang,
	languageLocked,
	sessionID,
	rgsUrl,
	force,
	social,
	// states for replay
	replay,
	amount,
	currency,
	game,
	mode,
	version,
	event,
};
