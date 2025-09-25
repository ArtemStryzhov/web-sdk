<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Debug/H1 Symbol HTML Overlay',
		parameters: {
			layout: 'fullscreen',
		},
	});
</script>

<script lang="ts">
	import { Container, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';
	import { SYMBOL_SIZE } from '../game/constants';
	import { SYMBOL_CONFIGS } from '../config/symbolConfig';

	import assets from '../game/assets';

	// H1 symbol configuration
	const h1Config = SYMBOL_CONFIGS.h1;
	const symbolSize = SYMBOL_SIZE;

	// Filter layers for win state
	const winStateLayers = h1Config.backgroundLayers.filter(layer => 
		layer.alwaysVisible || (layer.visibleInStates && layer.visibleInStates.includes('win'))
	);

	console.log('H1 Win State Layers:', winStateLayers);
</script>

<Story name="H1 Symbol HTML Overlay">
	{#snippet template()}
		<div style="position: relative; width: 100vw; height: 100vh; background: #1a1a1a;">
			<!-- Pixi Canvas -->
			<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
				<StoryPixiApp {assets}>
					<Container x={400} y={300}>
						<!-- Background layers (only those visible in win state) -->
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
										animationName={layer.animationName}
										loop={layer.loop ?? false}
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

						<!-- Main H1 symbol -->
						<Sprite
							anchor={0.5}
							key="h1.png"
							width={symbolSize * 0.7}
							height={symbolSize * 0.7}
							zIndex={10}
						/>
					</Container>
				</StoryPixiApp>
			</div>

			<!-- HTML Overlay for inspection -->
			<div style="position: absolute; top: 200px; left: 300px; width: 200px; height: 200px; pointer-events: none;">
				<!-- Background layers as HTML elements -->
				{#each [...winStateLayers].sort((a, b) => a.zIndex - b.zIndex) as layer, index}
					<div 
						class="html-layer"
						style="
							position: absolute;
							width: {symbolSize * layer.sizeMultiplier}px;
							height: {symbolSize * layer.sizeMultiplier}px;
							left: 50%;
							top: 50%;
							transform: translate(-50%, -50%);
							background: rgba(255, 0, 0, 0.3);
							border: 2px solid #ff0000;
							z-index: {layer.zIndex};
							opacity: {layer.alpha ?? 1};
						"
						data-layer-type="{layer.spineKey ? 'spine' : 'sprite'}"
						data-layer-key="{layer.spineKey || layer.key}"
						data-animation="{layer.animationName || 'none'}"
						data-size-multiplier="{layer.sizeMultiplier}"
						data-z-index="{layer.zIndex}"
					>
						<div style="
							position: absolute;
							top: 2px;
							left: 2px;
							font-size: 10px;
							color: white;
							background: rgba(0,0,0,0.8);
							padding: 2px;
							border-radius: 2px;
							white-space: nowrap;
						">
							{layer.spineKey || layer.key}<br/>
							{layer.animationName || 'static'}<br/>
							z:{layer.zIndex} s:{layer.sizeMultiplier}
						</div>
					</div>
				{/each}

				<!-- Main symbol HTML representation -->
				<div 
					class="html-symbol"
					style="
						position: absolute;
						width: {symbolSize * 0.7}px;
						height: {symbolSize * 0.7}px;
						left: 50%;
						top: 50%;
						transform: translate(-50%, -50%);
						background: rgba(0, 255, 0, 0.3);
						border: 2px solid #00ff00;
						z-index: 10;
					"
					data-symbol="h1"
					data-state="win"
				>
					<div style="
						position: absolute;
						top: 2px;
						left: 2px;
						font-size: 10px;
						color: white;
						background: rgba(0,0,0,0.8);
						padding: 2px;
						border-radius: 2px;
					">
						H1 Symbol<br/>
						WIN State<br/>
						z:10 s:0.7
					</div>
				</div>
			</div>

			<!-- Debug Info Panel -->
			<div style="
				position: absolute;
				top: 20px;
				right: 20px;
				background: rgba(0,0,0,0.9);
				color: white;
				padding: 15px;
				border-radius: 5px;
				font-family: monospace;
				font-size: 12px;
				max-width: 300px;
			">
				<h3 style="margin: 0 0 10px 0; color: #00aaff;">H1 Symbol Debug Info</h3>
				<div><strong>State:</strong> WIN</div>
				<div><strong>Symbol Size:</strong> {symbolSize}px</div>
				<div><strong>Win State Layers:</strong> {winStateLayers.length}</div>
				<hr style="margin: 10px 0; border: 1px solid #333;">
				{#each winStateLayers as layer, index}
					<div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 3px;">
						<div><strong>Layer {index + 1}:</strong></div>
						<div>Key: {layer.spineKey || layer.key}</div>
						{#if layer.animationName}
							<div>Animation: {layer.animationName}</div>
						{/if}
						<div>Size: {layer.sizeMultiplier}x</div>
						<div>Z-Index: {layer.zIndex}</div>
						<div>Loop: {layer.loop ?? false}</div>
						{#if layer.visibleInStates}
							<div>States: {layer.visibleInStates.join(', ')}</div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Instructions -->
			<div style="
				position: absolute;
				bottom: 20px;
				left: 20px;
				background: rgba(0,0,0,0.9);
				color: white;
				padding: 15px;
				border-radius: 5px;
				font-family: Arial, sans-serif;
				font-size: 14px;
				max-width: 400px;
			">
				<h4 style="margin: 0 0 10px 0; color: #ffaa00;">🔍 Inspection Guide</h4>
				<div style="margin: 5px 0;"><strong>Red boxes:</strong> Background layers</div>
				<div style="margin: 5px 0;"><strong>Green box:</strong> Main H1 symbol</div>
				<div style="margin: 5px 0;"><strong>Right-click → Inspect:</strong> Check HTML structure</div>
				<div style="margin: 5px 0;"><strong>Data attributes:</strong> All layer info available</div>
				<div style="margin: 10px 0 5px 0; color: #aaa;">HTML overlay positioned at (300, 200) to match Pixi container at (400, 300)</div>
			</div>
		</div>
	{/snippet}
</Story>

<style>
	.html-layer, .html-symbol {
		box-sizing: border-box;
	}
	
	.html-layer:hover, .html-symbol:hover {
		background: rgba(255, 255, 0, 0.5) !important;
		border-color: #ffff00 !important;
	}
</style>
