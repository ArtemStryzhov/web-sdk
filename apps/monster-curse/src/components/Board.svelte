<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	export type EmitterEventBoard =
		| { type: 'boardSettle'; board: RawSymbol[][] }
		| { type: 'boardShow' }
		| { type: 'boardHide' }
		| {
				type: 'boardWithAnimateSymbols';
				symbolPositions: Position[];
		  };
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import { WIN_ANIMATION_SYMBOLS } from '../game/constants';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';
	import Payframes from './Payframes.svelte';
	
	// Normalize payload row (1..5, top-based visible rows) to board array index.
	// Board has 7 symbols; visible window is middle 5 with startIndex = floor((len-5)/2).
	const normalize = (row: number, reel: number) => {
		if (row >= 1 && row <= 5) {
			const len = context.stateGame.board[reel]?.reelState?.symbols?.length ?? 7;
			const startIndex = Math.floor((len - 5) / 2);
			return startIndex + (row - 1);
		}
		return row;
	};

	const context = getContext();

	let show = $state(true);

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => context.stateGameDerived.enhancedBoard.stop(),
		boardSettle: ({ board }) => context.stateGameDerived.enhancedBoard.settle(board),
		boardShow: () => (show = true),
		boardHide: () => (show = false),
		boardWithAnimateSymbols: async ({ symbolPositions }) => {
			// Step 1: Reset symbols if needed to force animation replay
			const needsReset = symbolPositions.some((position) => {
				const reelSymbol = context.stateGame.board[position.reel]?.reelState.symbols[normalize(position.row, position.reel)];
				if (!reelSymbol) return false;
				
				// Reset non-S symbols in 'win' state, or S symbols in 'expand' state
				return (reelSymbol.symbolState === 'win' && !['S'].includes(reelSymbol.rawSymbol.name)) ||
				       (reelSymbol.symbolState === 'expand' && reelSymbol.rawSymbol.name === 'S');
			});
			
			if (needsReset) {
				symbolPositions.forEach((position) => {
					const reelSymbol = context.stateGame.board[position.reel]?.reelState.symbols[normalize(position.row, position.reel)];
					if (!reelSymbol) return;
					
					// Reset non-S symbols in 'win' state
					if (reelSymbol.symbolState === 'win' && !['S'].includes(reelSymbol.rawSymbol.name)) {
						reelSymbol.symbolState = 'land';
					}
					// Reset S symbols in 'expand' state
					else if (reelSymbol.symbolState === 'expand' && reelSymbol.rawSymbol.name === 'S') {
						reelSymbol.symbolState = 'postWinStatic';
					}
				});
				await new Promise(resolve => setTimeout(resolve, 50));
			}
			
		// Step 2: Process all symbols - set states and collect animation promises
		const animationPromises: Promise<void>[] = [];
		const symbolsToTransition: { reelSymbol: any; originalSymbol?: any }[] = [];
		
		for (const position of symbolPositions) {
			const reelSymbol = context.stateGame.board[position.reel]?.reelState.symbols[normalize(position.row, position.reel)];
			
			// Safety check - skip if symbol not found
			if (!reelSymbol) {
				console.warn(`Symbol not found at position reel:${position.reel}, row:${position.row}`);
				continue;
			}
			
			// Handle S symbol expansion with multiplier collection
			if (reelSymbol.rawSymbol.name === 'S') {
				// Import the calculation function
				const { calculateSSymbolCollectedMultiplier } = await import('../game/utils');

				// Keep precomputed collection state from swordExpandEvent if present.
				// Only calculate here when no collected multiplier has been prepared yet.
				if (!reelSymbol.rawSymbol.collectedMultiplier) {
					const currentBoard = context.stateGameDerived.boardRaw();
					const collectedMultiplier = calculateSSymbolCollectedMultiplier(
						currentBoard,
						position.reel,
						position.row,
						reelSymbol.rawSymbol.multiplier || 1
					);
					reelSymbol.rawSymbol.collectedMultiplier = collectedMultiplier;
				}

				// Set the collected multiplier position hint on the symbol
				// reelPosition represents expansion level (0-4) based on which visible row (1-5)
				// Visible rows: 1=top (level 0), 2 (level 1), 3 (level 2), 4 (level 3), 5=bottom (level 4)
				reelSymbol.rawSymbol.reelPosition = position.row - 1;
				
				// Set to expand state for S symbols
				reelSymbol.symbolState = 'expand';
				
				// Protect against animations that never fire 'complete'
				const promise = Promise.race([
					waitForResolve((resolve) => (reelSymbol.oncomplete = resolve)),
					new Promise<void>((resolve) => setTimeout(resolve, 5000)),
				]);
				animationPromises.push(promise);
				symbolsToTransition.push({ reelSymbol });
			} else if (WIN_ANIMATION_SYMBOLS.includes(reelSymbol.rawSymbol.name)) {
				// Set to 'win' state (reset already done above)
				reelSymbol.symbolState = 'win';
				
				// Protect against animations that never fire 'complete'
				const promise = Promise.race([
					waitForResolve((resolve) => (reelSymbol.oncomplete = resolve)),
					new Promise<void>((resolve) => setTimeout(resolve, 5000)),
				]);
				animationPromises.push(promise);
				symbolsToTransition.push({ reelSymbol });
			} else {
				const originalSymbol = { ...reelSymbol.rawSymbol };
				
				reelSymbol.rawSymbol = {
					name: 'S',
					scatter: true,
				};
				reelSymbol.symbolState = 'expand';
				
				const promise = waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
				await promise;
				
				reelSymbol.rawSymbol = originalSymbol;
				reelSymbol.symbolState = 'postWinStatic';
			}
		}
		
		// Wait for all animations to complete before transitioning any symbols
		await Promise.all(animationPromises);
		
		// Now transition symbols - S symbols stay in 'expand' state to remain expanded, others go to postWinStatic
		symbolsToTransition.forEach(({ reelSymbol }) => {
			if (reelSymbol.rawSymbol.name === 'S') {
				// Keep S symbols in 'expand' state to avoid remounting (key includes state)
				reelSymbol.symbolState = 'expand';
			} else {
				reelSymbol.symbolState = 'postWinStatic';
			}
		});
		},
	});

	context.stateGameDerived.enhancedBoard.readyToSpinEffect();
</script>

{#if show}
	<BoardContext animate={false}>
		<BoardContainer>
			<BoardMask />
			<BoardBase />
		</BoardContainer>
	</BoardContext>

	<BoardContext animate={true}>
		<BoardContainer>
			<BoardMask />
			<BoardBase />
		</BoardContainer>
	</BoardContext>

	<!-- Payframes rendered separately at highest z-index -->
	<BoardContext animate={true}>
		<BoardContainer>
			<Payframes />
		</BoardContainer>
	</BoardContext>
{/if}
