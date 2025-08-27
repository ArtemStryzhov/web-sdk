<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import type { ButtonProps } from 'components-pixi';
	import { stateSound } from 'state-shared';
	import { Button } from 'components-pixi';
	import { getContext } from '../context';
	
	interface Props extends Partial<Omit<ButtonProps, 'children'>> {
		inMenu?: boolean;
	}
	
	const props: Props = $props();
	const context = getContext();
	const sizes = props.inMenu ? { width: 97, height: 97 } : { width: 120, height: 80 };

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });

		if (stateSound.volumeValueMaster === 0) {
			stateSound.volumeValueMaster = 50;
		} else {
			stateSound.volumeValueMaster = 0;
		}
	};
</script>

<Button {...props} {sizes} {onpress}>
	{#snippet children({ center, hovered, pressed })}
		{#if props.inMenu}
			{#if stateSound.volumeValueMaster === 0}
				<!-- Sound Off Icon using big PNG -->
				<Sprite
					x={sizes.width}
					y={sizes.height}
					key="sound-off-big"
					width={55}
					height={55}
					anchor={0.5}
				/>
			{:else}
				<!-- Sound On Icon using big PNG -->
				<Sprite
					x={sizes.width}
					y={sizes.height}
					key="sound-on-big"
					width={55}
					height={55}
					anchor={0.5}
				/>
			{/if}
		{:else}
			<!-- Regular sound button without background -->
			<Container {...center}>
				{#if stateSound.volumeValueMaster === 0}
					<!-- Sound Off Icon using PNG -->
					<Sprite
						key="soundOff"
						width={77}
						height={77}
						anchor={0.5}
					/>
				{:else}
					<!-- Sound On Icon using PNG -->
					<Sprite
						key="soundOn"
						width={77}
						height={77}
						anchor={0.5}
					/>
				{/if}
			</Container>
		{/if}
	{/snippet}
</Button>
