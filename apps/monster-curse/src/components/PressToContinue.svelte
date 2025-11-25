<script lang="ts">
	import { MainContainer, OnPressFullScreen, CanvasSizeRectangle } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Sprite, Text, Container, Graphics } from 'pixi-svelte';
	import { UI_BASE_FONT_SIZE } from 'components-ui-pixi/src/constants';
	import * as PIXI from 'pixi.js';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';

	type Props = {
		onpress: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	const shouldShow = $derived(context.stateGame.gameType !== 'freegame');

	// Font loading state
	let fontLoaded = $state(false);

	onMount(() => {
		// Wait for fonts to be loaded before rendering text
		(async () => {
			if (typeof document !== 'undefined' && 'fonts' in document) {
				try {
					// Wait for all fonts to be ready
					await document.fonts.ready;
					// Small delay to ensure PIXI can access the font
					setTimeout(() => {
						fontLoaded = true;
					}, 50);
				} catch (error) {
					// Fallback: proceed after a short delay
					setTimeout(() => {
						fontLoaded = true;
					}, 500);
				}
			} else {
				// Fallback for browsers without Font Loading API
				setTimeout(() => {
					fontLoaded = true;
				}, 300);
			}
		})();

		// Add global pointer event listeners for slider dragging
		if (typeof window !== 'undefined') {
			const handleGlobalPointerMove = (e: PointerEvent) => {
				if (isDragging && isSliderMode) {
					const pixiEvent = {
						globalX: e.clientX,
						clientX: e.clientX,
						stopPropagation: () => {},
					};
					handlePointerMove(pixiEvent);
				}
			};

			const handleGlobalPointerUp = (e: PointerEvent) => {
				if (isDragging && isSliderMode) {
					const pixiEvent = {
						globalX: e.clientX,
						clientX: e.clientX,
						stopPropagation: () => {},
					};
					handlePointerUp(pixiEvent);
				}
			};

			window.addEventListener('pointermove', handleGlobalPointerMove);
			window.addEventListener('pointerup', handleGlobalPointerUp);

			return () => {
				window.removeEventListener('pointermove', handleGlobalPointerMove);
				window.removeEventListener('pointerup', handleGlobalPointerUp);
			};
		}
	});

	const buttonWidth = 436;
	const buttonHeight = 106;
	const buttonScale = 0.75;

	let isHovered = $state(false);

	const mainLayout = $derived(context.stateLayoutDerived.mainLayout());
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const isPortrait = $derived(layoutType === 'portrait');
	const isTablet = $derived(layoutType === 'tablet');
	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());
	const isSliderMode = $derived(canvasSizes.width <= 450);
	const isSmallScreen = $derived(canvasSizes.width < 380);

	const buttonX = $derived(mainLayout.width * 0.5);
	const buttonY = $derived(mainLayout.height - 80);

	const buttonSpriteKey = $derived(isHovered ? 'button_grey.png' : 'button_inactive.png');

	// Welcome frame layout calculations
	const frameOriginalWidth = 846;
	const frameOriginalHeight = 993;
	const numFrames = 3;
	const frameGap = 90; // Gap between frames
	const horizontalPadding = 80; // Padding on left and right sides

	// Calculate scale to fit available width, then reduce by 2x, then increase by 15%
	// On portrait, multiply by 3 to make blocks 3 times larger
	const availableWidth = $derived(mainLayout.width - horizontalPadding * 2);
	const totalFramesWidth = $derived(frameOriginalWidth * numFrames);
	const totalGapsWidth = $derived(frameGap * (numFrames - 1));
	const totalWidthNeeded = $derived(totalFramesWidth + totalGapsWidth);
	const baseFrameScale = $derived(Math.min(1, availableWidth / totalWidthNeeded) * 0.5 * 1.15); // Scale down by 2x, then increase by 15%
	const frameScale = $derived(
		(() => {
			const base = isPortrait
				? baseFrameScale * 3 // 3 times larger on portrait
				: isTablet
					? baseFrameScale * 2 // 2 times larger on tablet
					: baseFrameScale;
			return base * (isSmallScreen ? 0.7 : 1); // 30% smaller on screens < 380
		})()
	);

	// Calculate scaled dimensions
	const frameWidth = $derived(frameOriginalWidth * frameScale);
	const frameHeight = $derived(frameOriginalHeight * frameScale);

	// Slider state for drag/swipe functionality
	let sliderDragOffset = $state(0); // Drag offset relative to current slide
	let currentSlideIndex = $state(1); // Focus second slide by default
	let isDragging = $state(false);
	let dragStartX = $state(0);

	const frameSpacing = $derived(frameWidth + frameGap);
	const sliderFrameOffsets = $derived(
		Array.from({ length: numFrames }, (_, i) => i * frameSpacing)
	);
	const sliderCenterX = $derived(mainLayout.width * 0.5);
	const sliderGroupX = $derived(
		isSliderMode ? sliderCenterX - currentSlideIndex * frameSpacing + sliderDragOffset : 0
	);

	// Normal mode positions (non-slider)
	const normalFramePositions = $derived(
		(() => {
			const framesGroupWidth = frameWidth * numFrames + frameGap * (numFrames - 1);
			const framesGroupStartX = (mainLayout.width - framesGroupWidth) * 0.5;
			return Array.from(
				{ length: numFrames },
				(_, i) => framesGroupStartX + i * (frameWidth + frameGap) + frameWidth * 0.5
			);
		})()
	);

	// Reset slider state when leaving slider mode
	$effect(() => {
		if (!isSliderMode) {
			currentSlideIndex = 1;
			sliderDragOffset = 0;
			isDragging = false;
		}
	});

	// Slider drag handlers - using PIXI event coordinates
	const handlePointerDown = (e: any) => {
		if (!isSliderMode) return;
		isDragging = true;
		// Use globalX from PIXI event or fallback to clientX
		dragStartX = e.globalX ?? e.clientX ?? 0;
		sliderDragOffset = 0;
		e.stopPropagation();
	};

	const handlePointerMove = (e: any) => {
		if (!isDragging || !isSliderMode) return;
		// Use globalX from PIXI event or fallback to clientX
		const currentX = e.globalX ?? e.clientX ?? 0;
		const deltaX = currentX - dragStartX;
		// Allow dragging with some resistance at boundaries
		const maxDrag = frameSpacing * 1.2;
		sliderDragOffset = Math.max(-maxDrag, Math.min(maxDrag, deltaX));
		e.stopPropagation?.();
	};

	const handlePointerUp = (e: any) => {
		if (!isDragging || !isSliderMode) return;
		isDragging = false;
		const endX = e.globalX ?? e.clientX ?? 0;
		const deltaX = endX - dragStartX;
		const swipeThreshold = frameSpacing * 0.2;
		let finalOffset = deltaX;

		if (deltaX < -swipeThreshold && currentSlideIndex < numFrames - 1) {
			currentSlideIndex += 1;
			finalOffset = deltaX + frameSpacing;
		} else if (deltaX > swipeThreshold && currentSlideIndex > 0) {
			currentSlideIndex -= 1;
			finalOffset = deltaX - frameSpacing;
		}

		const startOffset = finalOffset;
		sliderDragOffset = startOffset;
		const duration = 250;
		const startTime = performance.now();

		const animate = () => {
			const elapsed = performance.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			sliderDragOffset = startOffset * (1 - eased);

			if (progress < 1) {
				requestAnimationFrame(animate);
			} else {
				sliderDragOffset = 0;
			}
		};

		requestAnimationFrame(animate);

		e.stopPropagation?.();
	};

	// Calculate vertical position (centered, then moved 40px down)
	const framesY = $derived(mainLayout.height * 0.5 + 40);

	// Frame text content
	const frameTexts = [
		'Silver Sword symbols may carry variable multiplier values and expand vertically to occupy the entire reel.',
		'Elixir Flask symbols interact with expanding Silver Sword symbols, applying an extra multiplier effect.',
		'Maximum payout: 20,000× bet',
	];

	// Text style for frame content
	const frameTextStyle = $derived({
		fontFamily: 'Chelsea Market, Arial, sans-serif',
		fontSize: UI_BASE_FONT_SIZE * 0.45,
		fontWeight: 400 as any,
		fill: 0xFFFFFF,
		align: 'center' as const,
		wordWrap: true,
		wordWrapWidth: frameWidth * 0.8, // 80% of frame width for padding
	});

	// Text style for first block (with extra left padding)
	const frameTextStyleFirst = $derived({
		fontFamily: 'Chelsea Market, Arial, sans-serif',
		fontSize: UI_BASE_FONT_SIZE * 0.45,
		fontWeight: 400 as any,
		fill: 0xFFFFFF,
		align: 'center' as const,
		wordWrap: true,
		wordWrapWidth: frameWidth * 0.8 - 15, // Reduced width by 15px for left padding
	});

	// Calculate text Y position (bottom of frame with padding)
	const frameTextY = $derived(frameHeight * 0.5 - 40); // Bottom of frame minus padding
	const frameTextXFirst = $derived(15 * 0.5); // Shift right by half of the padding to maintain visual balance

	// Image dimensions from spritesheet (original sizes)
	const imageSizes = {
		sword: { width: 193, height: 470 },
		'50x': { width: 171, height: 171 },
		elicsir: { width: 181, height: 181 },
		sens2000: { width: 373, height: 350 },
	};

	// Calculate image scales to fit within frames (with some padding), then double the size
	const imageScale = $derived((frameWidth * 0.3 / Math.max(imageSizes.sword.width, imageSizes['50x'].width)) * 2); // Scale based on frame width, doubled
	const imageScaleSens = $derived((frameWidth * 0.4 / imageSizes.sens2000.width) * 2 * 1.2); // Slightly larger for sens2000, doubled, then increased by 20%

	// Calculate image positions
	// Frame boundaries: left = -frameWidth/2, right = frameWidth/2, top = -frameHeight/2, bottom = frameHeight/2
	// First block: sword.png near left border, 50x.png centered horizontally, top aligned
	const swordX = $derived(-frameWidth * 0.45 - 50); // Near left border (with padding from edge), moved 50px left
	const swordY = $derived(-frameHeight * 0.4 + 80); // Positioned in upper area, moved 50px down
	const multiplierX = $derived(0); // Centered horizontally
	const multiplierY = $derived(-frameHeight * 0.4 + 20); // Top aligned

	// Second block: elicsir.png centered horizontally, top aligned
	const elicsirX = $derived(0); // Centered horizontally
	const elicsirY = $derived(-frameHeight * 0.4 +35); // Top aligned

	// Third block: sens2000.png centered horizontally, top aligned
	const sens2000X = $derived(0); // Centered horizontally
	const sens2000Y = $derived(-frameHeight * 0.4 + 40); // Top aligned, moved 40px down

	const textStyle = $derived({
		fontFamily: 'Kanit, Arial, sans-serif',
		fontSize: UI_BASE_FONT_SIZE * 0.65,
		fontWeight: 600 as any,
		fill: 0x61E5FF,
		align: 'center' as const,
	});

	const handlePress = () => {
		props.onpress();
	};
</script>

{#if shouldShow}
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.2} zIndex={9999} />

	<!-- Welcome frame blocks -->
	<MainContainer zIndex={9999}>
		{#if isSliderMode}
			<!-- Slider mode (width <= 450): Slider with drag/swipe functionality -->
			<Container
				x={0}
				y={framesY}
				eventMode="static"
				cursor={isDragging ? 'grabbing' : 'grab'}
				hitArea={new PIXI.Rectangle(0, -mainLayout.height * 0.5, mainLayout.width, mainLayout.height)}
				onpointerdown={handlePointerDown}
				onpointermove={handlePointerMove}
				onpointerup={handlePointerUp}
				onpointerleave={handlePointerUp}
			>
				<Graphics
					draw={(graphics) => {
						graphics.clear();
						graphics.rect(0, -mainLayout.height * 0.5, mainLayout.width, mainLayout.height);
						graphics.fill({ color: 0xffffff, alpha: 1 });
					}}
					eventMode="none"
					isMask={true}
				/>
				<Container x={sliderGroupX} y={0} eventMode="none">
					{#each sliderFrameOffsets as offset, index}
						<Container
							x={offset}
							y={0}
							eventMode="none"
						>
							<!-- Inner background (behind frame) -->
							<Graphics
								draw={(graphics) => {
									graphics.clear();
									graphics.rect(-frameWidth * 0.5, -frameHeight * 0.5, frameWidth, frameHeight);
									graphics.fill({ color: 0x000000, alpha: 0.6 });
								}}
								eventMode="none"
							/>

							<Sprite
								key="welcome_frame.png"
								width={frameWidth}
								height={frameHeight}
								anchor={{ x: 0.5, y: 0.5 }}
								x={0}
								y={0}
								eventMode="none"
							/>

							<!-- First block: sword.png and 50x.png -->
							{#if index === 0}
								<Sprite
									key="sword.png"
									width={imageSizes.sword.width * imageScale}
									height={imageSizes.sword.height * imageScale}
									anchor={{ x: 0.5, y: 0.5 }}
									x={swordX}
									y={swordY}
									eventMode="none"
								/>
								<Sprite
									key="50x.png"
									width={imageSizes['50x'].width * imageScale}
									height={imageSizes['50x'].height * imageScale}
									anchor={{ x: 0.5, y: 0.5 }}
									x={multiplierX}
									y={multiplierY}
									eventMode="none"
								/>
							{/if}

							<!-- Second block: elicsir.png -->
							{#if index === 1}
								<Sprite
									key="elicsir.png"
									width={imageSizes.elicsir.width * imageScale}
									height={imageSizes.elicsir.height * imageScale}
									anchor={{ x: 0.5, y: 0.5 }}
									x={elicsirX}
									y={elicsirY}
									eventMode="none"
								/>
							{/if}

							<!-- Third block: sens2000.png -->
							{#if index === 2}
								<Sprite
									key="sens2000.png"
									width={imageSizes.sens2000.width * imageScaleSens}
									height={imageSizes.sens2000.height * imageScaleSens}
									anchor={{ x: 0.5, y: 0.5 }}
									x={sens2000X}
									y={sens2000Y}
									eventMode="none"
								/>
							{/if}

							{#if fontLoaded}
								{#if index === 0}
									<Text
										text={frameTexts[index]}
										style={frameTextStyleFirst}
										anchor={{ x: 0.5, y: 1 }}
										x={frameTextXFirst}
										y={frameTextY}
										eventMode="none"
									/>
								{:else}
									<Text
										text={frameTexts[index]}
										style={frameTextStyle}
										anchor={{ x: 0.5, y: 1 }}
										x={0}
										y={frameTextY}
										eventMode="none"
									/>
								{/if}
							{/if}
						</Container>
					{/each}
				</Container>
			</Container>
		{:else}
			<!-- Non-slider: Normal centered layout -->
			{#each normalFramePositions as frameX, index}
				<Container
					x={frameX}
					y={framesY}
					eventMode="none"
				>
					<!-- Inner background (behind frame) -->
					<Graphics
						draw={(graphics) => {
							graphics.clear();
							graphics.rect(-frameWidth * 0.5, -frameHeight * 0.5, frameWidth, frameHeight);
							graphics.fill({ color: 0x000000, alpha: 0.6 });
						}}
						eventMode="none"
					/>

					<Sprite
						key="welcome_frame.png"
						width={frameWidth}
						height={frameHeight}
						anchor={{ x: 0.5, y: 0.5 }}
						x={0}
						y={0}
						eventMode="none"
					/>

					<!-- First block: sword.png and 50x.png -->
					{#if index === 0}
						<Sprite
							key="sword.png"
							width={imageSizes.sword.width * imageScale}
							height={imageSizes.sword.height * imageScale}
							anchor={{ x: 0.5, y: 0.5 }}
							x={swordX}
							y={swordY}
							eventMode="none"
						/>
						<Sprite
							key="50x.png"
							width={imageSizes['50x'].width * imageScale}
							height={imageSizes['50x'].height * imageScale}
							anchor={{ x: 0.5, y: 0.5 }}
							x={multiplierX}
							y={multiplierY}
							eventMode="none"
						/>
					{/if}

					<!-- Second block: elicsir.png -->
					{#if index === 1}
						<Sprite
							key="elicsir.png"
							width={imageSizes.elicsir.width * imageScale}
							height={imageSizes.elicsir.height * imageScale}
							anchor={{ x: 0.5, y: 0.5 }}
							x={elicsirX}
							y={elicsirY}
							eventMode="none"
						/>
					{/if}

					<!-- Third block: sens2000.png -->
					{#if index === 2}
						<Sprite
							key="sens2000.png"
							width={imageSizes.sens2000.width * imageScaleSens}
							height={imageSizes.sens2000.height * imageScaleSens}
							anchor={{ x: 0.5, y: 0.5 }}
							x={sens2000X}
							y={sens2000Y}
							eventMode="none"
						/>
					{/if}

					{#if fontLoaded}
						{#if index === 0}
							<Text
								text={frameTexts[index]}
								style={frameTextStyleFirst}
								anchor={{ x: 0.5, y: 1 }}
								x={frameTextXFirst}
								y={frameTextY}
								eventMode="none"
							/>
						{:else}
							<Text
								text={frameTexts[index]}
								style={frameTextStyle}
								anchor={{ x: 0.5, y: 1 }}
								x={0}
								y={frameTextY}
								eventMode="none"
							/>
						{/if}
					{/if}
				</Container>
			{/each}
		{/if}
	</MainContainer>

	<MainContainer alignVertical="bottom" zIndex={10000}>
		<Container
			x={buttonX}
			y={buttonY}
			eventMode="static"
			cursor="pointer"
			interactive={true}
			hitArea={new PIXI.Rectangle(
				0,
				0,
				buttonWidth * buttonScale,
				buttonHeight * buttonScale
			)}
			onpointerover={(e) => {
				e.stopPropagation();
				isHovered = true;
			}}
			onpointerout={(e) => {
				e.stopPropagation();
				isHovered = false;
			}}
			onpointerup={(e) => {
				e.stopPropagation();
				handlePress();
			}}
		>
			<Sprite
				key={buttonSpriteKey}
				width={buttonWidth * buttonScale}
				height={buttonHeight * buttonScale}
				anchor={{ x: 0.5, y: 0.5 }}
				x={0}
				y={0}
				eventMode="none"
			/>

			<Text
				text="CLICK TO CONTINUE"
				style={textStyle}
				anchor={{ x: 0.5, y: 0.5 }}
				x={0}
				y={0}
				eventMode="none"
			/>
		</Container>
	</MainContainer>
{/if}
<OnHotkey hotkey="Space" onpress={handlePress} />
<OnPressFullScreen onpress={handlePress} />
