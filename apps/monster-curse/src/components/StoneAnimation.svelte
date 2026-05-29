<script lang="ts">
	import { Container, SpineProvider, SpineTrack, getContextApp } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { sound } from '../game/sound';

	type Props = {
		duration?: number; // Animation duration in ms
		speed?: number; // Fall speed in px/s
		scale?: number; // Scale factor for the stone
		stonesPerCycle?: number; // Number of stones to show simultaneously per cycle
		cycles?: number; // Number of cycles to play sequentially
		onComplete?: () => void;
	};

	const props: Props = $props();

	const ANIMATION_DURATION = props.duration ?? 500;
	const STONE_FALL_SPEED = props.speed ?? 4500;
	const SCALE_FACTOR = props.scale ?? 1/2;
	const STONES_PER_CYCLE = props.stonesPerCycle ?? 5;
	const CYCLES = props.cycles ?? 1;

	const STONE_ORIGINAL_WIDTH = 1557;
	const STONE_ORIGINAL_HEIGHT = 934;

	// Animation state
	let isAnimating = $state(false);
	let stoneYPositions = $state<number[]>([]); // Y positions for each stone
	let activeAnimationId: number | null = null; // Tracked at component scope so cleanup can cancel it
	let stoneDimensions = $state({ width: 0, height: 0, offsetX: 0, useTiled: false, tilesCount: 1, scale: 1 });
	let currentCycle = $state(0); // Track which cycle we're on (0 to CYCLES-1)
	let hasStarted = $state(false); // Track if animation sequence has been initiated

	// Main layout for positioning
	const context = getContext();
	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const isPortrait = $derived(layoutType === 'portrait');
	
	const adjustedSpeed = $derived(STONE_FALL_SPEED * 1.3); 

	// Calculate stone dimensions - width always full screen, height maintains aspect ratio
	// Spine has an offset in the JSON: root bone x: -778.5, so we need to compensate
	const SPINE_OFFSET_X = -778.5; // From stones.json skeleton.x
	const TILED_THRESHOLD = 1300; // Use tiled approach for screens >= 1300px
	
	$effect(() => {
		const aspectRatio = STONE_ORIGINAL_HEIGHT / STONE_ORIGINAL_WIDTH;
		const useTiled = canvasSizes.width >= TILED_THRESHOLD;
		
		// Calculate scale: 
		// - scale = 0.40 for screens 1400-1800px
		// - reduce by 30% (scale = 0.7) for screens 1800-2300px
		// - original size (scale = 1.0) for other screens
		const scale = canvasSizes.width >= 1300 && canvasSizes.width < 1800 
			? 0.55
			: canvasSizes.width >= 1800 && canvasSizes.width <= 2300 
				? 0.6 
				: 1.0;  // Original size

		// Calculate new dimensions
		let newDimensions;
		if (useTiled) {
			// Use tiled approach: multiple images of original size
			const tilesCount = Math.ceil(canvasSizes.width / STONE_ORIGINAL_WIDTH);
			newDimensions = {
				width: STONE_ORIGINAL_WIDTH, // Original width for each tile
				height: STONE_ORIGINAL_HEIGHT, // Original height
				offsetX: SPINE_OFFSET_X, // Original offset (no scaling)
				useTiled: true,
				tilesCount,
				scale,
			};
		} else {
			// Use scaled approach: single image scaled to full width
			const scaleFactor = canvasSizes.width / STONE_ORIGINAL_WIDTH;
			newDimensions = {
				width: canvasSizes.width, // Full screen width
				height: canvasSizes.width * aspectRatio, // Maintain aspect ratio
				offsetX: SPINE_OFFSET_X * scaleFactor, // Compensate for Spine offset (scaled)
				useTiled: false,
				tilesCount: 1,
				scale,
			};
		}
		
		// Only update if values actually changed to prevent infinite loops
		if (
			stoneDimensions.width !== newDimensions.width ||
			stoneDimensions.height !== newDimensions.height ||
			stoneDimensions.offsetX !== newDimensions.offsetX ||
			stoneDimensions.useTiled !== newDimensions.useTiled ||
			stoneDimensions.tilesCount !== newDimensions.tilesCount ||
			stoneDimensions.scale !== newDimensions.scale
		) {
			stoneDimensions = newDimensions;
		}
	});

	// Start a single cycle of animation
	const startCycle = (cycleIndex: number) => {
		isAnimating = true;
		// Calculate time delay between stones (time for one stone to move down by one stone height)
		const timeBetweenStones = stoneDimensions.height / adjustedSpeed;
		
		// Initialize all stones starting positions - each one stone height above the previous
		stoneYPositions = Array(STONES_PER_CYCLE).fill(0).map((_, i) => 
			-stoneDimensions.height - (i * stoneDimensions.height)
		);
		
		activeAnimationId = null;
		let animationStartTime = Date.now();
		let lastTime = Date.now();
		// Track when each stone should start (in seconds from cycle start)
		const stoneStartTimes = Array(STONES_PER_CYCLE).fill(0).map((_, i) => i * timeBetweenStones);

		const animate = () => {
			const now = Date.now();
			const deltaTime = (now - lastTime) / 1000; // Convert to seconds
			lastTime = now;
			const elapsedTime = (now - animationStartTime) / 1000; // Elapsed time in seconds

			// Update each stone's position
			stoneYPositions = stoneYPositions.map((y, i) => {
				// Only move stone if its start time has passed
				if (elapsedTime >= stoneStartTimes[i]) {
					const stoneElapsedTime = elapsedTime - stoneStartTimes[i];
					return y + adjustedSpeed * deltaTime;
				}
				return y;
			});

			// Check if all stones have finished (last stone has been animating for ANIMATION_DURATION)
			const lastStoneStartTime = stoneStartTimes[STONES_PER_CYCLE - 1];
			const totalCycleDuration = (lastStoneStartTime * 1000) + ANIMATION_DURATION;
			const elapsedTimeMs = (now - animationStartTime);

			if (elapsedTimeMs >= totalCycleDuration) {
				// Cycle complete - clean up
				isAnimating = false;
				stoneYPositions = [];
				activeAnimationId = null;

				// Check if we have more cycles to play
				if (cycleIndex < CYCLES - 1) {
					// Start next cycle immediately (no delay)
					currentCycle = cycleIndex + 1;
					startCycle(currentCycle);
				} else {
					// All cycles complete - call completion callback
					currentCycle = 0;
					hasStarted = false; // Reset so animation can be restarted if needed
					if (props.onComplete) {
						props.onComplete();
					}
				}
			} else {
				activeAnimationId = requestAnimationFrame(animate);
			}
		};

		activeAnimationId = requestAnimationFrame(animate);
	};

	// Start the full animation sequence
	const startAnimation = () => {
		if (isAnimating || hasStarted) return;

		if (sound.players) {
			sound.players.once.play({ name: 'sfx_transition', forcePlay: true });
		}

		hasStarted = true;
		currentCycle = 0;
		startCycle(0);
	};

	// Auto-start animation when component mounts
	$effect(() => {
		if (!hasStarted && !isAnimating) {
			startAnimation();
		}
	});

	// Cancel any running RAF loop when the component is destroyed to prevent memory leaks.
	$effect(() => {
		return () => {
			if (activeAnimationId !== null) {
				cancelAnimationFrame(activeAnimationId);
				activeAnimationId = null;
			}
		};
	});
</script>

{#if isAnimating}
	<Container
		x={0}
		zIndex={10001}
	>
		{#each Array(STONES_PER_CYCLE) as _, i}
			{#if stoneYPositions[i] !== undefined}
				{#if stoneDimensions.useTiled}
					<!-- Tiled approach: multiple images of original size, positioned side by side -->з
					{#each Array(stoneDimensions.tilesCount) as _, tileIndex}
						{@const tileX = tileIndex * STONE_ORIGINAL_WIDTH - stoneDimensions.offsetX}
						{@const isFirstRender = tileIndex === 0 && i === 0}
						<Container y={stoneYPositions[i]} x={tileX}>
							<SpineProvider
								key="stones"
								anchor={0}
								x={0}
								scale={{ x: stoneDimensions.scale, y: stoneDimensions.scale }}
							>
								<SpineTrack trackIndex={0} animationName="idle" loop />
							</SpineProvider>
						</Container>
					{/each}
				{:else}
					<!-- Scaled approach: single image scaled to full width -->
					<Container y={stoneYPositions[i]} x={-stoneDimensions.offsetX}>
						<SpineProvider
							key="stones"
							width={stoneDimensions.width}
							height={stoneDimensions.height}
							anchor={0}
							x={0}
						>
							<SpineTrack trackIndex={0} animationName="idle" loop />
						</SpineProvider>
					</Container>
				{/if}
			{/if}
		{/each}
	</Container>
{/if}
