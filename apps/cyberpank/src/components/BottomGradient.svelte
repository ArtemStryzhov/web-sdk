<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { getContext } from '../game/context';

	const context = getContext();

	// Reactive values for canvas dimensions
	const canvasWidth = $derived(context.stateLayoutDerived.canvasSizes().width);
	const canvasHeight = $derived(context.stateLayoutDerived.canvasSizes().height);

	// Calculate gradient area (bottom 30% of screen - higher coverage)
	const gradientHeight = $derived(canvasHeight * 0.3);
	const gradientY = $derived(canvasHeight * 0.7);
</script>

<Container zIndex={1}>
	<Graphics
		draw={(graphics) => {
			// Create smooth gradient using pixel-by-pixel approach
			const gradientHeightInt = Math.floor(gradientHeight);
			
			for (let i = 0; i < gradientHeightInt; i++) {
				// Calculate alpha based on position (transparent at top, solid black at bottom)
				const progress = i / gradientHeightInt;
				const alpha = 0.95 * progress; // Start at 0 (transparent), fade to 0.95 (very dark black)
				const y = gradientY + i;
				
				// Draw 1-pixel high rectangle for ultra-smooth gradient
				graphics.rect(0, y, canvasWidth, 1);
				graphics.fill({ color: 0x000000, alpha });
			}
		}}
	/>
</Container>
