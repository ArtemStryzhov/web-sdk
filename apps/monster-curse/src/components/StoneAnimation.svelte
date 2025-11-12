<script lang="ts">
	import { Container, SpineProvider, SpineTrack } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type Props = {
		duration?: number; // Animation duration in ms
		speed?: number; // Fall speed in px/s
		scale?: number; // Scale factor for the stone
		onComplete?: () => void;
	};

	const props: Props = $props();

	const ANIMATION_DURATION = props.duration ?? 500;
	const STONE_FALL_SPEED = props.speed ?? 4500;
	const SCALE_FACTOR = props.scale ?? 1/2;

	const STONE_ORIGINAL_WIDTH = 1557;
	const STONE_ORIGINAL_HEIGHT = 934;

	// Animation state
	let isAnimating = $state(false);
	let currentY = $state(0);
	let stoneDimensions = $state({ width: 0, height: 0 });

	// Main layout for positioning
	const context = getContext();
	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());

	// Calculate stone dimensions maintaining aspect ratio to fit canvas width, reduced by scale factor
	$effect(() => {
		const scale = (canvasSizes.width / STONE_ORIGINAL_WIDTH) * SCALE_FACTOR;
		stoneDimensions = {
			width: STONE_ORIGINAL_WIDTH * scale,
			height: STONE_ORIGINAL_HEIGHT * scale,
		};
	});

	// Start animation
	const startAnimation = () => {
		if (isAnimating) return;

		isAnimating = true;
		currentY = -stoneDimensions.height; // Start above screen
		let animationId: number | null = null;
		let animationStartTime = Date.now();
		let lastTime = Date.now();

		const animate = () => {
			const now = Date.now();
			const deltaTime = (now - lastTime) / 1000; // Convert to seconds
			lastTime = now;
			const elapsedTime = now - animationStartTime;

			// Update stone position
			currentY = currentY + STONE_FALL_SPEED * deltaTime;

			// Continue animation or end it
			if (elapsedTime >= ANIMATION_DURATION) {
				// Animation complete - clean up
				isAnimating = false;
				currentY = 0;
				animationId = null;

				// Call completion callback
				if (props.onComplete) {
					props.onComplete();
				}
			} else {
				animationId = requestAnimationFrame(animate);
			}
		};

		animationId = requestAnimationFrame(animate);
	};

	// Auto-start animation when component mounts
	$effect(() => {
		if (!isAnimating) {
			startAnimation();
		}
	});

	// Cleanup animation when component unmounts
	$effect(() => {
		return () => {
			// Any cleanup if needed
		};
	});
</script>

{#if isAnimating}
	<Container
		x={canvasSizes.width - stoneDimensions.width * 0.4}
		y={currentY}
		zIndex={10001}
	>
		<SpineProvider
			key="stones"
			width={stoneDimensions.width}
			height={stoneDimensions.height}
			anchor={0.5}
		>
			<SpineTrack trackIndex={0} animationName="idle" loop />
		</SpineProvider>
	</Container>
{/if}
