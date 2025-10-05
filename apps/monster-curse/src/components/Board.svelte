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
			const getPromises = () =>
				symbolPositions.map(async (position) => {
					const reelSymbol = context.stateGame.board[position.reel].reelState.symbols[position.row];
					
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
							reelSymbol.rawSymbol.multiplier || 1
						);
						
						// Set the collected multiplier on the symbol
						reelSymbol.rawSymbol.collectedMultiplier = collectedMultiplier;
						
						// Set to expand state for S symbols
						reelSymbol.symbolState = 'expand';
					} else if (reelSymbol.rawSymbol.name === 'W' || reelSymbol.rawSymbol.name === 'H1' || 
							   reelSymbol.rawSymbol.name === 'H2' || reelSymbol.rawSymbol.name === 'H3' || 
							   reelSymbol.rawSymbol.name === 'H4' || reelSymbol.rawSymbol.name === 'L1' || 
							   reelSymbol.rawSymbol.name === 'L2' || reelSymbol.rawSymbol.name === 'L3' || 
							   reelSymbol.rawSymbol.name === 'L4' || reelSymbol.rawSymbol.name === 'L5') {
						// Regular win animation for other symbols
						reelSymbol.symbolState = 'win';
					} else {
						// For expansion positions (empty positions that S symbols expand into)
						// Create a new S symbol at this position
						reelSymbol.rawSymbol = {
							name: 'S',
							scatter: true,
							// Copy multiplier from the original S symbol if available
							// This will be handled by the expansion logic
						};
						reelSymbol.symbolState = 'expand';
					}
					
					const promise = waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
					await promise;
					reelSymbol.symbolState = 'postWinStatic';
				});

			await Promise.all(getPromises());
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
