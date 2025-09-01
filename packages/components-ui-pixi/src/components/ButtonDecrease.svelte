<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import ButtonIncDecProvider from './ButtonIncDecProvider.svelte';
	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';
	import { UI_BASE_SIZE } from '../constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: UI_BASE_SIZE * 0.7, height: UI_BASE_SIZE * 0.7 };
	const smallest = $derived(stateConfig.betAmountOptions[0]);
	const disabled = $derived(!context.stateXstateDerived.isIdle() || stateBet.betAmount === smallest);

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });

		const nextSmaller = [...stateConfig.betAmountOptions]
			.sort((a, b) => b - a)
			.find((option) => option < stateBet.betAmount);

		stateBetDerived.setBetAmount(nextSmaller || smallest);
	};

	// Check if PNG assets are available
	const hasAssets = $derived(
		context.stateApp.assets.minusEnabled && 
		context.stateApp.assets.minusDisabled
	);
</script>

{#if hasAssets}
	<ButtonIncDecProvider type="decrease">
		{#snippet children({ key, disabled })}
			<Button {...props} {sizes} {onpress} {disabled}>
				{#snippet children({ center, hovered, pressed })}
					<Sprite
						{...center}
						anchor={0.5}
						{key}
						width={UI_BASE_SIZE * 0.7}
						height={UI_BASE_SIZE * 0.7}
					/>
				{/snippet}
			</Button>
		{/snippet}
	</ButtonIncDecProvider>
{:else}
	<UiButton {...props} {sizes} {onpress} {disabled} icon="decrease" />
{/if}
