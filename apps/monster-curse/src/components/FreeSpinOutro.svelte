<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveText } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnMount } from 'components-shared';
	import { FillGradient, type TextStyleOptions } from 'pixi.js';

	import { getContext } from '../game/context';
	import PressToContinue from './PressToContinue.svelte';
	import WinCoins from './WinCoins.svelte';

	const context = getContext();

	let show = $state(true);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});

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

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => (show = true),
		freeSpinOutroHide: async () => (show = false),
		freeSpinOutroCountUp: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const duration = winLevelData.presentDuration}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<!-- Background with opacity for total win screen -->
				<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.7} />

				<OnMount
					onmount={async () => {
						await startCountUp();
						await waitForTimeout(300);
						oncomplete();
					}}
				/>

				<MainContainer>
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

				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				<PressToContinue onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())} />
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
