<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'COMPONENTS/<S Symbol Positions>',
	});
</script>

<script lang="ts">
	import {
		StoryGameTemplate,
		StoryLocale,
		type TemplateArgs,
		templateArgs,
	} from 'components-storybook';

	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { playBookEvent } from '../game/utils';
	import { stateGame, stateGameDerived } from '../game/stateGame.svelte';
	import config from '../game/config';
	import type { BookEvent } from '../game/typesBookEvent';

	setContext();

	// Helper function to create board with S symbol at specific position
	const createBoardWithSAtPosition = (reel: number, row: number, sMultiplier: number = 5) => {
		const board: any = [
			[{ name: 'L2' }, { name: 'W', wild: true, multiplier: 2 }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L4' }],
			[{ name: 'H3' }, { name: 'L4' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'H1' }, { name: 'L2' }],
			[{ name: 'H3' }, { name: 'L2' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L4' }],
			[{ name: 'H2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }],
			[{ name: 'H1' }, { name: 'L4' }, { name: 'L4' }, { name: 'H2' }, { name: 'H1' }, { name: 'L1' }, { name: 'L4' }],
		];
		
		// Place S symbol at specified position
		board[reel][row] = { name: 'S', scatter: true, multiplier: sMultiplier };
		
		// Add W symbols above S for multiplier collection (only if there's space above)
		if (row > 1 && reel === 1) {
			board[reel][row - 1] = { name: 'W', wild: true, multiplier: 3 };
		}
		if (row > 2 && reel === 1) {
			board[reel][row - 2] = { name: 'W', wild: true, multiplier: 2 };
		}
		
		return board;
	};

	// Create win combinations (simplified - just showing L4 wins)
	const createWins = () => [
		{
			symbol: 'L4' as 'L4',
			kind: 3,
			win: 30,
			positions: [
				{ reel: 0, row: 4 },
				{ reel: 1, row: 4 },
				{ reel: 2, row: 4 },
			],
			meta: {
				lineIndex: 4,
				multiplier: 1,
				winWithoutMult: 30,
				globalMult: 1,
				lineMultiplier: 1,
			},
		},
	];

	// Create 5 different scenarios with S at positions 1-5
	const scenarios = [
		{
			name: 'S at Row 1 (Position 0 - No Expansion)',
			reel: 1,
			row: 1,
			expandedRows: [],
			multiplier: 5,
			description: 'S symbol at top position, no expansion needed'
		},
		{
			name: 'S at Row 2 (Position 1 - 25% Expansion)',
			reel: 1,
			row: 2,
			expandedRows: [1],
			multiplier: 10,
			description: 'S symbol expands upward covering 1 row'
		},
		{
			name: 'S at Row 3 (Position 2 - 50% Expansion)',
			reel: 1,
			row: 3,
			expandedRows: [1, 2],
			multiplier: 15,
			description: 'S symbol expands upward covering 2 rows'
		},
		{
			name: 'S at Row 4 (Position 3 - 75% Expansion)',
			reel: 1,
			row: 4,
			expandedRows: [1, 2, 3],
			multiplier: 20,
			description: 'S symbol expands upward covering 3 rows'
		},
		{
			name: 'S at Row 5 (Position 4 - 100% Expansion)',
			reel: 1,
			row: 5,
			expandedRows: [1, 2, 3, 4],
			multiplier: 25,
			description: 'S symbol expands upward covering 4 rows (full expansion)'
		},
	];

	// Create book events for a specific scenario
	const createScenarioEvents = (scenario: typeof scenarios[0]): BookEvent[] => {
		const board = createBoardWithSAtPosition(scenario.reel, scenario.row, 5);
		
		return [
			{
				index: 0,
				type: 'reveal',
				board: board as any,
				paddingPositions: [290, 70, 56, 387, 217],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'swordExpandEvent',
				reel: scenario.reel,
				swordRow: scenario.row,
				expandedRows: scenario.expandedRows,
				multiplier: scenario.multiplier,
				isSticky: false,
			},
			{
				index: 2,
				type: 'winInfo',
				totalWin: 30,
				wins: createWins(),
			},
			{
				index: 3,
				type: 'setWin',
				amount: 30,
				winLevel: 1,
			},
			{
				index: 4,
				type: 'setTotalWin',
				amount: 30,
			},
			{
				index: 5,
				type: 'finalWin',
				amount: 30,
			},
		];
	};

	// State to track which scenario to show
	let currentScenarioIndex = $state(0);

	const playRandomScenario = async (_data?: any) => {
		// Randomly select a scenario
		currentScenarioIndex = Math.floor(Math.random() * scenarios.length);
		const scenario = scenarios[currentScenarioIndex];
		const events = createScenarioEvents(scenario);
		
		// Pre-spin
		await stateGameDerived.enhancedBoard.preSpin({
			paddingBoard: config.paddingReels[stateGame.gameType] as any,
		});
		
		// Play all events
		for (const event of events) {
			await playBookEvent(event, { bookEvents: events });
		}
	};
</script>

{#snippet template(args: TemplateArgs<any>)}
	<StoryGameTemplate
		skipLoadingScreen={args.skipLoadingScreen}
		action={async () => {
			await args.action?.(args.data);
		}}
	>
		<StoryLocale lang="en">
			<Game />
		</StoryLocale>
	</StoryGameTemplate>
{/snippet}

<!-- Main Random Story -->
<Story
	name="Random S Position (Spin to Test)"
	args={templateArgs({
		skipLoadingScreen: true,
		action: playRandomScenario,
	})}
	{template}
/>

<!-- Individual Position Stories -->
<Story
	name="S at Row 1 (Position 0 - No Expansion)"
	args={templateArgs({
		skipLoadingScreen: true,
		data: createScenarioEvents(scenarios[0]),
		action: async (events) => {
		
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[stateGame.gameType] as any,
			});
			
			for (const event of events) {
				await playBookEvent(event, { bookEvents: events });
			}
		},
	})}
	{template}
/>

<Story
	name="S at Row 2 (Position 1 - 25% Expansion)"
	args={templateArgs({
		skipLoadingScreen: true,
		data: createScenarioEvents(scenarios[1]),
		action: async (events) => {
		
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[stateGame.gameType] as any,
			});
			
			for (const event of events) {
				await playBookEvent(event, { bookEvents: events });
			}
		},
	})}
	{template}
/>

<Story
	name="S at Row 3 (Position 2 - 50% Expansion)"
	args={templateArgs({
		skipLoadingScreen: true,
		data: createScenarioEvents(scenarios[2]),
		action: async (events) => {
			
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[stateGame.gameType] as any,
			});
			
			for (const event of events) {
				await playBookEvent(event, { bookEvents: events });
			}
		},
	})}
	{template}
/>

<Story
	name="S at Row 4 (Position 3 - 75% Expansion)"
	args={templateArgs({
		skipLoadingScreen: true,
		data: createScenarioEvents(scenarios[3]),
		action: async (events) => {
			
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[stateGame.gameType] as any,
			});
			
			for (const event of events) {
				await playBookEvent(event, { bookEvents: events });
			}
		},
	})}
	{template}
/>

<Story
	name="S at Row 5 (Position 4 - 100% Expansion)"
	args={templateArgs({
		skipLoadingScreen: true,
		data: createScenarioEvents(scenarios[4]),
		action: async (events) => {
			
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[stateGame.gameType] as any,
			});
			
			for (const event of events) {
				await playBookEvent(event, { bookEvents: events });
			}
		},
	})}
	{template}
/>

<!-- Multiple S Symbols Story -->
<Story
	name="Multiple S Symbols (3 S symbols)"
	args={templateArgs({
		skipLoadingScreen: true,
		data: [
			{
				index: 0,
				type: 'reveal',
				board: [
					[{ name: 'L2' }, { name: 'W', wild: true, multiplier: 2 }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L4' }],
					[{ name: 'H3' }, { name: 'L4' }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'S', scatter: true, multiplier: 5 }, { name: 'H1' }],
					[{ name: 'H3' }, { name: 'L2' }, { name: 'L2' }, { name: 'L1' }, { name: 'S', scatter: true, multiplier: 10 }, { name: 'L3' }, { name: 'L4' }],
					[{ name: 'H2' }, { name: 'L3' }, { name: 'S', scatter: true, multiplier: 15 }, { name: 'L1' }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }],
					[{ name: 'H1' }, { name: 'L4' }, { name: 'L4' }, { name: 'H2' }, { name: 'H1' }, { name: 'L1' }, { name: 'L4' }],
				] as any,
				paddingPositions: [290, 70, 56, 387, 217],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'swordExpandEvent',
				reel: 1,
				swordRow: 5,
				expandedRows: [1, 2, 3, 4],
				multiplier: 5,
				isSticky: false,
			},
			{
				index: 2,
				type: 'swordExpandEvent',
				reel: 2,
				swordRow: 4,
				expandedRows: [1, 2, 3],
				multiplier: 10,
				isSticky: false,
			},
			{
				index: 3,
				type: 'swordExpandEvent',
				reel: 3,
				swordRow: 2,
				expandedRows: [1],
				multiplier: 15,
				isSticky: false,
			},
			{
				index: 4,
				type: 'winInfo',
				totalWin: 100,
				wins: createWins(),
			},
			{
				index: 5,
				type: 'setWin',
				amount: 100,
				winLevel: 2,
			},
			{
				index: 6,
				type: 'setTotalWin',
				amount: 100,
			},
			{
				index: 7,
				type: 'finalWin',
				amount: 100,
			},
		] as BookEvent[],
		action: async (events) => {
			
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[stateGame.gameType] as any,
			});
			
			for (const event of events) {
				await playBookEvent(event, { bookEvents: events });
			}
		},
	})}
	{template}
/>

<!-- All S Symbols in Win State Story -->
<Story
	name="All S Positions in Win State (No Expansion)"
	args={templateArgs({
		skipLoadingScreen: true,
		data: [
			{
				index: 0,
				type: 'reveal',
				board: [
					[{ name: 'L2' }, { name: 'S', scatter: true, multiplier: 5 }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L4' }],
					[{ name: 'H3' }, { name: 'L4' }, { name: 'S', scatter: true, multiplier: 10 }, { name: 'L4' }, { name: 'L2' }, { name: 'H1' }, { name: 'L2' }],
					[{ name: 'H3' }, { name: 'L2' }, { name: 'L2' }, { name: 'S', scatter: true, multiplier: 15 }, { name: 'L3' }, { name: 'L4' }, { name: 'L4' }],
					[{ name: 'H2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'S', scatter: true, multiplier: 20 }, { name: 'L1' }, { name: 'L4' }],
					[{ name: 'H1' }, { name: 'L4' }, { name: 'L4' }, { name: 'H2' }, { name: 'H1' }, { name: 'S', scatter: true, multiplier: 25 }, { name: 'L4' }],
				] as any,
				paddingPositions: [290, 70, 56, 387, 217],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'winInfo',
				totalWin: 150,
				wins: [
					{
						symbol: 'S' as 'S',
						kind: 5,
						win: 150,
						positions: [
							{ reel: 0, row: 1 },
							{ reel: 1, row: 2 },
							{ reel: 2, row: 3 },
							{ reel: 3, row: 4 },
							{ reel: 4, row: 5 },
						],
						meta: {
							lineIndex: 0,
							multiplier: 1,
							winWithoutMult: 150,
							globalMult: 1,
							lineMultiplier: 1,
						},
					},
				],
			},
			{
				index: 2,
				type: 'setWin',
				amount: 150,
				winLevel: 2,
			},
			{
				index: 3,
				type: 'setTotalWin',
				amount: 150,
			},
			{
				index: 4,
				type: 'finalWin',
				amount: 150,
			},
		] as BookEvent[],
		action: async (events) => {
			
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[stateGame.gameType] as any,
			});
			
			for (const event of events) {
				await playBookEvent(event, { bookEvents: events });
			}
		},
	})}
	{template}
/>

