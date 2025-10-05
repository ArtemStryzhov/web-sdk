<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Symbols/S - Scatter Symbol',
		parameters: {
			layout: 'fullscreen',
		},
	});
</script>

<script lang="ts">
	import { Container, SpineProvider, SpineTrack } from 'pixi-svelte';
	import {
		StoryPixiApp,
		StoryLocale,
		StoryGameTemplate,
		type TemplateArgs,
		templateArgs,
	} from 'components-storybook';

	import Symbol from '../components/Symbol.svelte';
	import assets from '../game/assets';
	import { stateGame, stateGameDerived } from '../game/stateGame.svelte';
	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { eventEmitter } from '../game/eventEmitter';
	import config from '../game/config';
	import type { RawSymbol } from '../game/types';
	import { SYMBOL_SIZE } from '../game/constants';

	setContext();
</script>

{#snippet simpleTemplate()}
	<StoryPixiApp {assets}>
		<Container>
		<!-- 5 symbols in a reel to the left of S symbol (120px symbol size + 5px spacing = 125px apart) -->
		<Container x={250} y={85}>
			<Symbol
				x={0}
				y={0}
				rawSymbol={{ name: 'H1' }}
				state="win"
				loop={true}
			/>
		</Container>
		<Container x={250} y={210}>
			<Symbol
				x={0}
				y={0}
				rawSymbol={{ name: 'L1' }}
				state="win"
				loop={true}
			/>
		</Container>
		<Container x={250} y={335}>
			<Symbol
				x={0}
				y={0}
				rawSymbol={{ name: 'H2' }}
				state="win"
				loop={true}
			/>
		</Container>
		<Container x={250} y={460}>
			<Symbol
				x={0}
				y={0}
				rawSymbol={{ name: 'L2' }}
				state="win"
				loop={true}
			/>
		</Container>
		<Container x={250} y={585}>
			<Symbol
				x={0}
				y={0}
				rawSymbol={{ name: 'H3' }}
				state="win"
				loop={true}
			/>
		</Container>
			
			<Container x={400} y={586}>
				<Symbol
					x={0}
					y={0}
					rawSymbol={{ name: 'S', scatter: true }}
					state="win"
					loop={false}
				/>
			</Container>

			<!-- Payframes for all win state symbols -->
			<Container zIndex={10000}>
				<SpineProvider x={250} y={85} key="anticipation" width={SYMBOL_SIZE * 0.6}>
					<SpineTrack trackIndex={0} animationName={'payframe'} loop />
				</SpineProvider>
				<SpineProvider x={250} y={210} key="anticipation" width={SYMBOL_SIZE * 0.6}>
					<SpineTrack trackIndex={0} animationName={'payframe'} loop />
				</SpineProvider>
				<SpineProvider x={250} y={335} key="anticipation" width={SYMBOL_SIZE * 0.6}>
					<SpineTrack trackIndex={0} animationName={'payframe'} loop />
				</SpineProvider>
				<SpineProvider x={250} y={460} key="anticipation" width={SYMBOL_SIZE * 0.6}>
					<SpineTrack trackIndex={0} animationName={'payframe'} loop />
				</SpineProvider>
				<SpineProvider x={250} y={585} key="anticipation" width={SYMBOL_SIZE * 0.6}>
					<SpineTrack trackIndex={0} animationName={'payframe'} loop />
				</SpineProvider>
			</Container>
		</Container>
	</StoryPixiApp>
{/snippet}

{#snippet gameTemplate(args: TemplateArgs<any>)}
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

<Story name="S Symbol - Win State" template={simpleTemplate} />

<Story
	name="S Symbol - In Reel (preSpin)"
	args={templateArgs({
		skipLoadingScreen: true,
		data: {},
		action: async () => {
			// Create visible board with 1 S symbol at the bottom of first reel
			const visibleBoard = [
				[
					{ name: 'L1' },    // visible row 0 (top)
					{ name: 'L4' },    // visible row 1
					{ name: 'H2' },    // visible row 2 (middle) 
					{ name: 'L1' },    // visible row 3
					{ name: 'S', scatter: true }, // visible row 4 (bottom) - S SYMBOL
				],
				[
					{ name: 'H1' },
					{ name: 'L5' },
					{ name: 'L2' },
					{ name: 'H3' },
					{ name: 'L4' },
				],
				[
					{ name: 'H1' },
					{ name: 'L5' },
					{ name: 'L3' },
					{ name: 'H4' },
					{ name: 'L4' },
				],
				[
					{ name: 'H1' },
					{ name: 'H3' },
					{ name: 'L4' },
					{ name: 'L5' },
					{ name: 'L1' },
				],
				[
					{ name: 'H1' },
					{ name: 'L3' },
					{ name: 'L3' },
					{ name: 'H1' },
					{ name: 'H1' },
				],
			] as RawSymbol[][];

			// Directly call settle to set the board state
			stateGameDerived.enhancedBoard.settle(visibleBoard);
			
			// Also broadcast the event to ensure UI updates
			eventEmitter.broadcast({ 
				type: 'boardSettle', 
				board: visibleBoard 
			});
		},
	})}
	template={gameTemplate}
/>