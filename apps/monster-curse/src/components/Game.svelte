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
	import StoneFXOverlay from './StoneFXOverlay.svelte';

	const context = getContext();

	onMount(() => (context.stateLayout.showLoadingScreen = true));

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
	<Sprite
		x={logoX}
		y={logoY}
		anchor={{ x: 0, y: 0 }}
		key="logo_s.png"
		width={250}
		height={129}
	/>
{/snippet}

{#snippet amountBetSnippet(labelProps: any)}
	<LabelBet {...labelProps} />
{/snippet}

{#snippet buttonBuyBonusSnippet(buttonProps: any)}
	<ButtonBuyBonus {...buttonProps} />
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
