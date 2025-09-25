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
		'electric_cloud_spin',
		'tornado_blue_static',
		'electric_cloud_pink_static'
	];

	// Test data for different animation types
	const TEST_ITEMS = [
		{ name: 'Magic Ring Spin', animation: 'magic_ring_spin' },
		{ name: 'Electric Cloud Spin', animation: 'electric_cloud_spin' },
		{ name: 'Tornado Blue Static', animation: 'tornado_blue_static' },
		{ name: 'Electric Cloud Pink Static', animation: 'electric_cloud_pink_static' }
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

				<!-- Test Items Section -->
				<Text
					x={50}
					y={60}
					anchor={{ x: 0, y: 0 }}
					text="symbolsAnimated.json Animations:"
					style={{
						fontFamily: 'Arial',
						fontSize: 18,
						fill: 0x00aaff,
						fontWeight: 'bold',
					}}
				/>

				<!-- Render all test items -->
				{#each TEST_ITEMS as item, index}
					{@const col = index % GRID_COLS}
					{@const row = Math.floor(index / GRID_COLS)}
					{@const x = START_X + col * GRID_SPACING}
					{@const y = START_Y + row * GRID_SPACING + 50}

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
								animationName={item.animation}
								loop={true}
								timeScale={1}
							/>
						</SpineProvider>

						<!-- Item name label -->
						<Text
							x={0}
							y={ITEM_SIZE/2 + 15}
							anchor={{ x: 0.5, y: 0 }}
							text={item.name}
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
