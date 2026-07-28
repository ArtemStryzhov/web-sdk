import _ from 'lodash';
import type { Messages } from '@lingui/core';

import type { Language } from 'state-shared';

export type SweepsLanguage = `sweeps_${Language}`;
export type MessagesMap = Partial<Record<Language | SweepsLanguage, Messages>>;

export const mergeMessagesMaps = (messagesMapList: MessagesMap[]) => {
	const merged = messagesMapList
		.filter(Boolean)
		.reduce((acc, current) => _.merge(acc, current), {} as MessagesMap);

	return merged;
};
