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
	
	// Background layout props - use appropriate layout for device orientation
	const backgroundProps = $derived(() => {
		return isPortrait 
			? context.stateLayoutDerived.portraitBackgroundLayout({ scale: 0.5 })
			: context.stateLayoutDerived.normalBackgroundLayout({ scale: 0.5 });
	});
	
	// Background asset keys based on layout (base game only)
	const backgroundKey = $derived(() => {
		const layoutSuffix = isPortrait ? 'Portrait' : 'Desktop';
		return `background${layoutSuffix}`;
	});

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
	<Sprite key={backgroundKey()} {...backgroundProps} zIndex={-2} />
	
	<!-- Dust Effects Layer -->
	<SpineProvider 
		key="foregroundAnimation" 
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
			key="foregroundAnimation" 
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

