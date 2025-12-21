<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container, Sprite, Text, Graphics } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText, WinCountUpProvider } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey, OnMount } from 'components-shared';
	import { FillGradient, type TextStyleOptions } from 'pixi.js';
	import { UI_BASE_FONT_SIZE } from 'components-ui-pixi/src/constants';
	import * as PIXI from 'pixi.js';

	import { getContext } from '../game/context';
	import WinCoins from './WinCoins.svelte';

	const context = getContext();

	let show = $state(true);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});
	let isHovered = $state(false);
	let countUpCompleted = $state(false);

	// Same font style as Win.svelte
	const multiplierFontStyle = (): TextStyleOptions => {
		const layoutType = context.stateLayoutDerived.layoutType();
		const isDesktop = layoutType === 'desktop';
		const baseFontSize = 60;
		const fontSize = isDesktop ? baseFontSize * 1.85 : baseFontSize * 1.5;
		const strokeThickness = 5;
		const shadowDistance = Math.hypot(3, 6);

		const strokeGradient = new FillGradient({
			type: 'linear',
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			colorStops: [
				{ offset: 0, color: '#FF70EA' },
				{ offset: 1, color: '#7B15FF' },
			],
			textureSpace: 'local',
		});

		return {
			fontFamily: 'Crom, Arial, sans-serif',
			fontSize,
			align: 'center' as const,
			fontWeight: 'normal' as TextStyleOptions['fontWeight'],
			fill: '#61E5FF',
			stroke: strokeGradient,
			strokeThickness,
			lineJoin: 'round',
			dropShadow: true,
			dropShadowColor: '#BF00B5',
			dropShadowBlur: 0,
			dropShadowAngle: Math.atan2(6, 3),
			dropShadowDistance: shadowDistance,
		} as TextStyleOptions;
	};

	// Get total.png sprite with layout-based scaling
	const getTotalSprite = (): { key: string; width: number; height: number } => {
		const layoutType = context.stateLayoutDerived.layoutType();
		let scale = 1.0; // Default (landscape)
		
		if (layoutType === 'desktop') {
			scale = 1.35;
		} else if (layoutType === 'tablet') {
			scale = 1;
		} else if (layoutType === 'portrait') {
			scale = 0.9;
		}
		
		// Base size: 605x539 / 2 = 302.5x269.5
		const baseWidth = 302.5;
		const baseHeight = 269.5;
		
		return {
			key: 'total.png',
			width: baseWidth * scale,
			height: baseHeight * scale,
		};
	};

	const handlePress = () => {
		// Immediately resolve and hide without delay
		oncomplete();
		show = false;
	};

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => {
			show = true;
			countUpCompleted = false; // Reset when screen shows
		},
		freeSpinOutroHide: async () => (show = false),
		freeSpinOutroCountUp: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			countUpCompleted = false; // Reset when new count-up starts
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});

	// Button styling (same as PressToContinue.svelte)
	const buttonWidth = 436;
	const buttonHeight = 106;
	const buttonScale = 0.75;
	const mainLayout = $derived(context.stateLayoutDerived.mainLayout());
	const buttonX = $derived(mainLayout.width * 0.5);
	const buttonY = $derived(mainLayout.height - 80);
	const buttonSpriteKey = $derived(isHovered ? 'button_grey.png' : 'button_inactive.png');

	const textStyle = $derived({
		fontFamily: 'Kanit, Arial, sans-serif',
		fontSize: UI_BASE_FONT_SIZE * 0.3 * 1.15 * 1.2 * 1.15,
		fontWeight: 600 as any,
		fill: 0x61E5FF,
		align: 'center' as const,
	});
</script>

{#if winLevelData && show}
	<!-- Fullscreen background - rendered FIRST with lowest z-index -->
	{@const canvasSizes = context.stateLayoutDerived.canvasSizes()}
	<Container zIndex={0}>
		<Graphics
			draw={(g) => {
				g.clear();
				g.rect(0, 0, canvasSizes.width, canvasSizes.height);
				g.fill({ color: 0x000000, alpha: 0.7 });
			}}
			eventMode="none"
		/>
	</Container>
	
	<FadeContainer {show} zIndex={1}>
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => {
			onCountUpComplete();
			countUpCompleted = true;
		}}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted: countUpCompletedParam })}

				<OnMount
					onmount={async () => {
						countUpCompleted = false; // Reset when starting
						await startCountUp();
						// Wait for count-up to finish, then stop coins animation
						// The count-up will complete automatically after duration
					}}
				/>

				<!-- Content (sprite and amount) -->
				<MainContainer zIndex={1}>
					<Container
						x={context.stateGameDerived.boardLayout().x}
						y={context.stateGameDerived.boardLayout().y}
						zIndex={1000}
					>
						{@const mainLayout = context.stateLayoutDerived.mainLayout()}
						{@const boardLayout = context.stateGameDerived.boardLayout()}
						{@const spriteData = getTotalSprite()}
						
						<!-- Total win sprite at top center -->
						<Container
							x={mainLayout.width * 0.5 - boardLayout.x}
							y={-230}
							zIndex={1001}
						>
							<Sprite
								key={spriteData.key}
								anchor={0.5}
								width={spriteData.width}
								height={spriteData.height}
							/>
						</Container>
						<!-- Win amount text below sprite -->
						<Container
							x={mainLayout.width * 0.5 - boardLayout.x}
							y={120}
							zIndex={1000}
						>
							<ResponsiveText
								anchor={0.5}
								maxWidth={2130}
								text={bookEventAmountToCurrencyString(countUpAmount).replace(/\./g, '•')}
								style={multiplierFontStyle()}
							/>
						</Container>
					</Container>
				</MainContainer>

				<!-- Coins animation - only render when counter is not completed -->
				{#if !countUpCompletedParam}
					<WinCoins emit={true} levelAlias={winLevelData?.alias} />
				{/if}

			{/snippet}
		</WinCountUpProvider>
	</FadeContainer>

	{#if countUpCompleted}
		<!-- Fullscreen clickable overlay - captures all clicks to close screen -->
		{@const canvasSizes = context.stateLayoutDerived.canvasSizes()}
		<Container 
			zIndex={2} 
			eventMode="static" 
			cursor="pointer" 
			interactive={true}
			hitArea={new PIXI.Rectangle(0, 0, canvasSizes.width, canvasSizes.height)}
			onpointerup={(e) => {
				handlePress();
			}}
		>
			<Graphics
				draw={(g) => {
					g.clear();
					g.rect(0, 0, canvasSizes.width, canvasSizes.height);
					g.fill({ color: 0xffffff, alpha: 0.001 });
				}}
				eventMode="none"
			/>
		</Container>
		
		<!-- Click to continue button at bottom - highest z-index, wrapped in Container to ensure z-index works -->
		<Container zIndex={10000}>
			<MainContainer alignVertical="bottom">
				<Container
					x={buttonX}
					y={buttonY}
					zIndex={1}
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
						y={5}
						eventMode="none"
					/>
				</Container>
			</MainContainer>
		</Container>
	{/if}
{/if}

<!-- Hotkey support - outside FadeContainer so it always works -->
{#if winLevelData && show}
	<OnHotkey hotkey="Space" onpress={handlePress} />
{/if}
