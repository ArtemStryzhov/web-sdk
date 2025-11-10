<script lang="ts">
	import { Text, Sprite } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateModal, stateBet, stateBetDerived, stateUi } from 'state-shared';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const { stateXstateDerived, eventEmitter, stateGame, i18nDerived } = context;
	
	console.log('[ButtonBuyBonus] CUSTOM COMPONENT LOADED!');
	
	// Button sizing - increased by 2x (base size is SYMBOL_SIZE)
	const UI_BASE_SIZE = SYMBOL_SIZE;
	const UI_BASE_FONT_SIZE = SYMBOL_SIZE * 0.2;
	const sizes = { width: UI_BASE_SIZE * 2, height: UI_BASE_SIZE * 2 };
	const disabled = $derived(!stateXstateDerived.isIdle());
	const active = $derived(stateBetDerived.activeBetMode()?.type === 'activate');

	// Check if we're in a free spin game
	const isFreeSpinGame = $derived(stateGame.gameType === 'freegame');
	const freeSpinsLeft = $derived(
		isFreeSpinGame && stateUi.freeSpinCounterTotal && stateUi.freeSpinCounterCurrent
			? stateUi.freeSpinCounterTotal - stateUi.freeSpinCounterCurrent + 1
			: 0
	);

	const openModal = () => (stateModal.modal = { name: 'buyBonus' });
	const disableActiveBetMode = () => (stateBet.activeBetModeKey = 'BASE');
	const onpress = () => {
		eventEmitter.broadcast({ type: 'soundPressGeneral' });

		if (active) {
			disableActiveBetMode();
		} else {
			openModal();
		}
	};

	const getState = (value: {
		active: boolean;
		disabled: boolean;
		hovered: boolean;
		pressed: boolean;
	}) => {
		if (value.disabled) return 'disabled' as const;
		if (value.pressed) return 'pressed' as const;
		if (value.hovered) return 'hovered' as const;
		if (value.active) return 'active' as const;
		return 'default' as const;
	};
	
	// Get button text based on state
	const buttonText = $derived.by(() => {
		const state = getState({ active, disabled, hovered: false, pressed: false });
		if (state === 'active') return i18nDerived.disable();
		if (isFreeSpinGame) return `FREE SPINS ${freeSpinsLeft}`;
		return i18nDerived.buyBonus();
	});
	
	// Debug logging
	$effect(() => {
		console.log('[ButtonBuyBonus] State:', {
			gameType: stateGame.gameType,
			isFreeSpinGame,
			freeSpinCounterTotal: stateUi.freeSpinCounterTotal,
			freeSpinCounterCurrent: stateUi.freeSpinCounterCurrent,
			freeSpinsLeft,
			buttonText
		});
	});
</script>

<Button {...props} {sizes} {disabled} {onpress}>
	{#snippet children({ center, hovered, pressed })}
		{@const state = getState({
			active,
			disabled,
			hovered,
			pressed,
		})}
		
		{@const spriteKey = disabled 
			? 'buy_button_disabled.png' 
			: (hovered ? 'buy_button_hover.png' : 'buy_button_active.png')}

		<!-- Background sprite from common spritesheet -->
		<Sprite
			{...center}
			anchor={0.5}
			key={spriteKey}
			width={sizes.width}
			height={sizes.height}
		/>

		<!-- Button text with #61E5FF color -->
		<Text
			{...center}
			anchor={0.5}
			text={buttonText}
			style={{
				align: 'center',
				wordWrap: true,
				wordWrapWidth: sizes.width * 0.8,
				fontFamily: 'Kanit, Arial, sans-serif',
				fontWeight: '600',
				fontSize: UI_BASE_FONT_SIZE * 0.9,
				fill: 0x61E5FF,
			}}
		/>
	{/snippet}
</Button>

