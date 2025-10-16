<script lang="ts">
	import { Sprite, Container, getContextApp } from 'pixi-svelte';
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { onMount } from 'svelte';
	import { stateBetDerived } from 'state-shared';

	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import type { RawSymbol, SymbolState } from '../game/types';
	import { getSymbolConfig } from '../config/symbolConfig';
	import { getContext } from '../game/context';
	import SymbolWAnimated from './SymbolWAnimated.svelte';

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

	// Track spine animation completion
	let pendingCompletions = $state(0);
	let hasCompleted = $state(false);

	function handleSpineComplete() {
		// Complete immediately for all symbols to prevent hanging
		if (!hasCompleted) {
			hasCompleted = true;
			props.oncomplete?.();
		}
	}

	onMount(() => {
		// Complete immediately to prevent game from getting stuck - ALL symbols must complete
		props.oncomplete?.();
	});
</script>

<Container x={props.x} y={props.y} zIndex={props.state === 'win' ? 1000 : 0}>
	{#if symbolConfig}
		<!-- Render background layers for all symbols -->
		{#if true}
			{@const sortedLayers = [...symbolConfig.backgroundLayers].sort((a, b) => a.zIndex - b.zIndex)}
			{@const visibleLayers = sortedLayers.filter(layer => layer.alwaysVisible || (layer.visibleInStates && layer.visibleInStates.includes(props.state)))}
			

			<!-- Render static sprite layers -->
			{#each visibleLayers as layer}
				{#if layer.key}
					<Sprite
						anchor={0.5}
						key={layer.key}
						width={SYMBOL_SIZE * layer.sizeMultiplier}
						height={SYMBOL_SIZE * layer.sizeMultiplier}
						alpha={layer.alpha ?? 1}
						zIndex={layer.zIndex}
					/>
				{/if}
			{/each}

			<!-- Render individual spine layers -->
			{#each visibleLayers as layer, index}
				{#if layer.spineKey}
					<!-- Use unique key for Svelte reactivity but correct spineKey for asset loading -->
					{@const context = getContextApp()}
					{@const spineData = context.stateApp.loadedAssets?.[layer.spineKey]}
					{#if spineData}
						{#key `${layer.spineKey}_${layer.animationName}_${index}`}
							<SpineProvider
								key={layer.spineKey}
								x={0}
								y={0}
								anchor={0.5}
								height={SYMBOL_SIZE * layer.sizeMultiplier}
								alpha={layer.alpha ?? 1}
								zIndex={layer.zIndex}
							>
								<SpineTrack
									trackIndex={0}
									animationName={layer.animationName!}
									loop={props.loop ?? layer.loop ?? false}
									timeScale={stateBetDerived.timeScale()}
									listener={{
										complete: index === 0 ? handleSpineComplete : undefined // Only the first spine layer handles completion
									}}
								/>
							</SpineProvider>
						{/key}
					{:else}
						<!-- Spine asset not loaded, skip this layer -->
					{/if}
				{/if}
			{/each}
		{/if}

		<!-- Render main symbol -->
		{#if props.rawSymbol.name === 'W' && props.state === 'win'}
			<!-- W symbol with scaling animation in win state -->
			<SymbolWAnimated
				x={0}
				y={0}
				symbolInfo={props.symbolInfo}
				rawSymbol={props.rawSymbol}
				state={props.state}
			/>
		{:else}
			<!-- Regular symbol rendering -->
			<Sprite
				anchor={0.5}
				key={props.symbolInfo.assetKey}
				width={SYMBOL_SIZE * (props.symbolInfo.sizeRatios?.width ?? 1)}
				height={SYMBOL_SIZE * (props.symbolInfo.sizeRatios?.height ?? 1)}
				zIndex={10}
			/>
		{/if}
	{:else}
		<!-- Fallback for symbols without configuration -->
		<Sprite
			anchor={0.5}
			key={props.symbolInfo.assetKey}
			width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
			height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
		/>
	{/if}

	<!-- tumble frame (payframe) - now rendered in Payframes.svelte component -->
</Container>
