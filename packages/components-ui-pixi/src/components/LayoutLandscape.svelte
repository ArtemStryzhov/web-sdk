<script lang="ts">
	console.log('🎮 [DEBUG] LayoutLandscape.svelte is being applied');

	import { stateUi } from 'state-shared';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, anchorToPivot } from 'pixi-svelte';

	import { LANDSCAPE_BASE_SIZE, LANDSCAPE_BACKGROUND_WIDTH_LIST } from '../constants';
	import type { LayoutUiProps } from '../types';
	import { getContext } from '../context';

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
		y={context.stateLayoutDerived.mainLayoutStandard().height - LANDSCAPE_BASE_SIZE - 40}
		pivot={anchorToPivot({
			anchor: { x: 0.5, y: 0 },
			sizes: {
				height: LANDSCAPE_BASE_SIZE,
				width: LANDSCAPE_BACKGROUND_WIDTH_LIST.reduce((sum, width) => sum + width, 0),
			},
		})}
	>
		<Container y={LANDSCAPE_BASE_SIZE * 0.5 - 170} x={85 + 20} scale={0.8}>
			{@render props.buttonBuyBonus({ anchor: 0.5 })}
		</Container>

		{#if !stateUi.menuOpen}
			<Container y={LANDSCAPE_BASE_SIZE * 0.5 - 90} x={85 + 20} scale={0.8}>
				{@render props.buttonMenu({ anchor: 0.5 })}
			</Container>
		{/if}

		<Container y={LANDSCAPE_BASE_SIZE * 0.5 - 90} x={85 + 20 + 50} scale={0.8}>
			{@render props.buttonSoundSwitch({ anchor: 0.5 })}
		</Container>

		<Container y={LANDSCAPE_BASE_SIZE * 0.5 - 90} x={85 + 20 + 50 + 30} scale={0.8}>
			{@render props.amountBalance({ stacked: true })}
		</Container>

		<Container y={LANDSCAPE_BASE_SIZE * 0.5 - 90} x={85 + 20 + 50 + 30 + 260} scale={0.8}>
			{@render props.amountWin({ stacked: true })}
		</Container>

		<Container y={LANDSCAPE_BASE_SIZE * 0.5 - 90} x={1647.5} scale={0.8}>
			{@render props.buttonDecrease({ anchor: 0.5 })}
		</Container>

		<Container y={LANDSCAPE_BASE_SIZE * 0.5 + 50} x={1647.5} scale={0.8}>
			{@render props.buttonIncrease({ anchor: 0.5 })}
		</Container>
	</Container>

	<Container
		x={context.stateLayoutDerived.mainLayoutStandard().width - 60}
		y={context.stateLayoutDerived.mainLayoutStandard().height * 0.5}
		pivot={anchorToPivot({
			anchor: { x: 1, y: 0.5 },
			sizes: {
				height: LANDSCAPE_BASE_SIZE,
				width: LANDSCAPE_BASE_SIZE,
			},
		})}
	>
		<Container x={LANDSCAPE_BASE_SIZE * 0.5} y={LANDSCAPE_BASE_SIZE * 0.5 - 140} scale={0.8}>
			{@render props.buttonAutoSpin({ anchor: 0.5 })}
		</Container>

		<Container x={LANDSCAPE_BASE_SIZE * 0.5} y={LANDSCAPE_BASE_SIZE * 0.5 - 70} scale={0.8}>
			{@render props.amountBet({ stacked: true })}
		</Container>

		<Container x={LANDSCAPE_BASE_SIZE * 0.5} y={LANDSCAPE_BASE_SIZE * 0.5} scale={0.8}>
			{@render props.buttonBet({ anchor: 0.5 })}
		</Container>


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
			x={165}
			y={context.stateLayoutDerived.mainLayoutStandard().height - LANDSCAPE_BASE_SIZE - 130}
		>
			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150 - 170 * 2} x={LANDSCAPE_BASE_SIZE * 4}>
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150 - 170 * 2} x={LANDSCAPE_BASE_SIZE * 7.5}>
				{@render props.buttonTurbo({ anchor: 0.5 })}
			</Container>

			<Container scale={1.92} y={LANDSCAPE_BASE_SIZE * 0.5 - 150 - 170 * 1} x={LANDSCAPE_BASE_SIZE * 5.2}>
				{@render props.buttonSoundSwitch({ anchor: 0.5, inMenu: true })}
			</Container>

		</Container>
	</MainContainer>

	<!-- Close button positioned at top right corner of screen -->
	<Container x={context.stateLayoutDerived.canvasSizes().width - 80} y={80} scale={0.8}>
		{@render props.buttonClose({ anchor: 0.5 })}
	</Container>
{/if}
