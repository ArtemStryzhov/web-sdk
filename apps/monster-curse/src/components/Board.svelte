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
				const reelSymbol = context.stateGame.board[position.reel]?.reelState.symbols[position.row];
				if (!reelSymbol) return false;
				
				// Reset non-S symbols in 'win' state, or S symbols in 'expand' state
				return (reelSymbol.symbolState === 'win' && !['S'].includes(reelSymbol.rawSymbol.name)) ||
				       (reelSymbol.symbolState === 'expand' && reelSymbol.rawSymbol.name === 'S');
			});
			
			if (needsReset) {
				symbolPositions.forEach((position) => {
					const reelSymbol = context.stateGame.board[position.reel]?.reelState.symbols[position.row];
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
			const reelSymbol = context.stateGame.board[position.reel]?.reelState.symbols[position.row];
			
			// Safety check - skip if symbol not found
			if (!reelSymbol) {
				console.warn(`Symbol not found at position reel:${position.reel}, row:${position.row}`);
				continue;
			}
			
			// Handle S symbol expansion with multiplier collection
			if (reelSymbol.rawSymbol.name === 'S') {
				// Import the calculation function
				const { calculateSSymbolCollectedMultiplier } = await import('../game/utils');
				
				// Get current board state
				const currentBoard = context.stateGameDerived.boardRaw();
				
				// Calculate collected multiplier
				const collectedMultiplier = calculateSSymbolCollectedMultiplier(
					currentBoard,
					position.reel,
					position.row,
					reelSymbol.rawSymbol.multiplier || 1
				);
				
				// Mark W symbols above S as collected (hide their multipliers)
				context.stateGame.board[position.reel].reelState.symbols.forEach((symbol, rowIndex) => {
					if (rowIndex < position.row && symbol.rawSymbol.name === 'W' && symbol.rawSymbol.multiplier) {
						symbol.rawSymbol.isCollected = true;
					}
				});
				
				// Set the collected multiplier and position on the symbol
				reelSymbol.rawSymbol.collectedMultiplier = collectedMultiplier;
				// reelPosition represents expansion level (0-4) based on which visible row (1-5)
				// Visible rows: 1=top (level 0), 2 (level 1), 3 (level 2), 4 (level 3), 5=bottom (level 4)
				reelSymbol.rawSymbol.reelPosition = position.row - 1;
				
				// Set to expand state for S symbols
				reelSymbol.symbolState = 'expand';
				
				const promise = waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
				animationPromises.push(promise);
				symbolsToTransition.push({ reelSymbol });
			} else if (WIN_ANIMATION_SYMBOLS.includes(reelSymbol.rawSymbol.name)) {
				// Set to 'win' state (reset already done above)
				reelSymbol.symbolState = 'win';
				
				const promise = waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
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
