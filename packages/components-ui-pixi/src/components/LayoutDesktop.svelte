<script lang="ts">
	console.log('🎮 [DEBUG] LayoutDesktop.svelte is being applied');

	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, anchorToPivot } from 'pixi-svelte';

	import { DESKTOP_BASE_SIZE, DESKTOP_BACKGROUND_WIDTH_LIST } from '../constants';
	import { getContext } from '../context';
	import type { LayoutUiProps } from '../types';

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
		y={context.stateLayoutDerived.mainLayoutStandard().height - DESKTOP_BASE_SIZE - 10}
		pivot={anchorToPivot({
			anchor: { x: 0.5, y: 0 },
			sizes: {
				height: DESKTOP_BASE_SIZE,
				width: DESKTOP_BACKGROUND_WIDTH_LIST.reduce((sum, width) => sum + width, 0),
			},
		})}
	>
		<Container y={DESKTOP_BASE_SIZE * 0.5} x={300} scale={0.8}>
			{@render props.amountBalance({ stacked: true })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.4} x={710} scale={0.8}>
			{@render props.amountWin({ stacked: true })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.5 - 100} x={220} scale={0.8}>
			{@render props.buttonBuyBonus({ anchor: 0.5 })}
		</Container>

		{#if !stateUi.menuOpen}
			<Container y={DESKTOP_BASE_SIZE * 0.5} x={220} scale={0.8}>
				{@render props.buttonMenu({ anchor: 0.5 })}
			</Container>
		{/if}

		<Container y={DESKTOP_BASE_SIZE * 0.5} x={220 + 50} scale={0.8}>
			{@render props.buttonSoundSwitch({ anchor: 0.5 })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.4} x={540 + 150 * 5} scale={0.8}>
			{@render props.buttonAutoSpin({ anchor: 0.5 })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.5 - 120} x={540 + 150 * 5} scale={0.8}>
			{@render props.amountBet({ stacked: true })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.25} x={720 + 150 * 5} scale={0.8}>
			{@render props.buttonBet({ anchor: 0.5 })}
		</Container>



		<Container y={DESKTOP_BASE_SIZE * 0.5 - 75} x={1500 + 75} scale={0.8}>
			{@render props.buttonDecrease({ anchor: 0.5 })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.5 - 10} x={1500 + 75} scale={0.8}>
			{@render props.buttonIncrease({ anchor: 0.5 })}
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
			x={298}
			y={context.stateLayoutDerived.mainLayoutStandard().height - DESKTOP_BASE_SIZE - 10}
		>
			<Container scale={0.8} y={DESKTOP_BASE_SIZE * 0.5 - 550} x={450}>
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={DESKTOP_BASE_SIZE * 0.5 - 550} x={900}>
				{@render props.buttonTurbo({ anchor: 0.5 })}
			</Container>

		</Container>
	</MainContainer>

	<Container 
		x={context.stateLayoutDerived.canvasSizes().width * 0.5 - 80}
		y={context.stateLayoutDerived.canvasSizes().height * 0.5 - 60}
		scale={1.92}
	>
		{@render props.buttonSoundSwitch({ anchor: 0.5, inMenu: true })}
	</Container>

	<!-- Close button positioned at top right corner of screen -->
	<Container x={context.stateLayoutDerived.canvasSizes().width - 80} y={80} scale={0.8}>
		{@render props.buttonClose({ anchor: 0.5 })}
	</Container>
{/if}
