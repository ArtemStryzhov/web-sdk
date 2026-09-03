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
	import { waitForResolve } from 'utils-shared/wait';
	import { MainContainer } from 'components-layout';
	import { OnHotkey, OnMount } from 'components-shared';
	import { FillGradient, type TextStyleOptions } from 'pixi.js';
	import { UI_BASE_FONT_SIZE } from 'components-ui-pixi/src/constants';
	import * as PIXI from 'pixi.js';
	import { SECOND } from 'constants-shared/time';

	import { getContext } from '../game/context';
	import { WIN_AMOUNT_Y, WIN_POPUP_Z, getWinImageY } from '../game/winPopupLayout';
	import WinCoins from './WinCoins.svelte';

	const context = getContext();

	let show = $state(true);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});
	let isHovered = $state(false);
	let countUpCompleted = $state(false);
	let totalWinMusicClosed = $state(false);

	// Same font style as Win.svelte
	const totalWinFontSize = () => {
		const isDesktop = context.stateLayoutDerived.layoutType() === 'desktop';
		const baseFontSize = 60;
		return isDesktop ? baseFontSize * 1.85 : baseFontSize * 1.5;
	};

	const multiplierFontStyle = (): TextStyleOptions => {
		const fontSize = totalWinFontSize();
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
			padding: 20, // Add padding to texture bounds to prevent clipping from stroke/shadow/tall characters
		} as TextStyleOptions;
	};

	// Get total.png sprite with layout-based scaling
	const getTotalSprite = (): { key: string; width: number; height: number; y: number } => {
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
		
		const width = baseWidth * scale;
		const height = baseHeight * scale;

		return {
			key: 'total.png',
			width,
			height,
			// Sit right above the win amount instead of at a fixed offset from the board centre.
			y: getWinImageY({ spriteHeight: height, amountFontSize: totalWinFontSize() }),
		};
	};

	const handlePress = () => {
		if (!totalWinMusicClosed) {
			totalWinMusicClosed = true;
			context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_total_win_music_loop' });
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_total_win_music_end', forcePlay: true });
		}

		// Immediately resolve and hide without delay
		oncomplete();
		show = false;
	};

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => {
			show = true;
			countUpCompleted = false; // Reset when screen shows
			totalWinMusicClosed = false;
			context.eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_total_win_music_loop' });
		},
		freeSpinOutroHide: async () => {
			if (!totalWinMusicClosed) {
				totalWinMusicClosed = true;
				context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_total_win_music_loop' });
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_total_win_music_end', forcePlay: true });
			}

			show = false;
		},
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
	<Container zIndex={WIN_POPUP_Z.background}>
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
		{@const duration = winLevelData.presentDuration <= 1 * SECOND
			? Math.max(winLevelData.presentDuration, 1.8 * SECOND)
			: Math.max(winLevelData.presentDuration, 2.2 * SECOND)}
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

				<!-- Coins animation - only render when counter is not completed and win is big.
				     Kept below the artwork and the amount so it never covers the text. -->
				{#if !countUpCompletedParam && winLevelData?.type === 'big'}
					<Container zIndex={WIN_POPUP_Z.coins}>
						<WinCoins emit={true} levelAlias={winLevelData?.alias} />
					</Container>
				{/if}

				<!-- Content (sprite and amount) -->
				<Container zIndex={WIN_POPUP_Z.image}>
					<MainContainer cullable={false}>
						<Container
							x={context.stateGameDerived.boardLayout().x}
							y={context.stateGameDerived.boardLayout().y}
							zIndex={1000}
							cullable={false}
						>
							{@const mainLayout = context.stateLayoutDerived.mainLayout()}
							{@const boardLayout = context.stateGameDerived.boardLayout()}
							{@const spriteData = getTotalSprite()}
							
							<!-- Total win sprite right above the win amount -->
							<Container
								x={mainLayout.width * 0.5 - boardLayout.x}
								y={spriteData.y}
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
							<!-- TextStyle padding should prevent clipping -->
							<Container
								x={mainLayout.width * 0.5 - boardLayout.x}
								y={WIN_AMOUNT_Y}
								zIndex={1002}
								cullable={false}
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
				</Container>

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
