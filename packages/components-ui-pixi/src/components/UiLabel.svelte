<script lang="ts">
	import { Text, Container } from 'pixi-svelte';
	import { WHITE } from 'constants-shared/colors';

	import UiSprite from './UiSprite.svelte';
	import { UI_BASE_FONT_SIZE } from '../constants';
	import { getContext } from '../context';

	type Props = {
		label: string;
		value: string;
		tiled?: boolean;
		stacked?: boolean;
		spacing?: number;
	};

	const props: Props = $props();
	const context = getContext();

	// Check if we should stack based on layout type (tablet and portrait should be stacked)
	const shouldStack = $derived(
		props.stacked || 
		context.stateLayoutDerived.layoutType() === 'tablet' || 
		context.stateLayoutDerived.layoutType() === 'portrait'
	);

	// Double font size for WIN label specifically
	const isWinLabel = $derived(props.label.toUpperCase().includes('WIN'));
	const fontSize = $derived(isWinLabel ? UI_BASE_FONT_SIZE * 2 : UI_BASE_FONT_SIZE);

	// Check if this is a balance label for semibold weight
	const isBalanceLabel = $derived(props.label.toUpperCase().includes('BALANCE'));
	
	// Check if this is a bet label for semibold weight
	const isBetLabel = $derived(props.label.toUpperCase().includes('BET'));

	const labelStyle = $derived({
		fontFamily: 'Kanit, Arial, sans-serif',
		fontSize,
		fontWeight: isWinLabel ? 'bold' : isBalanceLabel || isBetLabel ? '600' : '400', // Bold for WIN, semibold for balance/bet, normal for others
		fill: 0xD8ECA6, // Light lime green color for labels
	});

	const valueStyle = $derived({
		fontFamily: 'Kanit, Arial, sans-serif',
		fontSize,
		fill: 0xE0E0E0, // Light gray/off-white color for dollar amount
	});
</script>

{#if shouldStack}
	{#if props.tiled}
		<UiSprite
			y={isWinLabel ? -40 : -20}
			anchor={{ x: 0.5, y: 0 }}
			width={fontSize * 3 * (326 / 73)}
			height={fontSize * 3}
			borderRadius={35}
			backgroundAlpha={0}
		/>
	{/if}
	<Text anchor={{ x: 0.5, y: 0 }} text={props.label} style={labelStyle} />
	<Text anchor={{ x: 0.5, y: 0 }} text={props.value} style={valueStyle} y={fontSize} />
{:else}
	{#if props.tiled}
		<UiSprite
			x={isWinLabel ? -180 : -90}
			anchor={{ x: 0, y: 0.5 }}
			width={fontSize * 3 * (326 / 73)}
			height={fontSize * 3}
			borderRadius={35}
			backgroundAlpha={0}
		/>
	{/if}
		<Container>
			<Text anchor={{ x: 0, y: 0.5 }} text={props.label} style={labelStyle} />
			<Text
				anchor={{ x: 0, y: 0.5 }}
				text={props.value}
				style={valueStyle}
				x={(props.spacing || fontSize * 5)}
			/>
		</Container>
{/if}

