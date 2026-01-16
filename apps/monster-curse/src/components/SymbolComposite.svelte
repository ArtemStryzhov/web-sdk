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
	import BSymbolAnimation from './BSymbolAnimation.svelte';

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
	
	// Generate unique key for this symbol position + state (allows animation in both land and win states)
	const symbolPositionKey = $derived(`${props.x}_${props.y}_${props.rawSymbol.name}_${props.state}`);

	// Get symbol configuration
	const symbolConfig = $derived(getSymbolConfig(props.rawSymbol.name));
	
	// Pre-compute sorted and visible layers to avoid recalculation in template
	const sortedLayers = $derived(
		symbolConfig ? [...symbolConfig.backgroundLayers].sort((a, b) => a.zIndex - b.zIndex) : []
	);
	
	const visibleLayers = $derived.by(() => {
		const layers = sortedLayers.filter(layer => layer.alwaysVisible || (layer.visibleInStates && layer.visibleInStates.includes(props.state)));
		
		// Remove duplicate B_animation layers - keep only the first one
		let bAnimationFound = false;
		return layers.filter(layer => {
			if (layer.spineKey === 'B_animation') {
				if (bAnimationFound) {
					return false;
				}
				bAnimationFound = true;
			}
			return true;
		});
	});
	
	// Check if B_animation layer is visible for current state
	const hasBAnimationVisible = $derived(
		visibleLayers.some(layer => layer.spineKey === 'B_animation')
	);

	// Track spine animation completion
	let hasCompleted = $state(false);
	
	// Stable listener object to prevent recreation on each render
	const spineListener = {
		complete: () => {
			if (!hasCompleted) {
				hasCompleted = true;
				props.oncomplete?.();
			}
		}
	};

	onMount(() => {
		// Complete immediately to prevent game from getting stuck - ALL symbols must complete
		props.oncomplete?.();
	});
</script>

<Container x={props.x} y={props.y} zIndex={props.state === 'win' ? 1000 : 0}>
	{#if symbolConfig}
		<!-- Render static sprite layers -->
		{#each visibleLayers as layer, idx (`sprite_${idx}_${layer.key ?? layer.spineKey ?? layer.zIndex}`)}
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
		{#each visibleLayers as layer, index (`spine_${index}_${layer.spineKey ?? layer.zIndex}`)}
			{#if layer.spineKey}
				{@const context = getContextApp()}
				{@const spineData = context.stateApp.loadedAssets?.[layer.spineKey]}
				{@const isBAnimation = layer.spineKey === 'B_animation'}
				{#if spineData}
					{#if isBAnimation}
						<BSymbolAnimation
							sizeMultiplier={layer.sizeMultiplier}
							zIndex={layer.zIndex}
							positionKey={symbolPositionKey}
							state={props.state}
							oncomplete={index === 0 ? spineListener.complete : undefined}
						/>
					{:else}
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
								loop={layer.loop ?? false}
								timeScale={stateBetDerived.timeScale()}
								listener={index === 0 ? spineListener : undefined}
							/>
						</SpineProvider>
					{/if}
				{/if}
			{/if}
		{/each}

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
		{:else if !hasBAnimationVisible}
			<!-- Regular symbol rendering - hide base sprite when B_animation is visible -->
			{@const isB = props.rawSymbol.name === 'B'}
			{@const shouldIncreaseSize = isB && ['static', 'spin', 'postWinStatic'].includes(props.state)}
			{@const baseSizeMultiplier = shouldIncreaseSize ? 1.2 : 1}
			{@const sizeMultiplier = isB ? baseSizeMultiplier * 1.05 : baseSizeMultiplier}
			{@const xOffset = isB ? -(SYMBOL_SIZE * 0.02) : 0}
			{@const yOffset = isB ? (SYMBOL_SIZE * 0.03) : 0}
			<Sprite
				anchor={0.5}
				key={props.symbolInfo.assetKey}
				x={xOffset}
				y={yOffset}
				width={SYMBOL_SIZE * (props.symbolInfo.sizeRatios?.width ?? 1) * sizeMultiplier}
				height={SYMBOL_SIZE * (props.symbolInfo.sizeRatios?.height ?? 1) * sizeMultiplier}
				zIndex={10}
			/>
		{/if}
	{:else}
		<!-- Fallback for symbols without configuration -->
		{@const isB = props.rawSymbol.name === 'B'}
		{@const shouldIncreaseSize = isB && ['static', 'spin', 'postWinStatic'].includes(props.state)}
		{@const baseSizeMultiplier = shouldIncreaseSize ? 1.2 : 1}
		{@const sizeMultiplier = isB ? baseSizeMultiplier * 1.05 : baseSizeMultiplier}
		{@const xOffset = isB ? -(SYMBOL_SIZE * 0.02) : 0}
		{@const yOffset = isB ? (SYMBOL_SIZE * 0.03) : 0}
		<Sprite
			anchor={0.5}
			key={props.symbolInfo.assetKey}
			x={xOffset}
			y={yOffset}
			width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width * sizeMultiplier}
			height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height * sizeMultiplier}
		/>
	{/if}

	<!-- tumble frame (payframe) - now rendered in Payframes.svelte component -->
</Container>
