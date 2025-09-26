<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Symbols/W Symbol - Win State',
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

	// Filter layers for win state
	const winStateLayers = wConfig.backgroundLayers.filter(layer =>
		layer.alwaysVisible || (layer.visibleInStates && layer.visibleInStates.includes('win'))
	);
</script>

<Story name="W Symbol Win State">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container>
				<!-- Title -->
				<Text
					x={400}
					y={50}
					anchor={{ x: 0.5, y: 0 }}
					text="W Symbol - Win State"
					style={{
						fontFamily: 'Arial',
						fontSize: 24,
						fill: 0xffffff,
						fontWeight: 'bold',
					}}
				/>

				<!-- W Symbol Container -->
				<Container x={400} y={300}>
					<!-- Test magic ring as spine asset -->
					<SpineProvider
						key="W"
						x={-100}
						y={0}
						width={100}
						height={100}
					>
						<SpineTrack
							trackIndex={0}
							animationName="magic_ring_spin"
							loop
						/>
					</SpineProvider>
					<!-- Background layers (win state) -->
					{#each [...winStateLayers].sort((a, b) => a.zIndex - b.zIndex) as layer, index (`${layer.spineKey || layer.key}_${index}`)}
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

					<!-- Main W symbol sprite -->
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
						text="Win State Animations:"
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
						text="• Magic Ring Spin (zIndex: 4)"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xffffff,
						}}
					/>
					<Text
						x={0}
						y={50}
						text="• Electric Cloud Pink Spin (zIndex: 5)"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xffffff,
						}}
					/>
					<Text
						x={0}
						y={80}
						text="Both animations loop in Storybook (no scaling)"
						style={{
							fontFamily: 'Arial',
							fontSize: 12,
							fill: 0xcccccc,
							fontStyle: 'italic',
						}}
					/>
					<Text
						x={0}
						y={100}
						text="Debug: Check console for magic ring loading"
						style={{
							fontFamily: 'Arial',
							fontSize: 10,
							fill: 0xff0000,
							fontStyle: 'italic',
						}}
					/>
				</Container>

				<!-- Layer Details -->
				<Container x={50} y={400}>
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
					{#each winStateLayers as layer, index}
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
				</Container>
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>
