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

	onMount(async () => {
		// Wait for fonts to be loaded before rendering text
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
	});

	const buttonWidth = 436;
	const buttonHeight = 106;
	const buttonScale = 0.75;

	let isHovered = $state(false);

	const mainLayout = $derived(context.stateLayoutDerived.mainLayout());

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
	const availableWidth = $derived(mainLayout.width - horizontalPadding * 2);
	const totalFramesWidth = $derived(frameOriginalWidth * numFrames);
	const totalGapsWidth = $derived(frameGap * (numFrames - 1));
	const totalWidthNeeded = $derived(totalFramesWidth + totalGapsWidth);
	const frameScale = $derived(Math.min(1, availableWidth / totalWidthNeeded) * 0.5 * 1.15); // Scale down by 2x, then increase by 15%

	// Calculate scaled dimensions
	const frameWidth = $derived(frameOriginalWidth * frameScale);
	const frameHeight = $derived(frameOriginalHeight * frameScale);

	// Calculate horizontal positions for 3 frames (centered)
	const framesGroupWidth = $derived(frameWidth * numFrames + frameGap * (numFrames - 1));
	const framesGroupStartX = $derived((mainLayout.width - framesGroupWidth) * 0.5);
	const framePositions = $derived(
		Array.from({ length: numFrames }, (_, i) => framesGroupStartX + i * (frameWidth + frameGap) + frameWidth * 0.5)
	);

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
		{#each framePositions as frameX, index}
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
