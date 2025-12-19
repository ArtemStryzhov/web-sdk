<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Text, REM, Container, Sprite } from 'pixi-svelte';
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
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import I18nTest from './I18nTest.svelte';
	import BottomGradient from './BottomGradient.svelte';
	import LabelBet from './LabelBet.svelte';
	import ButtonBuyBonus from './ButtonBuyBonus.svelte';
	import ButtonAutoSpin from './ButtonAutoSpin.svelte';
	import StoneFXOverlay from './StoneFXOverlay.svelte';

	const context = getContext();

	// Reactive state to trigger updates on resize
	let resizeTrigger = $state(0);

	// Layout type for logging
const layoutType = $derived(context.stateLayoutDerived.layoutType());
const isPortraitLayout = $derived(layoutType === 'portrait');
const mainLayout = $derived(context.stateLayoutDerived.mainLayout());
const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());

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
			<MainContainer alignVertical="center" zIndex={10003}>
				<Container x={0} y={-mainLayout.height * 0.5 + 40} eventMode="none">
					<Sprite
						key="logo_s.png"
						anchor={{ x: 0.5, y: 0 }}
						x={0}
						y={0}
						width={250}
						height={129}
					/>
				</Container>
			</MainContainer>
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
	{@const logoX = frameRightCanvasX - containerX + 20}
	{@const logoY = frameTopCanvasY}

	{#if !isPortraitLayout}
		<Sprite
			x={logoX}
			y={logoY}
			anchor={{ x: 0, y: 0 }}
			key="logo_s.png"
			width={250}
			height={129}
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
