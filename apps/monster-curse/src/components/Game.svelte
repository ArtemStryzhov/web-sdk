<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Text, REM, Container, Sprite, Graphics } from 'pixi-svelte';
	import { stateModal } from 'state-shared';

	import { UI, LabelBalance, ButtonMenu } from 'components-ui-pixi';
	import { UI_BASE_FONT_SIZE } from 'components-ui-pixi/src/constants';
	import { GameVersion, Modals } from 'components-ui-html';

	import { getContext } from '../game/context';
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
const mainLayout = $derived(context.stateLayoutDerived.mainLayout());
const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());
const mainLayoutStandard = $derived(context.stateLayoutDerived.mainLayoutStandard());
const shouldUsePortraitStyle = $derived(
	isPortraitLayout || canvasSizes.width < 800
);
const logoScale = $derived(canvasSizes.width < 950 ? 0.5 : 1);
	const portraitLogoScale = $derived(logoScale * 1.05);
	const nonPortraitLogoScale = $derived(
		isDesktopLayout ? logoScale * 1.21 : isTabletLayout ? logoScale * 1.6 : logoScale
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
	const portraitStandardLeftScreenX = $derived(
		canvasSizes.width * 0.5 - mainLayoutStandard.width * mainLayoutStandard.scale * 0.5
	);
	const portraitLogoY = $derived(
		isPortraitLayout && (canvasSizes.width < 350 || canvasSizes.height < 570) ? 30 : 65
	);
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
		isPortraitLayout && canvasSizes.width < 450 ? 30 * portraitUiUnitPerScreenPixel : 0
	);
	const portraitBalanceX = $derived(portraitBalanceBaseX + narrowPortraitLabelOffset);
	const portraitBalanceScreenX = $derived(
		portraitStandardLeftScreenX + portraitBalanceX * mainLayoutStandard.scale
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
		(portraitMenuTargetScreenX - portraitStandardLeftScreenX) * portraitUiUnitPerScreenPixel
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
		menuButtonX + (canvasSizes.width > 480 && canvasSizes.width < 530 ? 15 : 0)
	);
	const mascotYPortrait = $derived(
		menuButtonY - 20 - 20 * portraitUiUnitPerScreenPixel - (mascotHeight * mascotScalePortrait) / 2 - (canvasSizes.width < 380 ? 15 : 0) + narrowPortraitMascotYOffset
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

	// Throttle function for resize logging
	const throttle = (func: () => void, delay: number) => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		let lastExecTime = 0;
		return () => {
			const currentTime = Date.now();
			if (currentTime - lastExecTime > delay) {
				func();
				lastExecTime = currentTime;
			} else {
				if (timeoutId) clearTimeout(timeoutId);
				timeoutId = setTimeout(() => {
					func();
					lastExecTime = Date.now();
				}, delay - (currentTime - lastExecTime));
			}
		};
	};

	// Handle resize - trigger reactivity updates
	const handleResize = () => {
		// Update resize trigger to force re-evaluation of all dependent components
		resizeTrigger++;
	};

	onMount(() => {
		context.stateLayout.showLoadingScreen = true;

		// Log layout type on load
		handleResize();

		// Throttled resize handler (300ms throttle)
		const throttledResize = throttle(() => {
			handleResize();
		}, 300);

		// Add resize listener
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', throttledResize);
		}

		// Cleanup resize listener
		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('resize', throttledResize);
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
					width={250 * portraitLogoScale}
					height={129 * portraitLogoScale}
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
					x={mascotXPortrait}
					y={mascotYPortrait}
					width={mascotWidth}
					height={mascotHeight}
					anchor={{ x: 0.5, y: 0.5 }}
					zIndex={10010}
					format="lottie"
					loop={true}
					autoplay={true}
					scale={mascotScaleSmall}
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
					format="lottie"
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
	{@const SPRITE_SCALE = { width: 1.18, height: 1.18 }}
	{@const POSITION_ADJUSTMENT = 1.01 }
	{@const frameWidth = boardLayout.width * SPRITE_SCALE.width}
	{@const frameHeight = boardLayout.height * SPRITE_SCALE.height}
	{@const centerX = boardLayout.x * POSITION_ADJUSTMENT}
	{@const centerY = boardLayout.y * POSITION_ADJUSTMENT}
	{@const frameRightMainX = centerX + frameWidth / 2}
	{@const frameTopMainY = centerY - frameHeight / 2}
	{@const frameRightCanvasX = mainLayout.x + (frameRightMainX - mainLayout.width / 2) * mainLayout.scale}
	{@const frameTopCanvasY = mainLayout.y + (frameTopMainY - mainLayout.height / 2) * mainLayout.scale}
	{@const containerX = canvasSizes.width - 20}
	{@const shouldCenterLogo = canvasSizes.width < 650}
	{@const logoWidth = 250 * nonPortraitLogoScale}
	{@const logoHeight = 129 * nonPortraitLogoScale}
	{@const logoY = frameTopCanvasY + logoHeight - (isTabletLayout ? 60 : 0)}
	{@const logoXCenteredCanvas = canvasSizes.width / 2}
	{@const logoXRightCanvas = frameRightCanvasX + (isDesktopLayout ? 30 : 0)}
	{@const logoXCentered = logoXCenteredCanvas - containerX}
	{@const logoXRight = logoXRightCanvas - containerX}
	{@const logoXFinal = shouldCenterLogo ? logoXCentered : logoXRight}
	{@const logoAnchor = shouldCenterLogo ? { x: 0.5, y: 1 } : { x: 0, y: 1 }}

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
	<ButtonBuyBonus {...buttonProps} scale={buyBonusScale} />
{/snippet}

{#snippet buttonAutoSpinSnippet(buttonProps: any)}
	<ButtonAutoSpin {...buttonProps} />
{/snippet}

		<Win />
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
