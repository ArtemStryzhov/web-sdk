<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'COMPONENTS/<S Symbol Expansion>',
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

	// Backend response data with swordExpandEvent
	const backendBookEvents: BookEvent[] = [
		{
			index: 0,
			type: 'reveal',
			board: [
				[
					{ name: 'L2' },
					{ name: 'W', wild: true, multiplier: 2 },
					{ name: 'H2' },
					{ name: 'L1' },
					{ name: 'L4' },
					{ name: 'L3' },
					{ name: 'L4' },
				],
				[
					{ name: 'H3' },
					{ name: 'L4' },
					{ name: 'L3' },
					{ name: 'L4' },
					{ name: 'L2' },
					{ name: 'S', scatter: true, multiplier: 5 },
					{ name: 'H1' },
				],
				[
					{ name: 'H3' },
					{ name: 'L2' },
					{ name: 'L2' },
					{ name: 'L1' },
					{ name: 'S', scatter: true, multiplier: 50 },
					{ name: 'L3' },
					{ name: 'L4' },
				],
				[
					{ name: 'H2' },
					{ name: 'L3' },
					{ name: 'L4' },
					{ name: 'L1' },
					{ name: 'H2' },
					{ name: 'B' },
					{ name: 'L4' },
				],
				[
					{ name: 'H1' },
					{ name: 'L4' },
					{ name: 'L4' },
					{ name: 'H2' },
					{ name: 'H1' },
					{ name: 'L1' },
					{ name: 'L4' },
				],
			],
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
			multiplier: 50,
			isSticky: false,
		},
		{
			index: 3,
			type: 'winInfo',
			totalWin: 6740,
			wins: [
				{
					symbol: 'L3',
					kind: 4,
					win: 140,
					positions: [
						{ reel: 0, row: 1 },
						{ reel: 1, row: 1 },
						{ reel: 2, row: 1 },
						{ reel: 3, row: 1 },
					],
					meta: {
						lineIndex: 1,
						multiplier: 2,
						winWithoutMult: 70,
						globalMult: 1,
						lineMultiplier: 2,
					},
				},
				{
					symbol: 'L4',
					kind: 3,
					win: 1500,
					positions: [
						{ reel: 0, row: 4 },
						{ reel: 1, row: 4 },
						{ reel: 2, row: 4 },
					],
					meta: {
						lineIndex: 4,
						multiplier: 50,
						winWithoutMult: 30,
						globalMult: 1,
						lineMultiplier: 50,
					},
				},
			],
		},
		{
			index: 4,
			type: 'setWin',
			amount: 6740,
			winLevel: 8,
		},
		{
			index: 5,
			type: 'setTotalWin',
			amount: 6740,
		},
		{
			index: 6,
			type: 'finalWin',
			amount: 6740,
		},
	];
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

<Story
	name="S Symbol Expansion with Backend Data"
	args={templateArgs({
		skipLoadingScreen: true,
		data: backendBookEvents,
		action: async (events) => {
			// Pre-spin to prepare the reels
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[stateGame.gameType] as any,
			});
			
			// Play all book events sequentially
			for (const event of events) {
				await playBookEvent(event, { bookEvents: events });
			}
		},
	})}
	{template}
/>

<Story
	name="Single S Expansion (pos4)"
	args={templateArgs({
		skipLoadingScreen: true,
		data: [
			{
				index: 0,
				type: 'reveal',
				board: [
					[{ name: 'L2' }, { name: 'W', wild: true, multiplier: 2 }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L4' }],
					[{ name: 'H3' }, { name: 'L4' }, { name: 'L3' }, { name: 'L4' }, { name: 'S', scatter: true, multiplier: 5 }, { name: 'H1' }, { name: 'L2' }],
					[{ name: 'H3' }, { name: 'L2' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L4' }],
					[{ name: 'H2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }],
					[{ name: 'H1' }, { name: 'L4' }, { name: 'L4' }, { name: 'H2' }, { name: 'H1' }, { name: 'L1' }, { name: 'L4' }],
				],
				paddingPositions: [290, 70, 56, 387, 217],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'swordExpandEvent',
				reel: 1,
				swordRow: 4,
				expandedRows: [0, 1, 2, 3],
				multiplier: 10,
				isSticky: false,
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

<Story
	name="No Expansion (pos0)"
	args={templateArgs({
		skipLoadingScreen: true,
		data: [
			{
				index: 0,
				type: 'reveal',
				board: [
					[{ name: 'L2' }, { name: 'L1' }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }, { name: 'L3' }, { name: 'L4' }],
					[{ name: 'H3' }, { name: 'S', scatter: true, multiplier: 5 }, { name: 'L3' }, { name: 'L4' }, { name: 'L2' }, { name: 'H1' }, { name: 'L2' }],
					[{ name: 'H3' }, { name: 'L2' }, { name: 'L2' }, { name: 'L1' }, { name: 'L3' }, { name: 'L4' }, { name: 'L4' }],
					[{ name: 'H2' }, { name: 'L3' }, { name: 'L4' }, { name: 'L1' }, { name: 'H2' }, { name: 'L1' }, { name: 'L4' }],
					[{ name: 'H1' }, { name: 'L4' }, { name: 'L4' }, { name: 'H2' }, { name: 'H1' }, { name: 'L1' }, { name: 'L4' }],
				],
				paddingPositions: [290, 70, 56, 387, 217],
				gameType: 'basegame',
				anticipation: [0, 0, 0, 0, 0],
			},
			{
				index: 1,
				type: 'swordExpandEvent',
				reel: 1,
				swordRow: 1,
				expandedRows: [],
				multiplier: 5,
				isSticky: false,
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

