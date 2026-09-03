<script lang="ts" module>
	export type EmitterEventBonusIntroPopup =
		| { type: 'bonusIntroPopupShow'; totalFreeSpins: number }
		| { type: 'bonusIntroPopupHide' };
</script>

<script lang="ts">
	import { BaseSprite, Container, Sprite, Text } from 'pixi-svelte';
	import { FadeContainer, ResponsiveText } from 'components-pixi';
	import { MainContainer, CanvasSizeRectangle } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { UI_BASE_FONT_SIZE } from 'components-ui-pixi/src/constants';
	import { waitForResolve } from 'utils-shared/wait';
	import { FillGradient, type TextStyleOptions } from 'pixi.js';
	import * as PIXI from 'pixi.js';

	import { getContext } from '../game/context';

	const context = getContext();

	// congr.png source dimensions (assets/sprites/common/spritesheet.json)
	const CONGR_SIZES = { width: 997, height: 300 };

	// Dust region of the feature atlas page, matching BuyBonusDustBackground.svelte:
	// mm_bg_feature_animated.atlas puts "dust" at xy 290,0 with size 1175x1223, drawn at 0.75x
	const DUST_FRAME = { x: 290, y: 0, width: 1174, height: 1223 };
	const DUST_SCALE = 0.75;

	// Pixi rasterizes text once, so wait for Dokdo before drawing the free spins amount
	let dokdoReady = $state(false);
	if (typeof document === 'undefined' || !('fonts' in document)) {
		dokdoReady = true;
	} else if (document.fonts.check('400 96px "Dokdo"')) {
		dokdoReady = true;
	} else {
		document.fonts.load('400 96px "Dokdo"').finally(() => (dokdoReady = true));
	}

	let show = $state(false);
	let totalFreeSpins = $state(0);
	let isHovered = $state(false);
	let oncomplete = $state(() => {});
	let youWonSizes = $state({ width: 0, height: 0 });

	const dustTexture = $derived.by(() => {
		const texture = context.stateApp.loadedAssets?.featureDust as PIXI.Texture | undefined;
		if (!texture || texture === PIXI.Texture.EMPTY) return undefined;

		return new PIXI.Texture({
			source: texture.source,
			frame: new PIXI.Rectangle(DUST_FRAME.x, DUST_FRAME.y, DUST_FRAME.width, DUST_FRAME.height),
		});
	});

	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const mainLayout = $derived(context.stateLayoutDerived.mainLayout());
	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());

	// Smaller layouts get relatively larger text, because mainLayout is scaled down more there
	const textScale = $derived(layoutType === 'portrait' ? 1.35 : layoutType === 'tablet' ? 1.2 : 1);

	// Same paragraph style as the game rules page (Kanit, regular, white)
	const paragraphFontSize = $derived(UI_BASE_FONT_SIZE * 0.65 * textScale);
	const paragraphStyle = $derived({
		fontFamily: 'Kanit, Arial, sans-serif',
		fontSize: paragraphFontSize,
		fontWeight: 400 as TextStyleOptions['fontWeight'],
		fill: 0xffffff,
		align: 'center' as const,
		lineHeight: paragraphFontSize * 1.35,
	});

	const youWonStyle = $derived({
		...paragraphStyle,
		letterSpacing: 2 * textScale,
	});

	// 5px smaller than the game rules paragraph, wrapped a little wider than the
	// design so more words fit per line
	const DESCRIPTION_WRAP_WIDTH = 264;
	const descriptionFontSize = $derived(paragraphFontSize - 5);
	const descriptionStyle = $derived({
		...paragraphStyle,
		fontSize: descriptionFontSize,
		lineHeight: descriptionFontSize * 1.35,
		wordWrap: true,
		wordWrapWidth: Math.min(DESCRIPTION_WRAP_WIDTH * textScale, mainLayout.width * 0.8),
	});

	// Same style as .multiplier-text (see styles/multiplier.css) / the total win amount
	const freeSpinsFontSize = $derived(layoutType === 'desktop' ? 60 * 1.85 : 60 * 1.5);
	const freeSpinsStyle = $derived.by((): TextStyleOptions => {
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
			fontFamily: 'Dokdo, Crom, Arial, sans-serif',
			fontSize: freeSpinsFontSize,
			align: 'center' as const,
			fontWeight: 'normal' as TextStyleOptions['fontWeight'],
			fill: '#61E5FF',
			stroke: strokeGradient,
			strokeThickness: 5,
			lineJoin: 'round',
			dropShadow: true,
			dropShadowColor: '#BF00B5',
			dropShadowBlur: 0,
			dropShadowAngle: Math.atan2(6, 3),
			dropShadowDistance: Math.hypot(3, 6),
			padding: 20, // keep stroke/shadow inside the texture bounds
		} as TextStyleOptions;
	});

	// Vertical stack: congr.png -> YOU WON -> N FREE SPINS -> description
	const congrWidth = $derived(Math.min(CONGR_SIZES.width * 0.72, mainLayout.width * 0.62));
	const congrHeight = $derived(congrWidth * (CONGR_SIZES.height / CONGR_SIZES.width));
	const freeSpinsBlockHeight = $derived(freeSpinsFontSize * 1.15);

	const centerX = $derived(mainLayout.width * 0.5);
	const congrY = $derived(mainLayout.height * 0.1);
	const youWonY = $derived(congrY + congrHeight + 26 * textScale);
	const freeSpinsY = $derived(youWonY + youWonSizes.height + 34 * textScale);
	const descriptionY = $derived(freeSpinsY + freeSpinsBlockHeight + 34 * textScale - 40);

	// Same button as the click-to-continue screen
	const buttonWidth = 436;
	const buttonHeight = 106;
	const buttonScale = 0.75;
	const buttonX = $derived(mainLayout.width * 0.5);
	const buttonY = $derived(mainLayout.height - 125);
	const buttonSpriteKey = $derived(isHovered ? 'button_grey.png' : 'button_inactive.png');
	const buttonTextStyle = $derived({
		fontFamily: 'Kanit, Arial, sans-serif',
		fontSize: UI_BASE_FONT_SIZE * 0.3 * 1.15 * 1.2 * 1.15,
		fontWeight: 600 as TextStyleOptions['fontWeight'],
		fill: 0x61e5ff,
		align: 'center' as const,
	});

	const handlePress = () => {
		if (!show) return;
		show = false;
		isHovered = false;
		const resolve = oncomplete;
		oncomplete = () => {};
		resolve();
	};

	context.eventEmitter.subscribeOnMount({
		bonusIntroPopupShow: async (emitterEvent) => {
			totalFreeSpins = emitterEvent.totalFreeSpins;
			show = true;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
		bonusIntroPopupHide: () => handlePress(),
	});
</script>

{#if show}
	<FadeContainer {show} zIndex={20000}>
		<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.91} eventMode="none" />

		<!-- Same dust overlay as the buy bonus popup, sized in canvas pixels to match it -->
		{#if dustTexture}
			<BaseSprite
				texture={dustTexture}
				anchor={0.5}
				x={canvasSizes.width * 0.5}
				y={canvasSizes.height * 0.5}
				width={DUST_FRAME.width * DUST_SCALE}
				height={DUST_FRAME.height * DUST_SCALE}
				eventMode="none"
			/>
		{/if}

		<!-- Fullscreen click catcher, so a tap anywhere continues (same as the total win screen) -->
		<Container
			zIndex={1}
			eventMode="static"
			cursor="pointer"
			interactive={true}
			hitArea={new PIXI.Rectangle(0, 0, canvasSizes.width, canvasSizes.height)}
			onpointerup={() => handlePress()}
		>
			<MainContainer>
				<Sprite
					key="congr.png"
					anchor={{ x: 0.5, y: 0 }}
					x={centerX}
					y={congrY}
					width={congrWidth}
					height={congrHeight}
					eventMode="none"
				/>

				<Text
					text="YOU WON"
					style={youWonStyle}
					anchor={{ x: 0.5, y: 0 }}
					x={centerX}
					y={youWonY}
					onresize={(sizes) => (youWonSizes = sizes)}
					eventMode="none"
				/>

				<Container x={centerX} y={freeSpinsY + freeSpinsBlockHeight * 0.5} eventMode="none">
					{#if dokdoReady}
						<ResponsiveText
							anchor={0.5}
							maxWidth={mainLayout.width * 0.8}
							text={`${totalFreeSpins} FREE SPINS`}
							style={freeSpinsStyle}
						/>
					{/if}
				</Container>

				<Text
					text="Increased chance of monster elixir and sword symbols during the bonus game"
					style={descriptionStyle}
					anchor={{ x: 0.5, y: 0 }}
					x={centerX}
					y={descriptionY}
					eventMode="none"
				/>
			</MainContainer>
		</Container>

		<Container zIndex={2}>
			<MainContainer alignVertical="bottom">
				<Container
					x={buttonX}
					y={buttonY}
					eventMode="static"
					cursor="pointer"
					interactive={true}
					hitArea={new PIXI.Rectangle(
						-buttonWidth * buttonScale * 0.5,
						-buttonHeight * buttonScale * 0.5,
						buttonWidth * buttonScale,
						buttonHeight * buttonScale,
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
						style={buttonTextStyle}
						anchor={{ x: 0.5, y: 0.5 }}
						x={0}
						y={5}
						eventMode="none"
					/>
				</Container>
			</MainContainer>
		</Container>
	</FadeContainer>

	<OnHotkey hotkey="Space" onpress={handlePress} />
{/if}
