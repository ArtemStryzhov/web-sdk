<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Symbols/Assets - symbolsAnimated.atlas Debug',
		parameters: {
			layout: 'fullscreen',
		},
	});
</script>

<script lang="ts">
	import { Container, Text, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';

	import assets from '../game/assets';

	// Assets with static animations available
	const ATLAS_ASSETS = [
		'tornado_blue',
		'tornado_pink',
		'tornado_green',
		'electric_cloud_pink'
	];

	// Available animations from symbolsAnimated.json
	const ANIMATIONS = [
		'magic_ring_spin',
		'tornado_spin',
		'electric_cloud_spin',
		'electric_spin',
		'tornado_blue_static',
		'tornado_pink_static',
		'tornado_green_static',
		'electric_cloud_pink_static',
		'h1',
		'h2',
		'h3',
		'h4',
		'l1',
		'l2',
		'l3',
		'l4',
		'l5'
	];

	// Test data for different animation types
	const TEST_ITEMS = [
		{ name: 'Magic Ring Spin', animation: 'magic_ring_spin' },
		{ name: 'Tornado Spin', animation: 'tornado_spin' },
		{ name: 'Electric Cloud Spin', animation: 'electric_cloud_spin' },
		{ name: 'Electric Spin', animation: 'electric_spin' },
		{ name: 'Tornado Blue Static', animation: 'tornado_blue_static' },
		{ name: 'Tornado Pink Static', animation: 'tornado_pink_static' },
		{ name: 'Tornado Green Static', animation: 'tornado_green_static' },
		{ name: 'Electric Cloud Pink Static', animation: 'electric_cloud_pink_static' },
		{ name: 'H1 Symbol', animation: 'h1' },
		{ name: 'H2 Symbol', animation: 'h2' },
		{ name: 'H3 Symbol', animation: 'h3' },
		{ name: 'H4 Symbol', animation: 'h4' },
		{ name: 'L1 Symbol', animation: 'l1' },
		{ name: 'L2 Symbol', animation: 'l2' },
		{ name: 'L3 Symbol', animation: 'l3' },
		{ name: 'L4 Symbol', animation: 'l4' },
		{ name: 'L5 Symbol', animation: 'l5' }
	];

	const ITEM_SIZE = 120;
	const GRID_COLS = 6;
	const GRID_SPACING = 150;
	const START_X = 100;
	const START_Y = 100;

</script>

<Story name="Atlas Assets Test">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container>
				<!-- Title -->
				<Text
					x={400}
					y={20}
					anchor={{ x: 0.5, y: 0 }}
					text="symbolsAnimated.atlas Assets Debug"
					style={{
						fontFamily: 'Arial',
						fontSize: 24,
						fill: 0xffffff,
						fontWeight: 'bold',
					}}
				/>

				<!-- Atlas Assets Section -->
				<Text
					x={50}
					y={60}
					anchor={{ x: 0, y: 0 }}
					text="Atlas Assets (Static):"
					style={{
						fontFamily: 'Arial',
						fontSize: 18,
						fill: 0x00ff00,
						fontWeight: 'bold',
					}}
				/>

				<!-- Render all atlas assets -->
				{#each ATLAS_ASSETS as assetName, index}
					{@const col = index % GRID_COLS}
					{@const row = Math.floor(index / GRID_COLS)}
					{@const x = START_X + col * GRID_SPACING}
					{@const y = START_Y + row * GRID_SPACING + 50}

					<Container {x} {y}>
						<!-- Asset display using SpineProvider with static animation -->
						<SpineProvider
							key="symbolsAnimated"
							width={ITEM_SIZE}
							height={ITEM_SIZE}
							anchor={0.5}
						>
							<SpineTrack
								trackIndex={0}
								animationName={`${assetName}_static`}
								loop={true}
								timeScale={1}
							/>
						</SpineProvider>

						<!-- Asset name label -->
						<Text
							x={0}
							y={ITEM_SIZE/2 + 15}
							anchor={{ x: 0.5, y: 0 }}
							text={assetName}
							style={{
								fontFamily: 'Arial',
								fontSize: 10,
								fill: 0xffffff,
								fontWeight: 'bold',
								align: 'center'
							}}
						/>
					</Container>
				{/each}

				<!-- Animations Section -->
				{@const animY = START_Y + Math.ceil(ATLAS_ASSETS.length / GRID_COLS) * GRID_SPACING + 150}
				<Text
					x={50}
					y={animY - 30}
					anchor={{ x: 0, y: 0 }}
					text="Animations:"
					style={{
						fontFamily: 'Arial',
						fontSize: 18,
						fill: 0x00aaff,
						fontWeight: 'bold',
					}}
				/>

				<!-- Render all animations -->
				{#each ANIMATIONS as animationName, index}
					{@const col = index % GRID_COLS}
					{@const row = Math.floor(index / GRID_COLS)}
					{@const x = START_X + col * GRID_SPACING}
					{@const y = animY + row * GRID_SPACING}

					<Container {x} {y}>
						<!-- Animation display -->
						<SpineProvider
							key="symbolsAnimated"
							width={ITEM_SIZE}
							height={ITEM_SIZE}
							anchor={0.5}
						>
							<SpineTrack
								trackIndex={0}
								animationName={animationName}
								loop={true}
								timeScale={1}
							/>
						</SpineProvider>

						<!-- Animation name label -->
						<Text
							x={0}
							y={ITEM_SIZE/2 + 15}
							anchor={{ x: 0.5, y: 0 }}
							text={animationName}
							style={{
								fontFamily: 'Arial',
								fontSize: 9,
								fill: 0xffffff,
								fontWeight: 'bold',
								align: 'center'
							}}
						/>
					</Container>
				{/each}

			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>
