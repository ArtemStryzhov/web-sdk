<script lang="ts">
	import { Sprite, Container, Graphics } from 'pixi-svelte';
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import { stateBetDerived } from 'state-shared';

	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import type { RawSymbol, SymbolState } from '../game/types';
	import { getSymbolConfig } from '../config/symbolConfig';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		rawSymbol: RawSymbol;
		state: SymbolState;
		loop?: boolean;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const isScatter = $derived(props.rawSymbol.scatter === true);

	// Get symbol configuration
	const symbolConfig = $derived(getSymbolConfig(props.rawSymbol.name));

	onMount(() => {
		props.oncomplete?.();
	});
</script>

<Container x={props.x} y={props.y}>
	{#if symbolConfig}
		<!-- Render background layers (only for non-scatter symbols) -->
		{#if !isScatter}
			{#each [...symbolConfig.backgroundLayers].sort((a, b) => a.zIndex - b.zIndex) as layer, index (`${layer.spineKey || layer.key}_${index}`)}
				{@const isVisible = layer.alwaysVisible || (layer.visibleInStates && layer.visibleInStates.includes(props.state))}
				{#if isVisible}
					{#if layer.spineKey}
						<!-- Animated spine layer -->
						<SpineProvider
							key={layer.spineKey}
							x={0}
							y={0}
							anchor={0.5}
							width={SYMBOL_SIZE * layer.sizeMultiplier}
							height={SYMBOL_SIZE * layer.sizeMultiplier}
							alpha={layer.alpha ?? 1}
							zIndex={layer.zIndex}
						>
							<SpineTrack
								trackIndex={0}
								animationName={layer.animationName}
								loop={layer.loop ?? false}
								timeScale={stateBetDerived.timeScale()}
							/>
						</SpineProvider>
					{:else if layer.key}
						<!-- Static sprite layer -->
						<Sprite
							anchor={0.5}
							key={layer.key}
							width={SYMBOL_SIZE * layer.sizeMultiplier}
							height={SYMBOL_SIZE * layer.sizeMultiplier}
							alpha={layer.alpha ?? 1}
							zIndex={layer.zIndex}
						/>
					{/if}
				{/if}
			{/each}
		{/if}

		<!-- Render main symbol using static sprite assets -->
		<Sprite
			anchor={0.5}
			key={props.symbolInfo.assetKey}
			width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
			height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
			zIndex={10}
		/>
	{:else}
		<!-- Fallback for symbols without configuration -->
		<Sprite
			anchor={0.5}
			key={props.symbolInfo.assetKey}
			width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
			height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
		/>
	{/if}
</Container>
