<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveText } from 'components-pixi';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';
	import { FillGradient, type TextStyleOptions } from 'pixi.js';
	import { SECOND } from 'constants-shared/time';

	import WinCoins from './WinCoins.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import { getContext } from '../game/context';

	const context = getContext();

	let show = $state(false);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});

	// Ensure Dokdo font is loaded before rendering Pixi text to avoid fallback fonts.
	const dokdoFontReady =
		typeof document !== 'undefined'
			? document.fonts.load('400 96px "Dokdo"')
			: Promise.resolve();
	// Trigger load early
	$effect(() => {
		dokdoFontReady;
	});

	const multiplierFontStyle = (): TextStyleOptions => {
		// Match multiplier.css exactly: font-size: 50px, text-shadow: 3px 6px 0px #BF00B5, -webkit-text-stroke: 5px transparent
		// Base: 50 * 1.2 = 60, then +15% on desktop: 60 * 1.15 = 69
		const layoutType = context.stateLayoutDerived.layoutType();
		const isDesktop = layoutType === 'desktop';
		const baseFontSize = 60;
		const fontSize = isDesktop ? baseFontSize * 1.85 : baseFontSize * 1.4; // 69 on desktop, 60 otherwise
		const strokeThickness = 5; // Match -webkit-text-stroke: 5px
		const shadowDistance = Math.hypot(3, 6); // Match text-shadow: 3px 6px (distance = sqrt(3^2 + 6^2) ≈ 6.708)

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
			fontFamily: 'Crom, Arial, sans-serif', // Match multiplier.css font-family: 'Crom', Arial, sans-serif
			fontSize, // Increased by 20%: 60px
			align: 'center' as const,
			fontWeight: 'normal' as TextStyleOptions['fontWeight'], // Match font-weight: normal
			fill: '#61E5FF', // Match color: #61E5FF
			stroke: strokeGradient, // Match border-image gradient: linear-gradient(180deg, #FF70EA 0%, #7B15FF 100%)
			strokeThickness, // Match -webkit-text-stroke: 5px
			lineJoin: 'round',
			dropShadow: true,
			dropShadowColor: '#BF00B5', // Match text-shadow: 3px 6px 0px #BF00B5
			dropShadowBlur: 0, // Match text-shadow blur: 0px
			dropShadowAngle: Math.atan2(6, 3), // Match text-shadow: 3px 6px
			dropShadowDistance: shadowDistance,
			padding: 20, // Add padding to texture bounds to prevent clipping from stroke/shadow/tall characters
		} as TextStyleOptions;
	};

	// Get sprite key and size for each win level
	const getWinLevelSprite = (level: number | undefined): { key: string; width: number; height: number } | null => {
		if (!level) return null;
		
		const layoutType = context.stateLayoutDerived.layoutType();
		let scale = 1.0; // Default (landscape)
		
		if (layoutType === 'desktop') {
			scale = 1.35; 
		} else if (layoutType === 'tablet') {
			scale = 1; 
		} else if (layoutType === 'portrait') {
			scale = 0.85; 
		}
		// landscape: scale = 1.0 (default)
		
		let baseSprite: { key: string; width: number; height: number } | null = null;
		
		switch (level) {
			case 6:
				baseSprite = { key: 'big.png', width: 412.5, height: 126 }; // 825x252 / 2
				break;
			case 7:
				baseSprite = { key: 'mega.png', width: 412.5, height: 183.5 }; // 825x367 / 2
				break;
			case 8:
				baseSprite = { key: 'super.png', width: 436.5, height: 244.5 }; // 873x489 / 2
				break;
			case 9:
			case 10:
				baseSprite = { key: 'sens.png', width: 498.5, height: 244.5 }; // 997x489 / 2
				break;
			default:
				return null;
		}
		
		return {
			key: baseSprite.key,
			width: baseSprite.width * scale,
			height: baseSprite.height * scale,
		};
	};

	context.eventEmitter.subscribeOnMount({
		winShow: () => (show = true),
		winHide: () => (show = false),
		winUpdate: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show} zIndex={10004}>
	{#if winLevelData}
		{@const duration = Math.max(winLevelData.presentDuration, 3 * SECOND)}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<!-- Background with opacity only for win levels >= 6 -->
				{#if winLevelData && winLevelData.level >= 6}
					<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.7} zIndex={0} />
				{/if}

				<OnMount
					onmount={async () => {
						await dokdoFontReady;
						await startCountUp();
						await waitForTimeout(300);
						oncomplete();
					}}
				/>

				<MainContainer zIndex={1} cullable={false}>
					<Container
						x={context.stateGameDerived.boardLayout().x}
						y={context.stateGameDerived.boardLayout().y}
						zIndex={1000}
						cullable={false}
					>
						{@const mainLayout = context.stateLayoutDerived.mainLayout()}
						{@const boardLayout = context.stateGameDerived.boardLayout()}
						{@const spriteData = getWinLevelSprite(winLevelData?.level)}
						
						{#if spriteData}
							<!-- Win level sprite at top center -->
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
							<!-- TextStyle padding should prevent clipping, but keep container padding as backup -->
							<Container
								x={mainLayout.width * 0.5 - boardLayout.x}
								y={120}
								zIndex={1000}
								cullable={false}
							>
								<ResponsiveText
									anchor={0.5}
									maxWidth={2130}
									text={bookEventAmountToCurrencyString(countUpAmount).replace(/\./g, '•')}
									style={multiplierFontStyle()}
								/>
							</Container>
						{:else}
							<!-- Fallback for levels without sprites -->
							<Container
								x={mainLayout.width * 0.5 - boardLayout.x}
								y={0}
								zIndex={1000}
								cullable={false}
							>
								<ResponsiveText
									anchor={0.5}
									maxWidth={context.stateLayoutDerived.canvasSizes().width /
										context.stateLayoutDerived.mainLayout().scale}
									text={bookEventAmountToCurrencyString(countUpAmount).replace(/\./g, '•')}
									style={multiplierFontStyle()}
								/>
							</Container>
						{/if}
					</Container>
				</MainContainer>

				<Container zIndex={1}>
					<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />
				</Container>

				<Container zIndex={1}>
					<PressToContinue onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())} />
				</Container>
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
