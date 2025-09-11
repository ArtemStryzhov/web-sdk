<script lang="ts">
	import { Sprite, Container } from 'pixi-svelte';
	import { onMount, onDestroy } from 'svelte';

	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import type { RawSymbol, SymbolState } from '../game/types';
	import { getSymbolConfig, getSymbolLayers, getActiveAnimations } from '../config/symbolConfig';
	import { AnimationSystem } from '../systems/AnimationSystem';
	import type { AnimationState } from '../systems/AnimationSystem';

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
	const symbolLayers = $derived(getSymbolLayers(props.rawSymbol.name, props.state));
	
	// Animation system
	let animationSystem: AnimationSystem | null = null;
	let layerStates = $state<AnimationState>({});

	// Initialize layer states
	const initializeLayerStates = () => {
		if (!symbolConfig) return;

		const newStates: AnimationState = {};
		
		// Initialize background layers
		symbolConfig.backgroundLayers.forEach(layer => {
			newStates[layer.key] = {
				scale: 1,
				alpha: layer.alpha || 1,
				visible: layer.alwaysVisible || (layer.visibleInStates?.includes(props.state) ?? false),
			};
		});

		// Initialize main symbol
		newStates[symbolConfig.baseSprite] = {
			scale: 1,
			alpha: 1,
			visible: true,
		};

		layerStates = newStates;
	};

	// Update layer state callback
	const updateLayerState = (layerKey: string, newState: any) => {
		layerStates = {
			...layerStates,
			[layerKey]: newState,
		};
	};

	// Start animations based on current state
	const handleStateChange = () => {
		if (!symbolConfig || !animationSystem) return;

		const activeAnimations = getActiveAnimations(props.rawSymbol.name, props.state);
		
		// Stop all current animations
		animationSystem?.stopAllAnimations();

		// Start new animations
		activeAnimations.forEach(animation => {
			const shouldStart = props.loop || animation.triggerStates.includes(props.state);
			if (shouldStart) {
				animationSystem?.startAnimation(animation, layerStates);
			}
		});
	};

	onMount(() => {
		initializeLayerStates();
		
		// Initialize animation system
		animationSystem = new AnimationSystem(updateLayerState);
		
		// Handle initial state
		handleStateChange();
		
		props.oncomplete?.();
	});

	onDestroy(() => {
		if (animationSystem) {
			animationSystem.destroy();
		}
	});

	// React to state changes only (avoid infinite loops by checking if state actually changed)
	let previousState = props.state;
	$effect(() => {
		if (symbolConfig && animationSystem && props.state !== previousState) {
			previousState = props.state;
			handleStateChange();
		}
	});
</script>

<Container x={props.x} y={props.y}>
	{#if symbolConfig}
		<!-- Render background layers (only for non-scatter symbols) -->
		{#if !isScatter}
			{#each symbolLayers as layer}
				{@const layerState = layerStates[layer.key]}
				{#if layerState?.visible}
					<Sprite
						anchor={0.5}
						key={layer.key}
						width={SYMBOL_SIZE * layer.sizeMultiplier * layerState.scale}
						height={SYMBOL_SIZE * layer.sizeMultiplier * layerState.scale}
						alpha={layerState.alpha}
					/>
				{/if}
			{/each}
		{/if}

		<!-- Render main symbol -->
		{@const mainSymbolState = layerStates[symbolConfig.baseSprite]}
		{#if mainSymbolState?.visible}
			<Sprite
				anchor={0.5}
				key={symbolConfig.baseSprite}
				width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width * mainSymbolState.scale}
				height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height * mainSymbolState.scale}
				alpha={mainSymbolState.alpha}
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
</Container>
