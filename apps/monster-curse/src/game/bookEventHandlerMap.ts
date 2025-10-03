import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { sequence } from 'utils-shared/sequence';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';
import config from './config';

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.sound?.bgm) {
		eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
	}
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
};

const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	if (stateBet.activeBetModeKey === 'SUPERSPIN' || stateGame.gameType === 'freegame') {
		// check if SUPERSPIN, when finishing a bet.
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: bookEvent,
			paddingBoard: config.paddingReels[bookEvent.gameType],
		});

		// Debug logging: Show visible symbols that landed on this spin (middle 5 per reel)
		const landedSymbols = bookEvent.board.map(reel => {
			// Skip padding symbols, show only the visible middle symbols
			const startIndex = Math.floor((reel.length - 5) / 2);
			return reel.slice(startIndex, startIndex + 5).map(symbol => symbol.name).join('');
		}).join(' ');
		console.log(`🎰 Spin: ${landedSymbols}`);

		// Enhanced debug logging for multipliers and special symbols
		console.log(`📊 Event ${bookEvent.index} - Detailed Symbol Analysis:`);
		bookEvent.board.forEach((reel, reelIndex) => {
			const startIndex = Math.floor((reel.length - 5) / 2);
			const visibleSymbols = reel.slice(startIndex, startIndex + 5);
			
			console.log(`  Reel ${reelIndex + 1}:`);
			visibleSymbols.forEach((symbol, rowIndex) => {
				let symbolInfo = `    Row ${rowIndex + 1}: ${symbol.name}`;
				
				// Add multiplier info
				if (symbol.multiplier) {
					symbolInfo += ` (×${symbol.multiplier})`;
				}
				
				// Add special properties
				const specialProps = [];
				if (symbol.wild) specialProps.push('WILD');
				if (symbol.scatter) specialProps.push('SCATTER');
				if (specialProps.length > 0) {
					symbolInfo += ` [${specialProps.join(', ')}]`;
				}
			
			});
			
			// Check for W symbols and their multipliers in this reel
			const wSymbols = visibleSymbols.filter(s => s.name === 'W' && s.multiplier);
			if (wSymbols.length > 0) {
				const wMultipliers = wSymbols.map(s => s.multiplier).join(' + ');
				const wSum = wSymbols.reduce((sum, s) => sum + (s.multiplier || 0), 0);
				console.log(`    🔥 W Multipliers: ${wMultipliers} = ${wSum}`);
			}
			
			// Check for S symbols and calculate collected multipliers
			const sSymbols = visibleSymbols.filter(s => s.name === 'S');
			if (sSymbols.length > 0 && wSymbols.length > 0) {
				sSymbols.forEach(sSymbol => {
					const wSum = wSymbols.reduce((sum, s) => sum + (s.multiplier || 0), 0);
					const sMultiplier = sSymbol.multiplier || 1;
					const collectedMultiplier = wSum * sMultiplier;
					console.log(`    ⚡ S Symbol Collection: (${wSum}) × ${sMultiplier} = ×${collectedMultiplier}`);
				});
			}
		});
		
		// Summary of all multipliers on the board
		const allWSymbols = bookEvent.board.flatMap(reel => {
			const startIndex = Math.floor((reel.length - 5) / 2);
			return reel.slice(startIndex, startIndex + 5).filter(s => s.name === 'W' && s.multiplier);
		});
		const allSSymbols = bookEvent.board.flatMap(reel => {
			const startIndex = Math.floor((reel.length - 5) / 2);
			return reel.slice(startIndex, startIndex + 5).filter(s => s.name === 'S');
		});
		
		if (allWSymbols.length > 0 || allSSymbols.length > 0) {
			console.log(`🎯 Multiplier Summary:`);
			if (allWSymbols.length > 0) {
				const totalWMultiplier = allWSymbols.reduce((sum, s) => sum + (s.multiplier || 0), 0);
				console.log(`  W Symbols: ${allWSymbols.length} (Total: ×${totalWMultiplier})`);
			}
			if (allSSymbols.length > 0) {
				console.log(`  S Symbols: ${allSSymbols.length} (Will collect W multipliers in same reels)`);
			}
		}

		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		console.log(`💰 Event ${bookEvent.index} - Win Info Analysis:`);
		console.log(`  Total Win: ${bookEvent.totalWin}`);
		
		// Get current board state for S symbol expansion logic
		const currentBoard = stateGameDerived.boardRaw();
		
		// Import utility functions
		const { checkSSymbolsInWins, generateSSymbolExpansionPositions, calculateCombinedMultipliers } = await import('./utils');
		
		// Check if any S symbols participate in wins
		const sSymbolsInWins = checkSSymbolsInWins(bookEvent.wins, currentBoard);
		
		if (sSymbolsInWins.length > 0) {
			console.log(`⚡ S Symbols in Wins: ${sSymbolsInWins.length}`);
			sSymbolsInWins.forEach(pos => {
				console.log(`    S Symbol at R${pos.reel + 1}:${pos.row + 1} will expand upwards`);
			});
			
			// Generate expansion positions (upwards to top of grid)
			const expansionPositions = generateSSymbolExpansionPositions(sSymbolsInWins);
			console.log(`📈 S Symbol Expansion: ${expansionPositions.length} positions will be filled`);
		}
		
		bookEvent.wins.forEach((win, winIndex) => {
			console.log(`  Win ${winIndex + 1}:`);
			console.log(`    Symbol: ${win.symbol}`);
			console.log(`    Win Amount: ${win.win}`);
			console.log(`    Positions: ${win.positions.map(p => `R${p.reel + 1}:${p.row + 1}`).join(', ')}`);
			
			// Calculate combined multipliers for this win
			const combinedMultiplier = calculateCombinedMultipliers(win.positions, currentBoard);
			if (combinedMultiplier > 1) {
				console.log(`    🔥 Combined S/W Multipliers: ×${combinedMultiplier}`);
			}
			
			console.log(`    Multipliers:`);
			console.log(`      Line Multiplier: ×${win.meta.multiplier}`);
			console.log(`      Global Multiplier: ×${win.meta.globalMult}`);
			console.log(`      Line-specific Multiplier: ×${win.meta.lineMultiplier}`);
			console.log(`      Win without Multiplier: ${win.meta.winWithoutMult}`);
			console.log(`      Final Win: ${win.meta.winWithoutMult} × ${win.meta.multiplier} = ${win.win}`);
		});
		
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		
		// Animate regular win positions first
		await sequence(bookEvent.wins, async (win) => {
			await animateSymbols({ positions: win.positions });
		});
		
		// If S symbols are in wins, animate their upward expansion
		if (sSymbolsInWins.length > 0) {
			console.log(`🎬 Animating S symbol upward expansion...`);
			
			// Set S symbols to expand state and animate upward expansion
			const expansionPositions = generateSSymbolExpansionPositions(sSymbolsInWins);
			
			// First, set the original S symbols to expand state
			sSymbolsInWins.forEach(position => {
				const reelSymbol = stateGame.board[position.reel].reelState.symbols[position.row];
				reelSymbol.symbolState = 'expand';
			});
			
			// Then animate the expansion positions
			if (expansionPositions.length > 0) {
				await animateSymbols({ positions: expansionPositions });
			}
		}
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// animate scatters
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		// show free spin intro
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'boardFrameGlowShow' });
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount + 1,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterTotal = bookEvent.amount + 1;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'boardFrameGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'winHide' });
	},
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		// Do nothing
	},
	// customised
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				| BookEventOfType<T>
				| undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		const lastUpdateGlobalMultEvent = findLastBookEvent('updateGlobalMult' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		if (lastUpdateGlobalMultEvent) playBookEvent(lastUpdateGlobalMultEvent, { bookEvents });
	},
};
