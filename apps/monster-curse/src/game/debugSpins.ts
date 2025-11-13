import { stateGame } from './stateGame.svelte';

const getParam = (name: string) => {
	try {
		return new URLSearchParams(window.location.search).get(name);
	} catch {
		return null;
	}
};

export const isDebugSpinsEnabled = (): boolean => {
	if (getParam('debugSpins') === '1') return true;
	try {
		return localStorage.getItem('DEBUG_SPINS') === '1';
	} catch {
		return false;
	}
};

export const logSpin = (round: number, payload: { wins: any[]; board?: any } | null) => {
	if (!isDebugSpinsEnabled()) return;
	const winsLen = payload?.wins?.length ?? 0;
	const gameType = stateGame.gameType;
	console.log(
		`[SPIN ${round}][${gameType}] result: wins=${winsLen}`
	);
};

export const logHighlight = (
	round: number,
	win: any,
	index: number,
	total: number
) => {
	if (!isDebugSpinsEnabled()) return;
	const sym = win?.symbol ?? win?.alias ?? '?';
	const positions = Array.isArray(win?.positions)
		? win.positions.map((p: any) => `(${p.reel},${p.row})`).join(',')
		: '?';
	const payout = win?.payout ?? win?.multiplier ?? '';
	// Optional: also print current board symbols at those positions to verify mapping (rows are 1-based)
	let boardSample = '';
	let normRows = '';
	// Normalize using board's visible window (middle 5 of 7)
	const normalize = (r: number, reel: number) => {
		if (r >= 1 && r <= 5) {
			const len = stateGame.board[reel]?.reelState?.symbols?.length ?? 7;
			const startIndex = Math.floor((len - 5) / 2);
			return startIndex + (r - 1);
		}
		return r;
	};
	try {
		if (Array.isArray(win?.positions)) {
			boardSample = win.positions
				.map((p: any) => {
					const rs = stateGame.board[p.reel]?.reelState.symbols[normalize(p.row, p.reel)];
					return rs?.rawSymbol?.name ?? '?';
				})
				.join(',');
			normRows = win.positions.map((p: any) => `(${p.reel},${normalize(p.row, p.reel)})`).join(',');
		}
	} catch {}
	console.log(
		`[SPIN ${round}] highlight ${index}/${total}: symbol=${sym} positions=[${positions}] norm=[${normRows}]${payout !== '' ? ` payout=${payout}` : ''}${boardSample ? ` board=[${boardSample}]` : ''}`
	);
};


