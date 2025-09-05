<script lang="ts">
	import { Sprite, Rectangle } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateModal } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();

	// Detect portrait layout
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');

	// Different sizes for portrait vs other layouts
	const sizes = $derived(isPortrait
		? { width: 40, height: 36 }  // Smaller square for portrait
		: { width: 230, height: 66 } // Original size for other layouts
	);

	const active = $derived(stateBetDerived.hasAutoBetCounter());
	const disabled = $derived.by(() => {
		if (stateBet.isSpaceHold) return true;
		if (!context.stateXstateDerived.isIdle() && !stateBetDerived.hasAutoBetCounter()) return true;
		if (!stateBetDerived.isBetCostAvailable()) return true;
		return false;
	});

	const stopAutoSpin = () => {
		stateBet.autoSpinsCounter = 0;
	};
	const openModal = () => {
		stateModal.modal = { name: 'autoSpin' };
	};
	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateBetDerived.hasAutoBetCounter() ? stopAutoSpin() : openModal();
	};

	// Check if mobile autospin assets are available
	const hasMobileAssets = $derived(
		context.stateApp.assets?.autospin_mob_default &&
		context.stateApp.assets?.autospin_mob_inactive
	);
</script>

{#if isPortrait && hasMobileAssets}
	<Button {...props} {sizes} {onpress} {disabled} anchor={0.5}>
		{#snippet children({ center, hovered, pressed })}
			<!-- Invisible hit area rectangle -->
			<Rectangle
				x={center.x - sizes.width}
				y={center.y - sizes.height}
				width={sizes.width}
				height={sizes.height}
				backgroundColor={0x000000}
				backgroundAlpha={0.01}
				eventMode="static"
			/>
			<Sprite
				{...center}
				anchor={0.5}
				key={active ? "autospin_mob_inactive" : "autospin_mob_default"}
				width={sizes.width}
				height={sizes.height}
			/>
		{/snippet}
	</Button>
{:else}
	<UiButton {...props} {sizes} {active} {onpress} {disabled} icon="autoSpin" {isPortrait}>
	</UiButton>
{/if}
