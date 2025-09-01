<script lang="ts">
	import { Sprite, Rectangle, Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateModal } from 'state-shared';

	import { getContext } from '../context';
	import { UI_BASE_FONT_SIZE } from '../constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: 270, height: Math.round(90) };

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'gameRules' };
	};
</script>

<Button {...props} {sizes} {onpress}>
	{#snippet children({ center, hovered, pressed })}
		<!-- Background rectangle like autoplay button -->
		<Rectangle
			{...center}
			anchor={0.5}
			width={sizes.width}
			height={sizes.height}
			backgroundColor={0xD9D9D9}
			backgroundAlpha={0.3}
			borderRadius={Math.max(sizes.width, sizes.height) / 2}
			{...props.disabled
				? {
						backgroundColor: 0xaaaaaa,
						backgroundAlpha: 1,
				}
				: {}}
		/>

		<!-- Circle background for icon area -->
		<Rectangle
			x={center.x - 89}
			y={center.y}
			anchor={0.5}
			width={90}
			height={90}
			backgroundColor={0xCFD0CA}
			backgroundAlpha={0.2}
			borderRadius={45}
		/>

		<!-- Info icon sprite -->
		<Sprite
			x={center.x - 89}
			y={center.y}
			anchor={0.5}
			key="info"
			width={21}
			height={46.5}
		/>

		<!-- Game Info text - stacked vertically -->
		<Text
			x={center.x + 20}
			y={center.y - 17}
			anchor={0.5}
			text="GAME"
			style={{
				align: 'center',
				fontFamily: 'Kanit, Arial, sans-serif',
				fontWeight: '600',
				fontSize: UI_BASE_FONT_SIZE * 0.8,
				fill: 0xD8ECA6, 
			}}
		/>
		<Text
			x={center.x + 20}
			y={center.y + 21}
			anchor={0.5}
			text="INFO"
			style={{
				align: 'center',
				fontFamily: 'Kanit, Arial, sans-serif',
				fontWeight: '600',
				fontSize: UI_BASE_FONT_SIZE * 0.8,
				fill: 0xD8ECA6, 
			}}
		/>
	{/snippet}
</Button>
