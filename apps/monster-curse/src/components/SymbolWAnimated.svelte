<script lang="ts">
	import { Sprite, Container } from 'pixi-svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import type { RawSymbol, SymbolState } from '../game/types';
	import { getSymbolInfo } from '../game/utils';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		rawSymbol: RawSymbol;
		state: SymbolState;
	};

	const props: Props = $props();
	let containerRef: any;
	let currentScale = $state(1.0);


	// Use effect to watch for state changes and trigger animation
	$effect(() => {
		let animationFrameId: number | null = null;
		
		if (props.state === 'win') {
			// Create scaling animation similar to electric_cloud_pink
			const startScale = 1.0;
			const maxScale = 1.5;
			const endScale = 1.0;
			const duration = 1900; // 1.9 seconds
			const peakTime = 1200; // 1.2 seconds
			
			const startTime = Date.now();
			
			const animate = () => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);
				
				let scale;
				if (progress <= peakTime / duration) {
					// Scale up to peak
					const peakProgress = progress / (peakTime / duration);
					scale = startScale + (maxScale - startScale) * peakProgress;
				} else {
					// Scale down from peak
					const downProgress = (progress - peakTime / duration) / (1 - peakTime / duration);
					scale = maxScale + (endScale - maxScale) * downProgress;
				}
				
				// Update reactive state
				currentScale = scale;
				
				if (progress < 1) {
					animationFrameId = requestAnimationFrame(animate);
				}
			};
			
			animationFrameId = requestAnimationFrame(animate);
		}
		
		return () => {
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	});
</script>

<Container 
	bind:this={containerRef} 
	x={props.x} 
	y={props.y} 
	zIndex={10}
	scale={{ x: currentScale, y: currentScale }}
>
	<Sprite
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
		height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
	/>
</Container>
