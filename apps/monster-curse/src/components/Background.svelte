<script lang="ts">
	import { Rectangle, SpineProvider, SpineTrack, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { randomInteger } from 'utils-shared/random';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	
	// Determine layout type for background selection
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const isPortrait = $derived(layoutType === 'portrait');
	
	// Background layout props - show as much of the image as possible
	// Desktop image: 3840x2160, Portrait: 750x1280
	// Strategy: Use "contain" fit to show full image, then scale up slightly (5%) to minimize letterboxing
	const canvasSize = $derived(context.stateLayoutDerived.canvasSizes());
	
	// Image dimensions - layout-specific
	const imageDimensions = $derived(() => {
		if (isPortrait) {
			return { width: 750, height: 1280 }; // Portrait dimensions
		}
		return { width: 3840, height: 2160 }; // Desktop dimensions
	});
	
// Calculate scale to fill canvas completely (no black bars)
// Use the larger scale (cover) and add a slight overscan to avoid gaps
const backgroundScale = $derived(() => {
	const img = imageDimensions();
	const canvas = canvasSize;

	// Calculate scale for width and height separately
	const scaleWidth = canvas.width / img.width;
	const scaleHeight = canvas.height / img.height;

	// Use the larger scale to ensure full coverage, add 5% overscan
	const scale = Math.max(scaleWidth, scaleHeight) * 1.05;
	return scale;
});
	
	// Apply scale directly to image dimensions to fill canvas width
	// This ensures no side letterboxes, may crop top/bottom if aspect ratios differ
	const backgroundProps = $derived(() => {
		const scale = backgroundScale();
		return {
			x: canvasSize.width / 2,
			y: canvasSize.height / 2,
			width: imageDimensions().width * scale,
			height: imageDimensions().height * scale,
			anchor: { x: 0.5, y: 0.5 },
		};
	});
	// Track game type for background switching
	const isFeatureGame = $derived(context.stateGame.gameType === 'freegame');
	// Background asset keys - switch between base and feature backgrounds
	const backgroundKey = $derived(() => {
		const layoutSuffix = isPortrait ? 'Portrait' : 'Desktop';
		const prefix = isFeatureGame ? 'backgroundFeature' : 'background';
		return `${prefix}${layoutSuffix}`;
	});
	
	// Foreground animation key - switch between base and feature animations
	const foregroundKey = $derived(isFeatureGame ? 'foregroundFeatureAnimation' : 'foregroundAnimation');


	// Random rune positions - generate on mount
	let runePositions = $state<Array<{x: number, y: number, delay: number}>>([]);
	
	onMount(() => {
		const canvasSize = context.stateLayoutDerived.canvasSizes();
		const numRunes = 5; // Increased number of random rune instances
		const padding = 50; // Reduced padding for more spread
		
		runePositions = Array.from({ length: numRunes }, () => ({
			x: randomInteger({ min: padding, max: canvasSize.width - padding }),
			y: randomInteger({ min: padding, max: canvasSize.height - padding }),
			delay: randomInteger({ min: 0, max: 10 }) // Random animation delay in seconds
		}));
	});
	
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x000000} zIndex={-3} />

<!-- Base Game Background -->
<FadeContainer show={true} duration={SECOND} zIndex={-2}>
	<!-- Static Background Layer (responsive) -->
	<Sprite key={backgroundKey()} {...backgroundProps()} zIndex={-2} />
	
	<!-- Dust Effects Layer -->
	<SpineProvider 
		key={foregroundKey} 
		x={400}
		y={300}
		width={800}
		height={600}
		scale={0.8}
		zIndex={8}
	>
		<SpineTrack trackIndex={1} animationName={'dust'} loop />
	</SpineProvider>
	
	<!-- Random Runes Layers - Multiple instances at random positions -->
	{#each runePositions as position, i}
		<SpineProvider 
			key={foregroundKey} 
			x={position.x}
			y={position.y}
			width={600}
			height={600}
			scale={0.9}
			zIndex={10 + i}
		>
			<SpineTrack 
				trackIndex={0} 
				animationName="idle" 
				loop 
				timeScale={0.7 + (i * 0.15)}
			/>
		</SpineProvider>
	{/each}
</FadeContainer>

