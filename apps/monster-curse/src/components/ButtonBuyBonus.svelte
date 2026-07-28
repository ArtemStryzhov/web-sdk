<script lang="ts">
	import { Text, Sprite } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateModal, stateBet, stateBetDerived, stateUi } from 'state-shared';
	import { stateUrlDerived } from 'state-shared';
	import { getContextApp } from 'pixi-svelte';
	import * as PIXI from 'pixi.js';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const pixiContext = getContextApp();
	const { stateXstateDerived, eventEmitter, stateGame, i18nDerived } = context;
	
	// Button sizing
	const UI_BASE_SIZE = SYMBOL_SIZE;
	const sizes = { width: UI_BASE_SIZE * 3, height: UI_BASE_SIZE * 3 };
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
		
		{@const spriteTexture = pixiContext.stateApp.loadedAssets?.[spriteKey] as PIXI.Texture | undefined}
		{@const isSpriteLoaded = spriteTexture && spriteTexture !== PIXI.Texture.EMPTY}

		<!-- Background sprite from common spritesheet -->
		{#if isSpriteLoaded}
			<Sprite
				{...center}
				anchor={0.5}
				key={spriteKey}
				width={sizes.width}
				height={sizes.height}
			/>
		{/if}

		<!-- Button text - split styling for FREE SPINS vs number -->
		{#if isFreeSpinGame}
			<!-- FREE SPINS text (top) -->
			<Text
				x={center.x}
				y={center.y - 36}
				anchor={0.5}
				text="FREE SPINS"
				style={{
					align: 'center',
					fontFamily: 'Kanit, Arial, sans-serif',
					fontWeight: '600',
					fontSize: 32,
					fill: 0xB5D36B,
				}}
			/>
			<!-- Number (bottom) -->
			<Text
				x={center.x}
				y={center.y + 36}
				anchor={0.5}
				text={String(freeSpinsLeft)}
				style={{
					align: 'center',
					fontFamily: 'Kanit, Arial, sans-serif',
					fontWeight: '600',
					fontSize: 100,
					fill: 0xD9D9D9,
				}}
			/>
		{:else if state === 'active'}
			<!-- DISABLE text -->
			<Text
				{...center}
				anchor={0.5}
				text={i18nDerived.disable()}
				style={{
					align: 'center',
					fontFamily: 'Kanit, Arial, sans-serif',
					fontWeight: '600',
					fontSize: 46,
					fill: 0x61E5FF,
				}}
			/>
		{:else}
			<!-- BUY BONUS / PLAY BONUS text - stacked on two lines -->
			<Text
				x={center.x}
				y={center.y - 23}
				anchor={0.5}
				text={stateUrlDerived.social() ? 'PLAY' : 'BUY'}
				style={{
					align: 'center',
					fontFamily: 'Kanit, Arial, sans-serif',
					fontWeight: '600',
					fontSize: 46,
					fill: 0x61E5FF,
				}}
			/>
			<Text
				x={center.x}
				y={center.y + 23}
				anchor={0.5}
				text="BONUS"
				style={{
					align: 'center',
					fontFamily: 'Kanit, Arial, sans-serif',
					fontWeight: '600',
					fontSize: 46,
					fill: 0x61E5FF,
				}}
			/>
		{/if}
	{/snippet}
</Button>

