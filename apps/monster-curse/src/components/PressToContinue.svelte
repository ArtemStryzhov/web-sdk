<script lang="ts">
	import { MainContainer, OnPressFullScreen, CanvasSizeRectangle } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Sprite, Text, Container } from 'pixi-svelte';
	import { UI_BASE_FONT_SIZE } from 'components-ui-pixi/src/constants';
	import * as PIXI from 'pixi.js';

	import { getContext } from '../game/context';

	type Props = {
		onpress: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	const shouldShow = $derived(context.stateGame.gameType !== 'freegame');

	const buttonWidth = 436;
	const buttonHeight = 106;
	const buttonScale = 0.75;

	let isHovered = $state(false);

	const mainLayout = $derived(context.stateLayoutDerived.mainLayout());

	const buttonX = $derived(mainLayout.width * 0.5);
	const buttonY = $derived(mainLayout.height - 80);

	const buttonSpriteKey = $derived(isHovered ? 'button_grey.png' : 'button_inactive.png');

	const textStyle = $derived({
		fontFamily: 'Kanit, Arial, sans-serif',
		fontSize: UI_BASE_FONT_SIZE * 0.65,
		fontWeight: 600 as any,
		fill: 0x61E5FF,
		align: 'center' as const,
	});

	const handlePress = () => {
		props.onpress();
	};
</script>

{#if shouldShow}
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.2} zIndex={9999} />

	<MainContainer alignVertical="bottom" zIndex={10000}>
		<Container
			x={buttonX}
			y={buttonY}
			eventMode="static"
			cursor="pointer"
			interactive={true}
			hitArea={new PIXI.Rectangle(
				0,
				0,
				buttonWidth * buttonScale,
				buttonHeight * buttonScale
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
				style={textStyle}
				anchor={{ x: 0.5, y: 0.5 }}
				x={0}
				y={0}
				eventMode="none"
			/>
		</Container>
	</MainContainer>
{/if}
<OnHotkey hotkey="Space" onpress={handlePress} />
<OnPressFullScreen onpress={handlePress} />
