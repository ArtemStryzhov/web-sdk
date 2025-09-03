<script lang="ts">
	import { Container, Sprite, Rectangle } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateModal } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from '../context';
	import { UI_BASE_SIZE } from '../constants';


	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();

	// Detect portrait layout
	const isPortrait = $derived(context.stateLayoutDerived.layoutType() === 'portrait');

	// Different sizes for portrait vs other layouts
	const sizes = $derived(isPortrait
		? { width: 90, height: 80 }  // Smaller square for portrait
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

	// Debug: Check what's actually loaded
	console.log('AutoSpin Debug - loadedAssets keys:', Object.keys(context.stateApp.loadedAssets || {}));
	console.log('AutoSpin Debug - has autospin_mob_default:', !!context.stateApp.loadedAssets?.['autospin_mob_default.png']);
	console.log('AutoSpin Debug - has autospin_mob_default (no ext):', !!context.stateApp.loadedAssets?.['autospin_mob_default']);
</script>

{#if isPortrait && hasMobileAssets}
	<Button {...props} {sizes} {onpress} {disabled} anchor={0.5}>
		{#snippet children({ center, hovered, pressed })}
			<!-- Invisible hit area rectangle -->
			<Rectangle
				x={center.x - sizes.width * 0.5}
				y={center.y - sizes.height * 0.5}
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
