<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { ResponsiveText } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { FillGradient, type TextStyleOptions } from 'pixi.js';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';

	type Props = {
		countUpAmount: number;
	};

	const props: Props = $props();
	const context = getContext();

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
</script>

<MainContainer zIndex={1002} cullable={false}>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y}
		zIndex={1000}
		cullable={false}
	>
		{@const mainLayout = context.stateLayoutDerived.mainLayout()}
		{@const boardLayout = context.stateGameDerived.boardLayout()}
		
		<!-- Win amount text centered -->
		<Container
			x={mainLayout.width * 0.5 - boardLayout.x}
			y={120}
			zIndex={1000}
			cullable={false}
		>
			<ResponsiveText
				anchor={0.5}
				maxWidth={2130}
				text={bookEventAmountToCurrencyString(props.countUpAmount).replace(/\./g, '•')}
				style={multiplierFontStyle()}
			/>
		</Container>
	</Container>
</MainContainer>
