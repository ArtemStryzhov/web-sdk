<script lang="ts">
	import { Text, Container } from 'pixi-svelte';

	import UiSprite from './UiSprite.svelte';
	import { UI_BASE_FONT_SIZE } from '../constants';
	import { getContext } from '../context';

	type Props = {
		label: string;
		value: string;
		numericAmount?: number;
		tiled?: boolean;
		stacked?: boolean;
		spacing?: number;
	};

	const props: Props = $props();
	const context = getContext();

	// Double font size for WIN label specifically
	const isWinLabel = $derived(props.label.toUpperCase().includes('WIN'));
	const baseValueFontSize = UI_BASE_FONT_SIZE;
	const labelFontSize = $derived(isWinLabel ? UI_BASE_FONT_SIZE * 2 : UI_BASE_FONT_SIZE);
	const shouldCompactValue = $derived((props.numericAmount ?? 0) > 100000);
	const compactValueFontSize = $derived(
		isWinLabel ? baseValueFontSize * 0.8 * 1.15 : labelFontSize * 0.8
	);
	const valueFontSize = $derived(shouldCompactValue ? compactValueFontSize : labelFontSize);

	// Check if this is a balance label for semibold weight
	const isBalanceLabel = $derived(props.label.toUpperCase().includes('BALANCE'));

	// Check if this is a bet label for semibold weight (and stacking on desktop/landscape)
	const isBetLabel = $derived(props.label.toUpperCase().includes('BET'));

	// Check if we should stack based on layout type (tablet and portrait should be stacked by default)
	// Bet labels should also stack on desktop and landscape
	const shouldStack = $derived(
		props.stacked !== false && (
			context.stateLayoutDerived.layoutType() === 'tablet' ||
			context.stateLayoutDerived.layoutType() === 'portrait' ||
			(isBetLabel && (context.stateLayoutDerived.layoutType() === 'desktop' || context.stateLayoutDerived.layoutType() === 'landscape'))
		)
	);

	const labelStyle = $derived({
		fontFamily: 'Kanit, Arial, sans-serif',
		fontSize: labelFontSize,
		fontWeight: (isWinLabel ? 'bold' : (isBalanceLabel || isBetLabel ? 600 : 400)) as any, // Type assertion needed for Pixi.js compatibility
		fill: 0xD8ECA6, // Light lime green color for labels
	});

	const valueStyle = $derived({
		fontFamily: 'Kanit, Arial, sans-serif',
		fontSize: valueFontSize,
		fill: 0xE0E0E0, // Light gray/off-white color for dollar amount
	});
</script>

{#if shouldStack}
	{#if props.tiled}
		<UiSprite
			key=""
			y={isWinLabel ? -40 : -20}
			anchor={{ x: 0.5, y: 0 }}
			width={labelFontSize * 3 * (326 / 73)}
			height={labelFontSize * 3}
		/>
	{/if}
	<Text anchor={{ x: 0.5, y: 0 }} text={props.label} style={labelStyle} />
	<Text anchor={{ x: 0.5, y: 0 }} text={props.value} style={valueStyle} y={labelFontSize} />
{:else}
	{#if props.tiled}
		<UiSprite
			key=""
			x={isWinLabel ? -180 : -90}
			anchor={{ x: 0, y: 0.5 }}
			width={labelFontSize * 3 * (326 / 73)}
			height={labelFontSize * 3}
		/>
	{/if}
		<Container>
			<Text anchor={{ x: 0, y: 0.5 }} text={props.label} style={labelStyle} />
			<Text
				anchor={{ x: 0, y: 0.5 }}
				text={props.value}
				style={valueStyle}
				x={(props.spacing || labelFontSize * 5)}
			/>
		</Container>
{/if}

