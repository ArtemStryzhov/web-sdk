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
					reelSymbol.rawSymbol.reelPosition = position.row;
					
					// Set to expand state for S symbols (reset even if already in postWinStatic)
					reelSymbol.symbolState = 'expand';
				} else if (reelSymbol.rawSymbol.name === 'W' || reelSymbol.rawSymbol.name === 'H1' || 
							   reelSymbol.rawSymbol.name === 'H2' || reelSymbol.rawSymbol.name === 'H3' || 
							   reelSymbol.rawSymbol.name === 'H4' || reelSymbol.rawSymbol.name === 'L1' || 
							   reelSymbol.rawSymbol.name === 'L2' || reelSymbol.rawSymbol.name === 'L3' || 
							   reelSymbol.rawSymbol.name === 'L4' || reelSymbol.rawSymbol.name === 'L5' ||
							   reelSymbol.rawSymbol.name === 'B') {
						// Regular win animation for other symbols (including bonus B symbol)
						console.log(`🎬 Animating symbol at (${position.reel},${position.row}): ${reelSymbol.rawSymbol.name}, currentState: ${reelSymbol.symbolState}`);
						
						// Reset to 'land' first if in 'postWinStatic' or 'win' to trigger re-animation
						// Use 'land' instead of 'static' to avoid potential rendering issues
						if (reelSymbol.symbolState === 'postWinStatic' || reelSymbol.symbolState === 'win') {
							console.log(`  ↪️ Resetting from ${reelSymbol.symbolState} → land`);
							reelSymbol.symbolState = 'land';
							// Small delay to ensure state change is registered
							await new Promise(resolve => setTimeout(resolve, 50));
						}
						console.log(`  ▶️ Setting to win state`);
						reelSymbol.symbolState = 'win';
				} else {
					// For expansion positions (empty positions that S symbols expand into)
					// Save the original symbol so we can restore it after animation
					const originalSymbol = { ...reelSymbol.rawSymbol };
					
					// Temporarily replace with S symbol for expansion animation
					reelSymbol.rawSymbol = {
						name: 'S',
						scatter: true,
					};
					reelSymbol.symbolState = 'expand';
					
					// Wait for animation to complete
					const promise = waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
					await promise;
					
					// Restore the original symbol
					reelSymbol.rawSymbol = originalSymbol;
					reelSymbol.symbolState = 'postWinStatic';
					console.log(`  ✅ Expansion animation complete at (${position.reel},${position.row}), restored original symbol: ${originalSymbol.name}`);
					return; // Exit early since we've already handled the completion
				}
				
			const promise = waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
			await promise;
			console.log(`  ✅ Animation complete at (${position.reel},${position.row}), setting to postWinStatic`);
			reelSymbol.symbolState = 'postWinStatic';
				
				// Debug: Check symbol visibility after state change
				setTimeout(() => {
					console.log(`  🔍 Post-animation check (${position.reel},${position.row}): state=${reelSymbol.symbolState}, symbol=${reelSymbol.rawSymbol.name}`);
				}, 100);
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
