<script lang="ts">
	import { currencyPrefix, numberToAmountString } from 'utils-shared/amount';

	type Props = {
		amount: number;
	};

	const props: Props = $props();

	const [intPart, decPart] = $derived(numberToAmountString(props.amount).split('.'));
</script>

<div class="price">
	<span class="currency">{currencyPrefix()}</span>
	<span class="price-int">{intPart}</span>
	<span class="price-sep">.</span>
	<span class="price-dec">{decPart}</span>
</div>

<style lang="scss">
	.price {
		font-size: 42px; /* further -15% */
		line-height: 1.1em;
		text-align: center;
		white-space: nowrap;
		font-family: 'Crom', Arial, sans-serif;
		font-weight: normal;
		color: #61e5ff;
		text-shadow: 3px 6px 0px #bf00b5;
		-webkit-text-stroke: 5px transparent;
		background: linear-gradient(180deg, #ff70ea 0%, #7b15ff 100%);
		-webkit-background-clip: text;
		background-clip: text;
		padding: 2px 4px;
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
	}

	.currency {
		font-family: 'Kanit', Arial, sans-serif; /* fallback font with currency glyphs */
		font-size: 0.9em;
	}

	.price-int,
	.price-dec {
		font-family: 'Crom', Arial, sans-serif;
	}

	/* Make decimal point always visible */
	.price-sep {
		font-family: 'Kanit', Arial, sans-serif; /* ensure glyph */
		font-size: 0.95em;
		-webkit-text-stroke: 0;
		text-shadow: none;
		color: #61e5ff;
		display: inline-block;
		line-height: 1em;
	}
</style>
