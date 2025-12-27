<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Text, REM, Container, Sprite, Graphics } from 'pixi-svelte';
	import { stateModal } from 'state-shared';

	import { UI } from 'components-ui-pixi';
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
const mainLayout = $derived(context.stateLayoutDerived.mainLayout());
const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());
const mainLayoutStandard = $derived(context.stateLayoutDerived.mainLayoutStandard());
const shouldUsePortraitStyle = $derived(
	isPortraitLayout || canvasSizes.width < 800
);
const logoScale = $derived(canvasSizes.width < 950 ? 0.5 : 1);

	// Mascot positioning
	const boardLayout = $derived(context.stateGameDerived.boardLayout());
	const mascotWidth = 500;
	const mascotHeight = 550;
	const mascotScalePortrait = 0.55; // 20% smaller on portrait
	const mascotScaleSmall = $derived(
		canvasSizes.width < 380 ? mascotScalePortrait * 0.8 : mascotScalePortrait
	);
	
	// Desktop/Landscape position: left side of board, 20px to the left
	const mascotXDesktop = $derived(
		boardLayout.x - boardLayout.width / 2 - 20 - mascotWidth / 2
	);
	const mascotYDesktop = $derived(boardLayout.y);
	
	// Portrait position: below board, 15px above menu button
	const menuButtonX = $derived(mainLayoutStandard.width * 0.01 + 60);
	const menuButtonY = $derived(mainLayoutStandard.height - 260);
	const mascotXPortrait = $derived(
		menuButtonX + (canvasSizes.width > 480 && canvasSizes.width < 530 ? 15 : 0)
	);
	const mascotYPortrait = $derived(
		menuButtonY - 15 - (mascotHeight * mascotScalePortrait) / 2 - (canvasSizes.width < 380 ? 15 : 0)
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
		// Access derived values to trigger reactivity
		const size = canvasSizes;
		const layout = layoutType;
		const main = mainLayout;
		
		// Update resize trigger to force re-evaluation of all dependent components
		resizeTrigger++;
		
		// Log layout type
		console.log(`[Layout] Type: ${layout}, Size: ${size.width}x${size.height}`);
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
			<Container zIndex={10004} x={canvasSizes.width / 2} y={60}>
				<Sprite
					key="logo_s.png"
					anchor={{ x: 0.5, y: 0 }}
					x={0}
					y={0}
					width={250 * logoScale}
					height={129 * logoScale}
					zIndex={10004}
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
			amountBet={amountBetSnippet}
			buttonBuyBonus={buttonBuyBonusSnippet}
			buttonAutoSpin={buttonAutoSpinSnippet}
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
	{@const logoHeight = 129 * logoScale}
	{@const logoY = frameTopCanvasY + logoHeight}
	{@const logoXCenteredCanvas = canvasSizes.width / 2}
	{@const logoXRightCanvas = frameRightCanvasX}
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
			width={250 * logoScale}
			height={logoHeight}
		/>
	{/if}
{/snippet}

{#snippet amountBetSnippet(labelProps: any)}
	<LabelBet {...labelProps} />
{/snippet}

{#snippet buttonBuyBonusSnippet(buttonProps: any)}
	<ButtonBuyBonus {...buttonProps} />
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
