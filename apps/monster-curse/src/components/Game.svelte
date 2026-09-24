<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Text, REM, Container, Sprite, Graphics } from 'pixi-svelte';
	import { stateModal, stateBet } from 'state-shared';

	import { UI, LabelBalance, ButtonMenu } from 'components-ui-pixi';
	import LabelWin from 'components-ui-pixi/src/components/LabelWin.svelte';
	import {
		UI_BASE_FONT_SIZE,
		DESKTOP_BACKGROUND_WIDTH_LIST,
		LANDSCAPE_BACKGROUND_WIDTH_LIST,
	} from 'components-ui-pixi/src/constants';
	import { GameVersion, Modals, ReplayPanel } from 'components-ui-html';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import assets from '../game/assets';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import Board from './Board.svelte';
	import Anticipations from './Anticipations.svelte';
	import Win from './Win.svelte';
	import BonusIntroPopup from './BonusIntroPopup.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import I18nTest from './I18nTest.svelte';
	import BottomGradient from './BottomGradient.svelte';
	import LabelBet from './LabelBet.svelte';
	import ButtonBuyBonus from './ButtonBuyBonus.svelte';
	import ButtonAutoSpin from './ButtonAutoSpin.svelte';
	import StoneFXOverlay from './StoneFXOverlay.svelte';
	import Mascot from './Mascot.svelte';

	const context = getContext();

	// Track if FreeSpinOutro is showing for background overlay
	let freeSpinOutroShowing = $state(false);

	// Track if win screen is showing (for mascot version switching)
	let winScreenShowing = $state(false);

	// Reactive state to trigger updates on resize
	let resizeTrigger = $state(0);

	// Layout type for logging
const layoutType = $derived(context.stateLayoutDerived.layoutType());
const isPortraitLayout = $derived(layoutType === 'portrait');
	const isTabletLayout = $derived(layoutType === 'tablet');
	const isDesktopLayout = $derived(layoutType === 'desktop');
	const isLandscapeLayout = $derived(layoutType === 'landscape');
const mainLayout = $derived(context.stateLayoutDerived.mainLayout());
const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());
const mainLayoutStandard = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const isUltraShortScreen = $derived(canvasSizes.width <= 420 && canvasSizes.height <= 260);
const shouldUsePortraitStyle = $derived(
	isPortraitLayout || canvasSizes.width < 800
);

	const isLogoMidWidthScreen = $derived(
		canvasSizes.width > 769 && canvasSizes.width < 1100
	);
	const logoScale = $derived(canvasSizes.width < 950 ? 0.5 : 1);
	const logoResponsiveScaleFactor = $derived(isLogoMidWidthScreen ? 0.9 : 1);
	const portraitLogoScale = $derived(logoScale * 1.05);
	const nonPortraitLogoScale = $derived(
		(isDesktopLayout ? logoScale * 1.21 : isTabletLayout ? logoScale * 1.6 : logoScale) *
			logoResponsiveScaleFactor
	);
	const buyBonusScale = $derived(
		canvasSizes.width < 380
			? 0.85 * 0.96 * 0.95
			: isPortraitLayout && canvasSizes.width < 450
				? 0.85 * 0.96
			: isPortraitLayout && canvasSizes.width < 600
				? 0.85
				: 1
	);
	const isPortraitCompactScreen = $derived(
		isPortraitLayout && (canvasSizes.width < 450 || canvasSizes.height < 600)
	);
	const portraitMenuScale = $derived(isPortraitCompactScreen ? 1.2 : 1);
	const portraitLabelScale = $derived(isPortraitCompactScreen ? 0.85 : 1);
	const portraitUiUnitPerScreenPixel = $derived(mainLayoutStandard.scale ? 1 / mainLayoutStandard.scale : 1);
	// Screen x of the left edge of `MainContainer standard` (origin of standard layout coords)
	const standardLeftScreenX = $derived(
		canvasSizes.width * 0.5 - mainLayoutStandard.width * mainLayoutStandard.scale * 0.5
	);
	const portraitLogoY = $derived(
		isPortraitLayout && (canvasSizes.width < 350 || canvasSizes.height < 570)
			? 30
			: canvasSizes.width <= 375 && canvasSizes.height <= 667
				? 45
				: 65
	);
	const portraitLogoScaledSize = $derived(portraitLogoScale * logoResponsiveScaleFactor);
	const portraitBalanceBaseX = $derived(mainLayoutStandard.width * 0.5 - 440 + 50 + 30);
	const portraitBalanceBaseY = $derived(mainLayoutStandard.height - 170);
	const narrowPortraitBetOffset = $derived(
		isPortraitLayout && canvasSizes.width < 450 ? -30 * portraitUiUnitPerScreenPixel : 0
	);
	const narrowPortraitMascotYOffset = $derived(
		isPortraitLayout && canvasSizes.width < 450 ? 10 * portraitUiUnitPerScreenPixel : 0
	);
	const narrowPortraitMenuYOffset = $derived(
		isPortraitLayout && canvasSizes.width < 450 ? -3 * portraitUiUnitPerScreenPixel : 0
	);
	const portraitMenuBaseX = $derived(mainLayoutStandard.width * 0.01 + 60);
	const portraitMenuBaseY = $derived(mainLayoutStandard.height - 260);
	const portraitMenuGapScreenPx = $derived(Math.max(15, Math.min(24, canvasSizes.width * 0.05)));
	const portraitLeftPaddingScreenPx = $derived(
		isPortraitCompactScreen ? 0 : Math.max(8, Math.min(20, canvasSizes.width * 0.025))
	);
	const portraitMenuHalfWidthScreenPx = $derived(
		60 * 1.5 * portraitMenuScale * mainLayoutStandard.scale
	);
	const portraitBalanceApproxHalfWidthScreenPx = $derived(
		Math.max(22, Math.min(36, canvasSizes.width * 0.09)) * portraitLabelScale
	);
	const portraitMenuAlignScreenOffsetPx = $derived(
		Math.max(12, Math.min(18, UI_BASE_FONT_SIZE * portraitLabelScale * mainLayoutStandard.scale * 1.3))
	);
	const narrowPortraitLabelOffset = $derived(
		isPortraitLayout && canvasSizes.width < 850 ? 30 * portraitUiUnitPerScreenPixel : 0
	);
	const portraitBalanceX = $derived(portraitBalanceBaseX + narrowPortraitLabelOffset);
	const portraitBalanceScreenX = $derived(
		standardLeftScreenX + portraitBalanceX * mainLayoutStandard.scale
	);
	const portraitMenuTargetScreenX = $derived(
		Math.max(
			portraitLeftPaddingScreenPx + portraitMenuHalfWidthScreenPx,
			portraitBalanceScreenX -
				portraitBalanceApproxHalfWidthScreenPx -
				portraitMenuHalfWidthScreenPx -
				portraitMenuGapScreenPx - 16,
		)
	);
	const portraitMenuTargetX = $derived(
		(portraitMenuTargetScreenX - standardLeftScreenX) * portraitUiUnitPerScreenPixel
	);
	const portraitMenuHorizontalOffset = $derived(
		isPortraitLayout ? portraitMenuTargetX - portraitMenuBaseX : 0
	);
	const portraitMenuVerticalOffset = $derived(
		isPortraitLayout
			? portraitBalanceBaseY - portraitMenuBaseY + portraitMenuAlignScreenOffsetPx * portraitUiUnitPerScreenPixel + narrowPortraitMenuYOffset
			: 0
	);
	const portraitMenuX = $derived(portraitMenuBaseX + portraitMenuHorizontalOffset);
	const portraitMenuY = $derived(portraitMenuBaseY + portraitMenuVerticalOffset);

	// Mascot positioning
	const boardLayout = $derived(context.stateGameDerived.boardLayout());
	const mascotWidth = 500;
	const mascotHeight = 550;
	const mascotScalePortrait = 0.55 * 1.1 * 1.18;
	const mascotScaleSmall = $derived(
		canvasSizes.width < 380 ? mascotScalePortrait * 1.2 : mascotScalePortrait
	);
	const mascotScaleDesktopOrTablet = $derived(isTabletLayout ? 1.2 : 1);
	
	// Desktop/Landscape position: left side of board, 20px to the left
	const mascotXDesktop = $derived(
		boardLayout.x - boardLayout.width / 2 - 20 - mascotWidth / 2
	);
	const mascotYDesktop = $derived(boardLayout.y);
	
	// Portrait position: below board, 15px above menu button
	const menuButtonX = $derived(portraitMenuX);
	const menuButtonY = $derived(portraitMenuY);
	const mascotXPortrait = $derived(
		menuButtonX +
			(canvasSizes.width > 480 && canvasSizes.width < 530 ? 15 : 0) +
			(isUltraShortScreen ? 40 * portraitUiUnitPerScreenPixel : 0)
	);
	const mascotYPortrait = $derived(
		menuButtonY - 20 - 20 * portraitUiUnitPerScreenPixel - (mascotHeight * mascotScalePortrait) / 2 - (canvasSizes.width < 380 ? 15 : 0) + narrowPortraitMascotYOffset
	);
	const mascotScalePortraitAdjusted = $derived(
		isUltraShortScreen ? mascotScaleSmall * 1.3 : mascotScaleSmall
	);
	// The portrait mascot tracks the menu button, which on narrow screens sits far
	// enough left to clip the art. Nudge it right until its frame is no further past
	// the left canvas edge than this (negative leaves the frame slightly overhanging,
	// which the art's own transparent padding absorbs).
	const MASCOT_MIN_EDGE_MARGIN_PX = -3;
	const mascotHalfWidthScreenPx = $derived(
		mascotWidth * 0.5 * mascotScalePortraitAdjusted * mainLayoutStandard.scale
	);
	const mascotPortraitCenterScreenX = $derived(
		standardLeftScreenX + mascotXPortrait * mainLayoutStandard.scale
	);
	const mascotXPortraitClamped = $derived(
		mascotXPortrait +
			Math.max(
				0,
				MASCOT_MIN_EDGE_MARGIN_PX + mascotHalfWidthScreenPx - mascotPortraitCenterScreenX,
			) *
				portraitUiUnitPerScreenPixel
	);

	// Board frame right edge in canvas space (BoardFrame draws the frame at 1.18x the board size)
	const FRAME_SPRITE_SCALE = 1.18;
	const FRAME_POSITION_ADJUSTMENT = 1.01;
	const RIGHT_GAP_EDGE_PADDING_PX = 20;
	const frameRightCanvasX = $derived(
		mainLayout.x +
			(boardLayout.x * FRAME_POSITION_ADJUSTMENT +
				(boardLayout.width * FRAME_SPRITE_SCALE) * 0.5 -
				mainLayout.width * 0.5) *
				mainLayout.scale
	);
	// Center of the free space between the board frame and the right canvas edge
	const rightGapCenterCanvasX = $derived((frameRightCanvasX + canvasSizes.width) * 0.5);

	// Buy bonus button: offsets applied on top of the position from the shared layout components
	const BUY_BONUS_SIZE = SYMBOL_SIZE * 3;
	const BUY_BONUS_SMALL_SCREEN_WIDTH = 480;
	const BUY_BONUS_SMALL_SCREEN_EDGE_PADDING_PX = 10;
	const BUY_BONUS_DESKTOP_Y_OFFSET_PX = -20;
	// Scale and base x of the wrapping container in each layout component
	const buyBonusLayoutScale = $derived(isTabletLayout ? 0.6 : 0.8);
	// Desktop/tablet/landscape hang the UI off a container centred on the background
	// width list, so its children start at this x, not at 0. Portrait has no such container.
	const buyBonusLayoutOriginStandardX = $derived(
		isPortraitLayout
			? 0
			: mainLayoutStandard.width * 0.5 -
				(isLandscapeLayout ? LANDSCAPE_BACKGROUND_WIDTH_LIST : DESKTOP_BACKGROUND_WIDTH_LIST).reduce(
					(sum, width) => sum + width,
					0,
				) * 0.5
	);
	const buyBonusBaseStandardX = $derived(
		buyBonusLayoutOriginStandardX +
			(isDesktopLayout
				? 1500 - 10
				: isTabletLayout
					? 1560 + 90 - 10 + 20 + 15
					: isPortraitLayout
						? mainLayoutStandard.width * 0.99 - 100
						: 1647.5 - 10 - 40)
	);
	const buyBonusScreenScale = $derived(buyBonusLayoutScale * mainLayoutStandard.scale);
	const buyBonusUnitPerScreenPixel = $derived(buyBonusScreenScale ? 1 / buyBonusScreenScale : 1);
	const buyBonusBaseCenterScreenX = $derived(
		standardLeftScreenX + buyBonusBaseStandardX * mainLayoutStandard.scale
	);
	const buyBonusHalfWidthScreenPx = $derived(
		BUY_BONUS_SIZE * buyBonusScale * buyBonusScreenScale * 0.5
	);
	const buyBonusHorizontalOffset = $derived.by(() => {
		// Desktop: center the button in the free space right of the board frame
		if (isDesktopLayout) {
			const targetScreenX = Math.min(
				rightGapCenterCanvasX,
				canvasSizes.width - RIGHT_GAP_EDGE_PADDING_PX - buyBonusHalfWidthScreenPx
			);
			return (targetScreenX - buyBonusBaseCenterScreenX) * buyBonusUnitPerScreenPixel;
		}
		// Small screens: keep the button off the right edge
		if (canvasSizes.width < BUY_BONUS_SMALL_SCREEN_WIDTH) {
			const maxCenterScreenX =
				canvasSizes.width - BUY_BONUS_SMALL_SCREEN_EDGE_PADDING_PX - buyBonusHalfWidthScreenPx;
			return (
				Math.min(0, maxCenterScreenX - buyBonusBaseCenterScreenX) * buyBonusUnitPerScreenPixel
			);
		}
		return 0;
	});
	const buyBonusVerticalOffset = $derived(
		isDesktopLayout ? BUY_BONUS_DESKTOP_Y_OFFSET_PX * buyBonusUnitPerScreenPixel : 0
	);

	// Force reactivity by accessing derived values when resizeTrigger changes
	$effect(() => {
		resizeTrigger; // Access resizeTrigger to establish dependency
		// Access all derived layout values to ensure they're re-evaluated
		const _ = {
			layoutType: layoutType,
			mainLayout: mainLayout,
			canvasSizes: canvasSizes,
		};
		// This ensures all components depending on these values will update
	});

	// Debounce resize recalculation to avoid excessive rerenders
	const debounce = (func: () => void, delay: number) => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			timeoutId = setTimeout(() => {
				func();
			}, delay);
		};
	};

	// Central recalculation hook for loading page, menu, and main game layout
	const recalculateAndRerender = () => {
		resizeTrigger++;
	};

	onMount(() => {
		context.stateLayout.showLoadingScreen = true;

		// Initial calculation on mount
		recalculateAndRerender();

		// Debounced resize handler (500ms)
		const debouncedResize = debounce(() => {
			recalculateAndRerender();
		}, 500);

		// Add resize/orientation listeners
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', debouncedResize);
			window.addEventListener('orientationchange', debouncedResize);
		}

		// Cleanup listeners
		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('resize', debouncedResize);
				window.removeEventListener('orientationchange', debouncedResize);
			}
		};
	});

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
		freeSpinOutroShow: () => (freeSpinOutroShowing = true),
		freeSpinOutroHide: () => (freeSpinOutroShowing = false),
		winShow: () => {
			// Win screen is shown, but we need to check winUpdate for the level
		},
		winHide: () => {
			winScreenShowing = false;
		},
		winUpdate: (emitterEvent) => {
			// Show win screen mascot (version 2) only for win levels >= 6 (big win, mega win, etc.)
			if (emitterEvent.winLevelData && emitterEvent.winLevelData.level >= 6) {
				winScreenShowing = true;
			} else {
				winScreenShowing = false;
			}
		},
	});
</script>

<App>
	<EnableSound />
	<EnableHotkey />
	<EnableGameActor />
	<EnablePixiExtension />

	<Background />

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
	{:else}
		{#if isPortraitLayout}
			<Container zIndex={9} x={canvasSizes.width / 2} y={portraitLogoY}>
				<Sprite
					key="logo_s.png"
					anchor={{ x: 0.5, y: 0 }}
					x={0}
					y={0}
					width={250 * portraitLogoScaledSize}
					height={129 * portraitLogoScaledSize}
					zIndex={9}
				/>
			</Container>
		{/if}

		<ResumeBet />
		<!--
			The reason why <Sound /> is rendered after clicking the loading screen:
			"Autoplay with sound is allowed if: The user has interacted with the domain (click, tap, etc.)."
			Ref: https://developer.chrome.com/blog/autoplay
		-->
		<Sound />

		<MainContainer>
			<BoardFrame />
		</MainContainer>

		<MainContainer>
			<Board />
			<Anticipations />
		</MainContainer>

		<!-- Animated Mascot -->
		{#if shouldUsePortraitStyle}
			<MainContainer standard alignVertical="bottom">
				<Mascot
					x={mascotXPortraitClamped}
					y={mascotYPortrait}
					width={mascotWidth}
					height={mascotHeight}
					anchor={{ x: 0.5, y: 0.5 }}
					zIndex={10010}
					loop={true}
					autoplay={true}
					scale={mascotScalePortraitAdjusted}
					version={winScreenShowing ? 2 : 1}
				/>
			</MainContainer>
		{:else}
			<MainContainer>
				<Mascot
					x={mascotXDesktop}
					y={mascotYDesktop}
					width={mascotWidth}
					height={mascotHeight}
					anchor={{ x: 0.5, y: 0.5 }}
					zIndex={10010}
					loop={true}
					autoplay={true}
					scale={mascotScaleDesktopOrTablet}
					version={winScreenShowing ? 2 : 1}
				/>
			</MainContainer>
		{/if}

		<!-- Bottom gradient background - renders behind UI buttons -->
		<BottomGradient />

		<Container zIndex={10}>
		<UI
			gameName={gameNameSnippet}
			logo={logoSnippet}
			amountBalance={amountBalanceSnippet}
			amountWin={amountWinSnippet}
			amountBet={amountBetSnippet}
			buttonBuyBonus={buttonBuyBonusSnippet}
			buttonAutoSpin={buttonAutoSpinSnippet}
			buttonMenu={buttonMenuSnippet}
		/>
	</Container>

	<StoneFXOverlay zIndex={100000} />

{#snippet gameNameSnippet()}
	<!-- Removed: Time and game name display -->
{/snippet}

{#snippet logoSnippet()}
	{@const boardLayout = context.stateGameDerived.boardLayout()}
	{@const mainLayout = context.stateLayoutDerived.mainLayout()}
	{@const canvasSizes = context.stateLayoutDerived.canvasSizes()}
	{@const frameHeight = boardLayout.height * FRAME_SPRITE_SCALE}
	{@const centerY = boardLayout.y * FRAME_POSITION_ADJUSTMENT}
	{@const frameTopMainY = centerY - frameHeight / 2}
	{@const frameTopCanvasY = mainLayout.y + (frameTopMainY - mainLayout.height / 2) * mainLayout.scale}
	{@const containerX = canvasSizes.width - 20}
	{@const shouldCenterLogo = canvasSizes.width < 650}
	{@const shouldUseUltraShortLogoLayout = !isPortraitLayout && canvasSizes.width <= 420 && canvasSizes.height <= 260}
	{@const logoSizeMultiplier = shouldUseUltraShortLogoLayout ? 0.6 : 1}
	{@const logoWidth = 250 * nonPortraitLogoScale * logoSizeMultiplier}
	{@const logoHeight = 129 * nonPortraitLogoScale * logoSizeMultiplier}
	{@const logoY = frameTopCanvasY + logoHeight - (isTabletLayout ? 60 : 0)}
	{@const logoXCenteredCanvas = canvasSizes.width / 2}
	{@const logoXRightCanvas = shouldUseUltraShortLogoLayout
		? frameRightCanvasX + 15
		: frameRightCanvasX + (isDesktopLayout ? 30 : 0)}
	{@const logoXCentered = logoXCenteredCanvas - containerX}
	{@const logoXRight = logoXRightCanvas - containerX}
	{@const centerLogoInRightGap = isDesktopLayout && !shouldUseUltraShortLogoLayout && !shouldCenterLogo}
	{@const logoXRightGapCentered =
		Math.min(
			rightGapCenterCanvasX,
			canvasSizes.width - RIGHT_GAP_EDGE_PADDING_PX - logoWidth * 0.5,
		) - containerX}
	{@const logoXFinal = centerLogoInRightGap
		? logoXRightGapCentered
		: shouldUseUltraShortLogoLayout ? logoXRight : shouldCenterLogo ? logoXCentered : logoXRight}
	{@const logoAnchor = centerLogoInRightGap
		? { x: 0.5, y: 1 }
		: shouldUseUltraShortLogoLayout ? { x: 0, y: 1 } : shouldCenterLogo ? { x: 0.5, y: 1 } : { x: 0, y: 1 }}

	{#if !isPortraitLayout}
		<Sprite
			x={logoXFinal}
			y={logoY}
			anchor={logoAnchor}
			key="logo_s.png"
			width={logoWidth}
			height={logoHeight}
		/>
	{/if}
{/snippet}

{#snippet amountBalanceSnippet(labelProps: any)}
	<Container x={narrowPortraitLabelOffset} scale={portraitLabelScale}>
		<LabelBalance {...labelProps} />
	</Container>
{/snippet}

{#snippet amountWinSnippet(labelProps: any)}
	{#if context.stateGame.gameType !== 'basegame' || stateBet.winBookEventAmount > 0}
		<LabelWin {...labelProps} />
	{/if}
{/snippet}

{#snippet amountBetSnippet(labelProps: any)}
	<Container x={narrowPortraitBetOffset} scale={portraitLabelScale}>
		<LabelBet {...labelProps} />
	</Container>
{/snippet}

{#snippet buttonMenuSnippet(buttonProps: any)}
	<Container x={portraitMenuHorizontalOffset} y={portraitMenuVerticalOffset} scale={portraitMenuScale}>
		<ButtonMenu {...buttonProps} />
	</Container>
{/snippet}

{#snippet buttonBuyBonusSnippet(buttonProps: any)}
	<Container x={buyBonusHorizontalOffset} y={buyBonusVerticalOffset}>
		<ButtonBuyBonus {...buttonProps} scale={buyBonusScale} />
	</Container>
{/snippet}

{#snippet buttonAutoSpinSnippet(buttonProps: any)}
	<ButtonAutoSpin {...buttonProps} />
{/snippet}

		<Win />
		<BonusIntroPopup />
		<FreeSpinIntro />
		<!-- Removed FreeSpinCounter - freespin count now shown on buy bonus button -->
		<FreeSpinOutro />
		<Transition />
		{#if false}
			<I18nTest />
		{/if}

	{/if}
</App>

<Modals>
	{#snippet version()}
		<GameVersion version="0.0.0" />
	{/snippet}
</Modals>

<!-- Replay window only: the round's start panel, and the replay button after it ends. -->
<ReplayPanel />
