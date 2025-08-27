import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { rgsFetcher } from 'rgs-fetcher';

export * from './types';

// Development mode detection
const isDevelopment = typeof window !== 'undefined' && (
	window.location.hostname === 'localhost' ||
	window.location.hostname === '127.0.0.1' ||
	window.location.hostname === '0.0.0.0' ||
	window.location.port === '3000' || // Common dev ports
	window.location.port === '5173' || // Vite dev port
	window.location.port === '4173'    // Vite preview port
);

// Mock data generators
const generateMockRound = () => ({
	mode: 'BASE',
	payoutMultiplier: Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 1 : 0,
	active: Math.random() > 0.8,
	state: [
		// Reveal symbols on the board
		{
			index: 0,
			type: 'reveal',
			symbols: [
				['H1', 'H2', 'L1', 'S', 'W'],
				['L2', 'H3', 'L2', 'L3', 'L4'],
				['H4', 'L5', 'H5', 'L1', 'L2'],
				['L3', 'H1', 'L4', 'L5', 'H3'],
				['H2', 'L1', 'H4', 'L3', 'L2']
			]
		},
		// Set win amount (if any)
		{
			index: 1,
			type: 'setTotalWin',
			amount: Math.random() > 0.7 ? Math.floor(Math.random() * 100) + 10 : 0
		},
		// Win information
		{
			index: 2,
			type: 'winInfo',
			wins: [
				{
					win: Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 10 : 0,
					symbolPositions: []
				}
			],
			totalWin: Math.random() > 0.7 ? Math.floor(Math.random() * 50) + 10 : 0,
			winLevel: Math.random() > 0.7 ? 'small' : 'none'
		}
	]
});

const generateMockBalance = () => ({
	amount: Math.floor(Math.random() * 10000) + 1000,
	currency: 'USD'
});

export const requestAuthenticate = async (options: {
	sessionID: string;
	rgsUrl: string;
	language: string;
}) => {
	// Use mock data in development mode
	if (isDevelopment) {
		console.log('[DEV MODE] Using mock data for requestAuthenticate');

		// Simulate network delay
		await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));

		const mockData = {
			balance: generateMockBalance(),
			session: {
				id: options.sessionID,
				valid: true,
				language: options.language
			},
			error: null
		};

		console.log('[DEV MODE] Mock authenticate response:', mockData);
		return mockData;
	}

	const data = await rgsFetcher.post({
		rgsUrl: options.rgsUrl,
		url: '/wallet/authenticate',
		variables: {
			sessionID: options.sessionID,
			language: options.language,
		},
	});

	return data;
};

export const requestEndRound = async (options: {
	sessionID: string;
	rgsUrl: string;
}) => {
	// Use mock data in development mode
	if (isDevelopment) {
		console.log('[DEV MODE] Using mock data for requestEndRound');

		// Simulate network delay
		await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));

		const mockData = {
			balance: generateMockBalance(),
			error: null
		};

		console.log('[DEV MODE] Mock end round response:', mockData);
		return mockData;
	}

	const data = await rgsFetcher.post({
		rgsUrl: options.rgsUrl,
		url: '/wallet/end-round',
		variables: {
			sessionID: options.sessionID,
		},
	});

	return data;
};

export const requestEndEvent = async (options: {
	sessionID: string;
	eventIndex: number;
	rgsUrl: string;
}) => {
	// Use mock data in development mode
	if (isDevelopment) {
		console.log('[DEV MODE] Using mock data for requestEndEvent');

		// Simulate network delay
		await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));

		const mockData = {
			event: {
				index: options.eventIndex,
				completed: true
			},
			error: null
		};

		console.log('[DEV MODE] Mock end event response:', mockData);
		return mockData;
	}

	const data = await rgsFetcher.post({
		rgsUrl: options.rgsUrl,
		url: '/bet/event',
		variables: {
			sessionID: options.sessionID,
			event: `${options.eventIndex}`,
		},
	});

	return data;
};

export const requestForceResult = async (options: {
	mode: string;
	search: {
		bookID?: number;
		kind?: number;
		symbol?: string;
		hasWild?: boolean;
		wildMult?: number;
		gameType?: string;
	};
	rgsUrl: string;
}) => {
	// Use mock data in development mode
	if (isDevelopment) {
		console.log('[DEV MODE] Using mock data for requestForceResult');

		// Simulate network delay
		await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 800));

		const mockData = {
			round: generateMockRound(),
			balance: generateMockBalance(),
			error: null
		};

		console.log('[DEV MODE] Mock force result response:', mockData);
		return mockData;
	}

	const data = await rgsFetcher.post({
		rgsUrl: options.rgsUrl,
		url: '/game/search',
		variables: {
			mode: options.mode,
			search: options.search,
		},
	});

	return data;
};

export const requestBet = async (options: {
	sessionID: string;
	currency: string;
	amount: number;
	mode: string;
	rgsUrl: string;
}) => {
	// Use mock data in development mode
	if (isDevelopment) {
		console.log('[DEV MODE] Using mock data for requestBet');

		// Simulate network delay
		await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

		const mockData = {
			round: generateMockRound(),
			balance: generateMockBalance(),
			error: null
		};

		console.log('[DEV MODE] Mock bet response:', mockData);
		return mockData;
	}

	const data = await rgsFetcher.post({
		rgsUrl: options.rgsUrl,
		url: '/wallet/play',
		variables: {
			mode: options.mode,
			currency: options.currency,
			sessionID: options.sessionID,
			amount: options.amount * API_AMOUNT_MULTIPLIER,
		},
	});

	return data;
};
