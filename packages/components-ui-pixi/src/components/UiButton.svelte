<script lang="ts">
	import { Text, Rectangle } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';

	import UiSprite from './UiSprite.svelte';
	import type { ButtonIcon } from '../types';
	import type { Snippet } from 'svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { UI_BASE_FONT_SIZE } from '../constants';

	type Props = Omit<ButtonProps, 'children'> & {
		icon: ButtonIcon;
		sizes: { width: number; height: number };
		active?: boolean;
		children?: Snippet;
		variant?: 'dark' | 'light';
		isPortrait?: boolean;
	};

	const {
		icon,
		active,
		variant = 'dark',
		isPortrait = false,
		children: childrenFromParent,
		...buttonProps
	}: Props = $props();
</script>

<Button {...buttonProps}>
	{#snippet children({ center, hovered, pressed })}
		{#if !isPortrait}
			<Rectangle
				{...center}
				anchor={0.5}
				width={buttonProps.sizes.width}
				height={buttonProps.sizes.height}
				backgroundColor={icon === 'autoSpin' ? 0xD9D9D9 : variant === 'dark' ? 0x000000 : 0xffffff}
				backgroundAlpha={icon === 'autoSpin' ? 0.3 : 1}
				borderRadius={20}
				{...buttonProps.disabled
					? {
							backgroundColor: 0xaaaaaa,
							backgroundAlpha: 1,
					}
					: {}}
			/>

			<Text
				{...center}
				anchor={0.5}
				text={i18nDerived[icon]()}
				style={{
					align: 'center',
					wordWrap: true,
					wordWrapWidth: 200,
					fontFamily: 'Kanit, Arial, sans-serif',
					fontWeight: '600',
					fontSize: UI_BASE_FONT_SIZE * 0.9,
					fill: icon === 'autoSpin' ? (active ? 0xC53C3C : 0xD8ECA6) : variant === 'dark' ? 0xffffff : 0x000000,
				}}
			/>
		{/if}

		<!-- Invisible hit area for portrait mode -->
		{#if isPortrait}
			<Rectangle
				{...center}
				anchor={0.5}
				width={buttonProps.sizes.width}
				height={buttonProps.sizes.height}
				backgroundColor={0x000000}
				backgroundAlpha={0.01}
			/>
		{/if}

		{@render childrenFromParent?.()}
	{/snippet}
</Button>
