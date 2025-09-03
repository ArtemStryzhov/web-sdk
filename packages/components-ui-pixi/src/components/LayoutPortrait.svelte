<script lang="ts">
	console.log('🎮 [DEBUG] LayoutPortrait.svelte is being applied');

	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	import { stateUi } from 'state-shared';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';

	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';
	import ButtonDrawer from './ButtonDrawer.svelte';
	import type { LayoutUiProps } from '../types';
	import { getContext } from '../context';

	const props: LayoutUiProps = $props();
	const context = getContext();

	const DRAWER_Y = {
		unfold: 0,
		fold: 550,
	};
	const drawerTween = new Tween(stateUi.drawerFold ? DRAWER_Y.fold : DRAWER_Y.unfold, {
		easing: cubicInOut,
	});

	const DRAWER_BUTTON_Y = {
		unfold: 0,
		fold: 50,
	};
	const drawerButtonTween = new Tween(
		stateUi.drawerFold ? DRAWER_BUTTON_Y.fold : DRAWER_BUTTON_Y.unfold,
		{
			easing: cubicInOut,
		},
	);

	let drawerButtonFadeComplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		drawerButtonShow: async () => {
			if (!stateUi.drawerButtonShow) {
				stateUi.drawerButtonShow = true;
				await waitForResolve((resolve) => (drawerButtonFadeComplete = resolve));
			}
		},
		drawerButtonHide: async () => {
			if (stateUi.drawerButtonShow) {
				stateUi.drawerButtonShow = false;
				await waitForResolve((resolve) => (drawerButtonFadeComplete = resolve));
			}
		},
		drawerUnfold: async () => {
			if (stateUi.drawerFold) {
				drawerButtonTween.set(DRAWER_BUTTON_Y.unfold);
				await drawerTween.set(DRAWER_Y.unfold);
			}
		},
		drawerFold: async () => {
			if (!stateUi.drawerFold) {
				drawerButtonTween.set(DRAWER_BUTTON_Y.fold);
				await drawerTween.set(DRAWER_Y.fold);
			}
		},
	});
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard alignVertical="bottom">
	<!-- drawer container -->
	<Container y={drawerTween.current}>
		<Container
		x={context.stateLayoutDerived.mainLayoutStandard().width * 0.01 + 60}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 390}
		>
			{@render props.buttonBuyBonus({ anchor: 0.5 })}
		</Container>

		{#if !stateUi.menuOpen}
			<Container
				x={context.stateLayoutDerived.mainLayoutStandard().width * 0.01 + 60}
				y={context.stateLayoutDerived.mainLayoutStandard().height - 260}
			>
				{@render props.buttonMenu({ anchor: 0.5, scale: 1.5 })}
			</Container>
		{/if}




		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 + 310}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 170}
		>
			{@render props.amountBet({ stacked: true })}
		</Container>

		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 400}
		>
			{@render props.buttonBet({ anchor: 0.5 })}
		</Container>



		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 - 440 + 50 + 30}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 170}
		>
			{@render props.amountBalance({ stacked: true })}
		</Container>
	</Container>

	<Container y={drawerTween.current}>
		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 255}
		>
			{@render props.amountWin({ stacked: true })}
		</Container>
	</Container>
</MainContainer>

<MainContainer standard alignVertical="bottom">
	{#if stateUi.freeSpinCounterShow}
		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 130}
		>
			<LabelFreeSpinCounter stacked />
		</Container>
	{:else}
		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 -200}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 85 - 300}
		>
			{@render props.buttonDecrease({ anchor: 0.5 })}
		</Container>

		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 + 200}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 85 - 300}
		>
			{@render props.buttonIncrease({ anchor: 0.5 })}
		</Container>
	{/if}

	<!-- drawer button -->
	<FadeContainer
		persistent
		show={stateUi.drawerButtonShow}
		oncomplete={drawerButtonFadeComplete}
		y={drawerButtonTween.current}
	>
		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 + 440}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 105}
		>
			<ButtonDrawer disabled={!stateUi.drawerButtonShow} anchor={0.5} />
		</Container>


	</FadeContainer>
</MainContainer>

{#if stateUi.menuOpen}
	<Rectangle
		alpha={0.95}
		anchor={0.5}
		backgroundColor={0x141417}
		width={context.stateLayoutDerived.canvasSizes().width}
		height={context.stateLayoutDerived.canvasSizes().height}
		x={context.stateLayoutDerived.canvasSizes().width * 0.5}
		y={context.stateLayoutDerived.canvasSizes().height * 0.5}
		eventMode="static"
		onpointerdown={(e) => e.stopPropagation()}
		onpointerup={(e) => e.stopPropagation()}
		onpointerover={(e) => e.stopPropagation()}
		onpointerout={(e) => e.stopPropagation()}
		onclick={(e) => e.stopPropagation()}
	/>

	<MainContainer standard alignVertical="bottom">

		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 - 440}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 400}
		>
			<Container y={-190 - 210 * 3} x={450}>
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container y={-190 - 210 * 2} x={450}>
				{@render props.buttonTurbo({ anchor: 0.5 })}
			</Container>

			<Container scale={2.4} y={ -500} x={350}>
				{@render props.buttonSoundSwitch({ anchor: 0.5, inMenu: true })}
			</Container>

		</Container>
	</MainContainer>

	<!-- Close button at top right corner -->
	<Container
		x={context.stateLayoutDerived.canvasSizes().width - 40}
		y={context.stateLayoutDerived.canvasSizes().width * 0.15}
		scale={1.5}
	>
		{@render props.buttonClose({ anchor: 1 })}
	</Container>
{/if}

<!-- AutoSpin button - positioned AFTER all overlays to ensure it's on top -->
<Container
	x={context.stateLayoutDerived.canvasSizes().width * 0.9}
	y={context.stateLayoutDerived.canvasSizes().height * 0.93}
>
	{@render props.buttonAutoSpin({ anchor: 0.5 })}
</Container>


