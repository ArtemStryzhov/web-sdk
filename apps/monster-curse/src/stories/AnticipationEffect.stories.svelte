<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'COMPONENTS/<Anticipation>',
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
	import config from '../game/config';
	import { stateGame, stateGameDerived } from '../game/stateGame.svelte';
	import type { BookEventOfType } from '../game/typesBookEvent';

	setContext();

	// Anticipation reveal event with anticipation pattern [0, 0, 1, 2, 3]
	// Note: Board has 7 symbols per reel (top padding, 5 visible, bottom padding)
	const anticipationRevealEvent: BookEventOfType<'reveal'> = {
		index: 0,
		type: 'reveal',
		board: [
			// Reel 0 - No anticipation
			[
				{ name: 'L5' }, // top padding
				{ name: 'L2' },
				{ name: 'L1' },
				{ name: 'L4' },
				{ name: 'H2' },
				{ name: 'L1' },
				{ name: 'L3' }, // bottom padding
			],
			// Reel 1 - No anticipation
			[
				{ name: 'L4' }, // top padding
				{ name: 'H1' },
				{ name: 'L5' },
				{ name: 'L2' },
				{ name: 'H3' },
				{ name: 'L4' },
				{ name: 'H1' }, // bottom padding
			],
			// Reel 2 - Anticipation level 1
			[
				{ name: 'H4' }, // top padding
				{ name: 'H3' },
				{ name: 'H3' },
				{ name: 'H3' },
				{ name: 'H4' },
				{ name: 'L4' },
				{ name: 'L5' }, // bottom padding
			],
			// Reel 3 - Anticipation level 2
			[
				{ name: 'L4' }, // top padding
				{ name: 'H3' },
				{ name: 'H3' },
				{ name: 'L4' },
				{ name: 'L5' },
				{ name: 'L1' },
				{ name: 'H3' }, // bottom padding
			],
			// Reel 4 - Anticipation level 3
			[
				{ name: 'L3' }, // top padding
				{ name: 'H3' },
				{ name: 'L3' },
				{ name: 'L3' },
				{ name: 'H1' },
				{ name: 'H1' },
				{ name: 'L4' }, // bottom padding
			],
		],
		paddingPositions: [216, 205, 195, 16, 65],
		gameType: 'basegame',
		anticipation: [0, 0, 1, 2, 3],
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

<Story
	name="Anticipation Effect [0,0,1,2,3]"
	args={templateArgs({
		skipLoadingScreen: true,
		data: anticipationRevealEvent,
		action: async (data) => {
			// Pre-spin to prepare the reels
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[stateGame.gameType] as any,
			});
			
			// Play the reveal event with anticipation
			await playBookEvent(data, { bookEvents: [] });
		},
	})}
	{template}
/>

<Story
	name="Anticipation Effect (No PreSpin)"
	args={templateArgs({
		skipLoadingScreen: true,
		data: anticipationRevealEvent,
		action: async (data) => {
			// Play the reveal event with anticipation directly without pre-spin
			await playBookEvent(data, { bookEvents: [] });
		},
	})}
	{template}
/>

<Story
	name="Max Anticipation [0,0,3,3,3]"
	args={templateArgs({
		skipLoadingScreen: true,
		data: {
			...anticipationRevealEvent,
			anticipation: [0, 0, 3, 3, 3],
		} as BookEventOfType<'reveal'>,
		action: async (data) => {
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[stateGame.gameType] as any,
			});
			await playBookEvent(data, { bookEvents: [] });
		},
	})}
	{template}
/>

<Story
	name="Full Board Anticipation [1,2,3,3,3]"
	args={templateArgs({
		skipLoadingScreen: true,
		data: {
			...anticipationRevealEvent,
			anticipation: [1, 2, 3, 3, 3],
		} as BookEventOfType<'reveal'>,
		action: async (data) => {
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels[stateGame.gameType] as any,
			});
			await playBookEvent(data, { bookEvents: [] });
		},
	})}
	{template}
/>

