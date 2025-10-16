<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Symbols/B - Animated Sprite',
		parameters: {
			layout: 'fullscreen',
		},
	});
</script>

<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';

	import Symbol from '../components/Symbol.svelte';
	import { SYMBOL_STATES } from '../game/types';
	import assets from '../game/assets';

	// Use default assets (B_animation loaded manually in component)
	const bAssets = assets;

	const SYMBOL_SIZE = 150;
	const GRID_COLS = 3;
	const GRID_SPACING = 250;
	const START_X = 200;
	const START_Y = 150;

</script>

<Story name="B Symbol - Animated Sprite">
	{#snippet template()}
		<StoryPixiApp assets={bAssets}>
			<Container>
				<!-- Title -->
				<Text
					x={400}
					y={30}
					anchor={{ x: 0.5, y: 0 }}
					text="B Symbol - Animated Sprite"
					style={{
						fontFamily: 'Arial',
						fontSize: 28,
						fill: 0xffffff,
						fontWeight: 'bold',
					}}
				/>

				<!-- Render symbols in all states -->
				{#each SYMBOL_STATES as state, index}
					{@const col = index % GRID_COLS}
					{@const row = Math.floor(index / GRID_COLS)}
					{@const x = START_X + col * GRID_SPACING}
					{@const y = START_Y + row * GRID_SPACING}

					<Container {x} {y}>
						<!-- Symbol -->
						<Symbol
							x={0}
							y={0}
							rawSymbol={{ name: 'B' }}
							{state}
							loop={state === 'win' || state === 'spin'}
						/>

						<!-- State title under symbol -->
						<Text
							x={0}
							y={SYMBOL_SIZE/2 + 20}
							anchor={{ x: 0.5, y: 0 }}
							text={state.toUpperCase()}
							style={{
								fontFamily: 'Arial',
								fontSize: 14,
								fill: 0x000000,
								fontWeight: 'bold',
							}}
						/>
					</Container>
				{/each}

			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>
