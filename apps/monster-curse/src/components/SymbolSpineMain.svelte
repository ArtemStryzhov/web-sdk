<script lang="ts">
	import { SpineProvider, SpineTrack, Graphics, Container, type SpineTrackProps } from 'pixi-svelte';
	import * as PIXI from 'pixi.js';
	import { stateBetDerived } from 'state-shared';

	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';

	type Props = {
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		x?: number;
		y?: number;
		listener: SpineTrackProps['listener'];
		loop?: boolean;
	};

	let spineProvider = $state<SpineProvider>();
	let revealProgress = $state(0);
	let hasAnimated = $state(false);

	const props: Props = $props();

	// Mask drawing function for S symbol
	function drawMask(graphics: PIXI.Graphics) {
		const spineHeight = 585; // Full height of the S symbol spine
		const initialVisibleHeight = 200; // Bottom 200px visible initially
		
		if (props.symbolInfo?.assetKey === 'S' && props.symbolInfo.animationName === 'sword_expanding') {
			// Calculate current visible height based on reveal progress
			const currentVisibleHeight = initialVisibleHeight + (spineHeight - initialVisibleHeight) * revealProgress;
			
			// Position mask so bottom is at origin (0,0) and grows upward
			// Since anchor is 0.5, the spine center is at y=0
			// Bottom of spine is at y=spineHeight/2
			// Top of spine is at y=-spineHeight/2
			const maskBottom = spineHeight / 2;
			const maskTop = maskBottom - currentVisibleHeight;
			
			graphics.rect(-150, maskTop, 300, currentVisibleHeight);
			graphics.fill(0xffffff);
			
			console.log('🎯 Mask drawn:', {
				revealProgress,
				currentVisibleHeight,
				maskTop,
				maskBottom,
				rectHeight: currentVisibleHeight
			});
		}
	}

	// Animate reveal for S symbol - trigger immediately when in win state
	$effect(() => {
		if (props.symbolInfo?.assetKey === 'S' && props.symbolInfo.animationName === 'sword_expanding' && !hasAnimated) {
			hasAnimated = true;
			console.log('🎯 Starting S symbol reveal animation', {
				assetKey: props.symbolInfo.assetKey,
				animationName: props.symbolInfo.animationName,
				hasAnimated
			});

			revealProgress = 0; // Start with cropped view

			// Animate reveal progress over 0.8 seconds
			const startTime = Date.now();
			const duration = 800;

			const animate = () => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);
				revealProgress = progress;

				console.log('🎯 Animation progress:', {
					elapsed,
					progress,
					revealProgress
				});

				if (progress < 1) {
					requestAnimationFrame(animate);
				} else {
					console.log('🎯 S symbol reveal animation completed');
				}
			};

			requestAnimationFrame(animate);

			// Reset after animation completes
			setTimeout(() => {
				hasAnimated = false;
				revealProgress = 0;
				// Animation completed - mask should already be set to full size by the mask update logic
			}, 1000);
		}
	});


	// Reset animation flag when leaving win state
	$effect(() => {
		if (props.symbolInfo?.animationName !== 'sword_expanding') {
			hasAnimated = false;
			revealProgress = 0;
		}
	});
</script>

	{#if props.symbolInfo}
	<!-- Debug info -->
	{@const debugInfo = {
		assetKey: props.symbolInfo.assetKey,
		animationName: props.symbolInfo.animationName,
		sizeRatios: props.symbolInfo.sizeRatios,
		width: props.symbolInfo.sizeRatios?.width ? props.symbolInfo.sizeRatios.width : SYMBOL_SIZE,
		height: props.symbolInfo.sizeRatios?.height ? props.symbolInfo.sizeRatios.height : SYMBOL_SIZE
	}}
	{@const isS = props.symbolInfo.assetKey === 'S'}

	{#if isS}
		{@const _ = console.log('S Symbol Debug:', debugInfo)}
		{@const isExpanding = props.symbolInfo.animationName === 'sword_expanding'}

		<!-- Container with mask for S symbol -->
		<Container x={props.x} y={props.y}>
			<!-- Mask that crops and grows -->
			{#if isExpanding}
				<Graphics draw={drawMask} isMask={true} />
			{/if}
			
			<SpineProvider
				key={props.symbolInfo.assetKey}
				anchor={0.5}
				width={props.symbolInfo.sizeRatios?.width ? props.symbolInfo.sizeRatios.width : SYMBOL_SIZE}
				height={props.symbolInfo.sizeRatios?.height ? props.symbolInfo.sizeRatios.height : SYMBOL_SIZE}
				bind:this={spineProvider}
			>
				<SpineTrack
					loop={props.loop}
					trackIndex={0}
					animationName={props.symbolInfo.animationName}
					timeScale={stateBetDerived.timeScale()}
					listener={{
						...props.listener,
						start: (entry) => {
							console.log('Spine animation started:', entry.animation.name, 'for symbol:', props.symbolInfo.assetKey);
							console.log('🎯 Initial state:', { revealProgress, isExpanding });
							props.listener?.start?.(entry);
						},
						complete: (entry) => {
							props.listener?.complete?.(entry);
						}
					}}
					autoplay={true}
				/>
			</SpineProvider>
		</Container>
	{:else}
		<SpineProvider
			x={props.x}
			y={props.y}
			key={props.symbolInfo.assetKey}
			anchor={0.5}
			width={props.symbolInfo.sizeRatios?.width ? props.symbolInfo.sizeRatios.width : SYMBOL_SIZE}
			height={props.symbolInfo.sizeRatios?.height ? props.symbolInfo.sizeRatios.height : SYMBOL_SIZE}
		>
			<SpineTrack
				loop={props.loop}
				trackIndex={0}
				animationName={props.symbolInfo.animationName}
				timeScale={stateBetDerived.timeScale()}
				listener={props.listener}
				autoplay={true}
			/>
		</SpineProvider>
	{/if}
{/if}
