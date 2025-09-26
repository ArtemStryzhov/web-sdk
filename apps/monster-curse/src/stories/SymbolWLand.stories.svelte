<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Symbols/W Symbol - Land State',
		parameters: {
			layout: 'fullscreen',
		},
	});
</script>

<script lang="ts">
	import { Container, Sprite, SpineProvider, SpineTrack, Text } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';
	import { SYMBOL_SIZE } from '../game/constants';
	import { SYMBOL_CONFIGS } from '../config/symbolConfig';

	import assets from '../game/assets';

	// W symbol configuration
	const wConfig = SYMBOL_CONFIGS.w;
	const symbolSize = SYMBOL_SIZE;

	// Filter layers for land state (alwaysVisible + land state layers)
	const landStateLayers = wConfig.backgroundLayers.filter(layer =>
		layer.alwaysVisible || (layer.visibleInStates && layer.visibleInStates.includes('land'))
	);
</script>

<Story name="W Symbol Land State">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container>
				<!-- Title -->
				<Text
					x={400}
					y={50}
					anchor={{ x: 0.5, y: 0 }}
					text="W Symbol - Land State"
					style={{
						fontFamily: 'Arial',
						fontSize: 24,
						fill: 0xffffff,
						fontWeight: 'bold',
					}}
				/>

				<!-- W Symbol Container -->
				<Container x={400} y={300}>
					<!-- Background layers (land state) -->
					{#each [...landStateLayers].sort((a, b) => a.zIndex - b.zIndex) as layer, index (`${layer.spineKey || layer.key}_${index}`)}
						{#if layer.spineKey}
							<!-- Animated spine layer -->
							<SpineProvider
								key={layer.spineKey}
								x={0}
								y={0}
								anchor={0.5}
								height={symbolSize * layer.sizeMultiplier}
								alpha={layer.alpha ?? 1}
								zIndex={layer.zIndex}
							>
								<SpineTrack
									trackIndex={0}
									animationName={layer.animationName!}
									loop={true}
									timeScale={1}
								/>
							</SpineProvider>
						{:else if layer.key}
							<!-- Static sprite layer -->
							<Sprite
								anchor={0.5}
								key={layer.key}
								width={symbolSize * layer.sizeMultiplier}
								height={symbolSize * layer.sizeMultiplier}
								alpha={layer.alpha ?? 1}
								zIndex={layer.zIndex}
							/>
						{/if}
					{/each}

					<!-- Main W symbol sprite (static) -->
					<Sprite
						anchor={0.5}
						key="w.png"
						width={symbolSize * 0.7}
						height={symbolSize * 0.7}
						zIndex={10}
					/>
				</Container>

				<!-- Animation Info -->
				<Container x={50} y={150}>
					<Text
						x={0}
						y={0}
						text="Land State Animation:"
						style={{
							fontFamily: 'Arial',
							fontSize: 18,
							fill: 0x00aaff,
							fontWeight: 'bold',
						}}
					/>
					<Text
						x={0}
						y={30}
						text="• Static W sprite (w.png)"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xffffff,
						}}
					/>
					<Text
						x={0}
						y={50}
						text="• Only bg_crystal.png background"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xffffff,
						}}
					/>
					<Text
						x={0}
						y={80}
						text="Land state = Static state (with static electric cloud)"
						style={{
							fontFamily: 'Arial',
							fontSize: 12,
							fill: 0xcccccc,
							fontStyle: 'italic',
						}}
					/>
				</Container>

				<!-- Layer Details -->
				<Container x={50} y={300}>
					<Text
						x={0}
						y={0}
						text="Layer Configuration:"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0x00aaff,
							fontWeight: 'bold',
						}}
					/>
					{#each landStateLayers as layer, index}
						<Text
							x={0}
							y={30 + index * 25}
							text="• {layer.spineKey || layer.key}: {layer.animationName || 'static'} (z:{layer.zIndex})"
							style={{
								fontFamily: 'Arial',
								fontSize: 12,
								fill: 0xffffff,
							}}
						/>
					{/each}
					<Text
						x={0}
						y={30 + landStateLayers.length * 25}
						text="• W: w.png sprite (z:10)"
						style={{
							fontFamily: 'Arial',
							fontSize: 12,
							fill: 0xffffff,
						}}
					/>
				</Container>

				<!-- State Comparison -->
				<Container x={50} y={450}>
					<Text
						x={0}
						y={0}
						text="State Comparison:"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0x00aaff,
							fontWeight: 'bold',
						}}
					/>
					<Text
						x={0}
						y={30}
						text="• Static: w.png sprite + bg_crystal.png"
						style={{
							fontFamily: 'Arial',
							fontSize: 12,
							fill: 0xffffff,
						}}
					/>
					<Text
						x={0}
						y={50}
						text="• Land: w.png sprite + bg_crystal.png + static electric cloud"
						style={{
							fontFamily: 'Arial',
							fontSize: 12,
							fill: 0xffffff,
						}}
					/>
					<Text
						x={0}
						y={70}
						text="• Win: w.png sprite + bg_crystal.png + magic rings + electric cloud (no scaling)"
						style={{
							fontFamily: 'Arial',
							fontSize: 12,
							fill: 0xffffff,
						}}
					/>
				</Container>
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>
