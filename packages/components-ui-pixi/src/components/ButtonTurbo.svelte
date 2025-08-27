<script lang="ts">
	import { Sprite, Rectangle, Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived } from 'state-shared';

	import { getContext } from '../context';
	import { UI_BASE_FONT_SIZE } from '../constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: 270, height: Math.round(90) };
	const active = $derived(stateBet.isTurbo);
	const disabled = $derived(stateBet.isSpaceHold);

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateBetDerived.updateIsTurbo(!stateBet.isTurbo, { persistent: true });
	};

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => stateBetDerived.updateIsTurbo(true, { persistent: false }),
		stopButtonEnable: () => stateBetDerived.updateIsTurbo(false, { persistent: false }),
	});
</script>

<Button {...props} {sizes} {onpress} disabled={disabled}>
	{#snippet children({ center, hovered, pressed })}
		<!-- Background rectangle like game rules button -->
		<Rectangle
			{...center}
			anchor={0.5}
			width={sizes.width}
			height={sizes.height}
			backgroundColor={0xD9D9D9}
			backgroundAlpha={0.3}
			borderRadius={Math.max(sizes.width, sizes.height) / 2}
			{...disabled
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

		<!-- Turbo icon sprite -->
		<Sprite
			x={center.x - 89}
			y={center.y}
			anchor={0.5}
			key={active ? "vector-gray" : "vector"}
			width={21}
			height={46.5}
		/>

		<!-- Turbo text -->
		<Text
			x={center.x + 20}
			y={center.y}
			anchor={0.5}
			text="TURBO"
			style={{
				align: 'center',
				fontFamily: 'Kanit, Arial, sans-serif',
				fontWeight: '600',
				fontSize: UI_BASE_FONT_SIZE * 0.8,
				fill: active ? 0x7A7C77 : 0xD8ECA6,
			}}
		/>
	{/snippet}
</Button>
