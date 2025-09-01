<script lang="ts">
	console.log('🎮 [DEBUG] LayoutTablet.svelte is being applied');

	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, anchorToPivot } from 'pixi-svelte';

	import { getContext } from '../context';
	import type { LayoutUiProps } from '../types';
	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';
	import { DESKTOP_BASE_SIZE, DESKTOP_BACKGROUND_WIDTH_LIST } from '../constants';

	const props: LayoutUiProps = $props();
	const context = getContext();
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard alignVertical="bottom">
	<Container
		x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
		y={context.stateLayoutDerived.mainLayoutStandard().height - DESKTOP_BASE_SIZE - 30}
		pivot={anchorToPivot({
			anchor: { x: 0.5, y: 0 },
			sizes: {
				height: DESKTOP_BASE_SIZE,
				width: DESKTOP_BACKGROUND_WIDTH_LIST.reduce((sum, width) => sum + width, 0),
			},
		})}
	>
		<Container y={DESKTOP_BASE_SIZE * 0.5} x={120}>
			{@render props.amountBalance({ stacked: false })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.5 - 15} x={640}>
			{@render props.amountWin({ stacked: false })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.5 - 100} x={20}>
			{@render props.buttonBuyBonus({ anchor: 0.5 })}
		</Container>

		{#if !stateUi.menuOpen}
			<Container y={DESKTOP_BASE_SIZE * 0.5} x={20}>
				{@render props.buttonMenu({ anchor: 0.5 })}
			</Container>
		{/if}

		<Container y={DESKTOP_BASE_SIZE * 0.5} x={80}>
			{@render props.buttonSoundSwitch({ anchor: 0.5 })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.5 - 10} x={360 + 180 * 5} scale={0.8}>
			{@render props.buttonAutoSpin({ anchor: 0.5 })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.5 - 140} x={360 + 180 * 5}>
			{@render props.amountBet({ stacked: true })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.5 - 50} x={600 + 180 * 5}>
			{@render props.buttonBet({ anchor: 0.5 })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.5 - 105} x={1560 + 90}>
			{@render props.buttonDecrease({ anchor: 0.5 })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.5 -10} x={1560 + 90}>
			{@render props.buttonIncrease({ anchor: 0.5 })}
		</Container>



		{#if stateUi.freeSpinCounterShow}
			<Container y={DESKTOP_BASE_SIZE * 0.5 - 320} x={668}>
				<LabelFreeSpinCounter />
			</Container>
		{/if}
	</Container>
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
			x={100}
			y={context.stateLayoutDerived.mainLayoutStandard().height - DESKTOP_BASE_SIZE - 30}
		>
			<Container y={DESKTOP_BASE_SIZE * 0.5 - 185 - 210 * 6} x={DESKTOP_BASE_SIZE * 4} >
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container y={DESKTOP_BASE_SIZE * 0.5 - 185 - 210 * 6} x={DESKTOP_BASE_SIZE * 9}>
				{@render props.buttonTurbo({ anchor: 0.5 })}
			</Container>

			<Container scale={2.4} y={DESKTOP_BASE_SIZE * 0.5 - 185 - 210 * 5} x={DESKTOP_BASE_SIZE * 5.5}>
				{@render props.buttonSoundSwitch({ anchor: 0.5, inMenu: true })}
			</Container>

		</Container>
	</MainContainer>

	<!-- Close button positioned at top right corner of screen -->
	<Container x={context.stateLayoutDerived.canvasSizes().width - 80} y={80}>
		{@render props.buttonClose({ anchor: 0.5 })}
	</Container>
{/if}
