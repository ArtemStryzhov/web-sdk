<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Components/<Symbol>',
		component: Symbol,
		args: {
			x: 100,
			y: 100,
			rawSymbol: { name: 'S', scatter: true },
			state: 'static',
		},
	});
</script>

<script lang="ts">
	import { Container, Text, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';

	import Symbol from '../components/Symbol.svelte';
	import { SYMBOL_STATES } from '../game/types';
	import { SYMBOL_SIZE } from '../game/constants';
	import assets from '../game/assets';

	const BASE = 180;

	const SYMBOLS_LEFT = [
		{ name: 'L1' },
		{ name: 'L2' },
		{ name: 'L3' },
		{ name: 'L4' },
		{ name: 'L5' },
	] as const;

	const SYMBOLS_RIGHT = [
		{ name: 'S' },
		{ name: 'W', multiplier: 2 },
		{ name: 'B' },
		{ name: 'H1' },
		{ name: 'H2' },
		{ name: 'H3' },
		{ name: 'H4' },
	] as const;
</script>

<Story name="component">
	{#snippet template(args)}
		<StoryPixiApp {assets}>
			<Symbol {...args} oncomplete={() => {}} />
		</StoryPixiApp>
	{/snippet}
</Story>

<Story name="symbols">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container scale={0.5}>
				{#each SYMBOLS_LEFT as symbol, rowIndex}
					{#each SYMBOL_STATES as state, columnIndex}
						{@const x = (columnIndex + 1) * BASE}
						{@const y = (rowIndex + 1) * BASE}
						<Text {x} y={y - 100} anchor={{ x: 0.5, y: 0 }} text={`${symbol.name}: ${state}`} />
						<Symbol {x} {y} rawSymbol={symbol} {state} loop={state === 'win' && (symbol as any).name !== 'S'} />
					{/each}
				{/each}
			</Container>

			<Container scale={0.5} x={550}>
				{#each SYMBOLS_RIGHT as symbol, rowIndex}
					{#each SYMBOL_STATES as state, columnIndex}
						{@const x = (columnIndex + 1) * BASE}
						{@const y = (rowIndex + 1) * BASE}
						<Text {x} y={y - 100} anchor={{ x: 0.5, y: 0 }} text={`${symbol.name}: ${state}`} />
						<Symbol {x} {y} rawSymbol={symbol} {state} loop={state === 'win' && (symbol as any).name !== 'S'} />
					{/each}
				{/each}
			</Container>

			<!-- Payframes for all win state symbols -->
			<Container scale={0.5} zIndex={10000}>
				{#each SYMBOLS_LEFT as symbol, rowIndex}
					{@const winColumnIndex = SYMBOL_STATES.indexOf('win')}
					{@const x = (winColumnIndex + 1) * BASE}
					{@const y = (rowIndex + 1) * BASE}
					<SpineProvider {x} {y} key="anticipation" width={SYMBOL_SIZE * 0.6}>
						<SpineTrack trackIndex={0} animationName={'payframe'} loop />
					</SpineProvider>
				{/each}
			</Container>

			<Container scale={0.5} x={550} zIndex={10000}>
				{#each SYMBOLS_RIGHT as symbol, rowIndex}
					{#if symbol.name !== 'S'}
						{@const winColumnIndex = SYMBOL_STATES.indexOf('win')}
						{@const x = (winColumnIndex + 1) * BASE}
						{@const y = (rowIndex + 1) * BASE}
						<SpineProvider {x} {y} key="anticipation" width={SYMBOL_SIZE * 0.6}>
							<SpineTrack trackIndex={0} animationName={'payframe'} loop />
						</SpineProvider>
					{/if}
				{/each}
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>
