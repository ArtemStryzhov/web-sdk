<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	import { getContextLayout } from 'utils-layout';
	import { EnableSpaceHold } from 'components-shared';

	import UiFadeContainer from './UiFadeContainer.svelte';
	import LayoutDesktop from './LayoutDesktop.svelte';
	import LayoutPortrait from './LayoutPortrait.svelte';
	import LayoutLandscape from './LayoutLandscape.svelte';
	import LayoutTablet from './LayoutTablet.svelte';
	import LabelBalance from './LabelBalance.svelte';
	import LabelWin from './LabelWin.svelte';
	import LabelBet from './LabelBet.svelte';
	
	import ButtonGameRules from './ButtonGameRules.svelte';
	import ButtonSettings from './ButtonSettings.svelte';
	import ButtonBuyBonus from './ButtonBuyBonus.svelte';
	import ButtonBet from './ButtonBet.svelte';
	import ButtonTurbo from './ButtonTurbo.svelte';
	import ButtonAutoSpin from './ButtonAutoSpin.svelte';
	import ButtonIncrease from './ButtonIncrease.svelte';
	import ButtonDecrease from './ButtonDecrease.svelte';
	import ButtonMenu from './ButtonMenu.svelte';
	import ButtonClose from './ButtonClose.svelte';
	import ButtonSoundSwitch from './ButtonSoundSwitch.svelte';

	type Props = {
		gameName: Snippet;
		logo: Snippet;
		// Optional snippet overrides
		amountBet?: Snippet<[any]>;
		buttonBuyBonus?: Snippet<[any]>;
	};

	const props: Props = $props();

	const { stateLayoutDerived } = getContextLayout();

	const LAYOUT_COMPONENT_MAP = {
		desktop: LayoutDesktop,
		portrait: LayoutPortrait,
		landscape: LayoutLandscape,
		tablet: LayoutTablet,
	};

	const LayoutComponent = $derived(LAYOUT_COMPONENT_MAP[stateLayoutDerived.layoutType()]);

	const logLayoutInfo = () => {
		const layoutType = stateLayoutDerived.layoutType();
		const canvasSizes = stateLayoutDerived.canvasSizes();
		const canvasRatio = stateLayoutDerived.canvasRatio();
		const canvasRatioType = stateLayoutDerived.canvasRatioType();
		const canvasSizeType = stateLayoutDerived.canvasSizeType();
		const mainLayout = stateLayoutDerived.mainLayout();
		const mainLayoutStandard = stateLayoutDerived.mainLayoutStandard();

		console.log('📐 [LAYOUT] Current Layout Info:', {
			layoutType,
			canvasSizes: { width: canvasSizes.width, height: canvasSizes.height },
			canvasRatio: canvasRatio.toFixed(3),
			canvasRatioType,
			canvasSizeType,
			mainLayout: {
				width: mainLayout.width,
				height: mainLayout.height,
				x: mainLayout.x,
				y: mainLayout.y,
			},
			mainLayoutStandard: {
				width: mainLayoutStandard.width,
				height: mainLayoutStandard.height,
				x: mainLayoutStandard.x,
				y: mainLayoutStandard.y,
			},
		});
	};

	let isInitialMount = $state(true);

	// Log on init
	onMount(() => {
		logLayoutInfo();
		isInitialMount = false;
	});

	// Debounced resize logging
	const debounceDelay = 300; // 300ms debounce

	$effect(() => {
		// Track layout changes (which includes resize)
		const layoutType = stateLayoutDerived.layoutType();
		const canvasSizes = stateLayoutDerived.canvasSizes();

		// Skip logging on initial mount (already logged in onMount)
		if (isInitialMount) {
			return;
		}

		// Set timeout for debounced logging
		const timeoutId = setTimeout(() => {
			logLayoutInfo();
		}, debounceDelay);

		// Cleanup on unmount or when dependencies change
		return () => {
			clearTimeout(timeoutId);
		};
	});
</script>

<EnableSpaceHold />

<UiFadeContainer>
	<LayoutComponent>
		{#snippet gameName()}
			{@render props.gameName()}
		{/snippet}

		{#snippet logo()}
			{@render props.logo()}
		{/snippet}

		{#snippet amountBalance(labelProps)}
			<LabelBalance {...labelProps} />
		{/snippet}

		{#snippet amountWin(labelProps)}
			<LabelWin {...labelProps} />
		{/snippet}

		{#snippet amountBet(labelProps)}
			{#if props.amountBet}
				{@render props.amountBet(labelProps)}
			{:else}
				<LabelBet {...labelProps} />
			{/if}
		{/snippet}

		{#snippet buttonBuyBonus(buttonProps)}
			{#if props.buttonBuyBonus}
				{@render props.buttonBuyBonus(buttonProps)}
			{:else}
				<ButtonBuyBonus {...buttonProps} />
			{/if}
		{/snippet}

		{#snippet buttonBet(buttonProps)}
			<ButtonBet {...buttonProps} />
		{/snippet}

		{#snippet buttonTurbo(buttonProps)}
			<ButtonTurbo {...buttonProps} />
		{/snippet}

		{#snippet buttonAutoSpin(buttonProps)}
			<ButtonAutoSpin {...buttonProps} />
		{/snippet}

		{#snippet buttonIncrease(buttonProps)}
			<ButtonIncrease {...buttonProps} />
		{/snippet}

		{#snippet buttonDecrease(buttonProps)}
			<ButtonDecrease {...buttonProps} />
		{/snippet}

		{#snippet buttonMenu(buttonProps)}
			<ButtonMenu {...buttonProps} />
		{/snippet}

		{#snippet buttonClose(buttonProps)}
			<ButtonClose {...buttonProps} />
		{/snippet}



		{#snippet buttonGameRules(buttonProps)}
			<ButtonGameRules {...buttonProps} />
		{/snippet}

		{#snippet buttonSettings(buttonProps)}
			<ButtonSettings {...buttonProps} />
		{/snippet}

		{#snippet buttonSoundSwitch(buttonProps)}
			<ButtonSoundSwitch {...buttonProps} />
		{/snippet}
	</LayoutComponent>
</UiFadeContainer>
