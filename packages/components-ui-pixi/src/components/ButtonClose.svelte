<script lang="ts">
	import { Container, Rectangle } from 'pixi-svelte';
	import type { ButtonProps } from 'components-pixi';
	import { stateUi } from 'state-shared';
	import { Button } from 'components-pixi';
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: 120, height: 80 };

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateUi.menuOpen = false;
	};

	const center = { x: sizes.width * 0.5, y: sizes.height * 0.5 };
</script>

<Button {...props} {sizes} {onpress}>
	{#snippet children({ center, hovered, pressed })}
		<!-- Completely transparent background to override any default backgrounds -->
		<Rectangle
			{...center}
			anchor={0.5}
			width={sizes.width}
			height={sizes.height}
			backgroundColor={0x000000}
			alpha={0.01}
		/>

		<!-- X icon for close button -->
		<Container {...center}>
			<!-- Top-left to bottom-right diagonal line -->
			<Rectangle
				x={0}
				y={0}
				width={45}
				height={5}
				backgroundColor={0xD8ECA6}
				borderRadius={2.5}
				anchor={0.5}
				rotation={0.785398}
			/>
			<!-- Top-right to bottom-left diagonal line -->
			<Rectangle
				x={0}
				y={0}
				width={45}
				height={5}
				backgroundColor={0xD8ECA6}
				borderRadius={2.5}
				anchor={0.5}
				rotation={-0.785398}
			/>
		</Container>
	{/snippet}
</Button>
