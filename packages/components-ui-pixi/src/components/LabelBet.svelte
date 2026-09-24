<script lang="ts">
	import { stateBet, stateBetDerived } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import UiLabel from './UiLabel.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	type Props = {
		stacked?: boolean;
	};

	const props: Props = $props();
	
	// Always show "BET" - never show bonus mode names like "MONSTER CONTRACT" or "BLADES OF FATE"
	const label = $derived(i18nDerived.bet());
	// Always show base bet amount, not multiplied cost
	const value = $derived(numberToCurrencyString(stateBet.betAmount));
</script>

<UiLabel tiled kind="bet" {label} {value} stacked={props.stacked} />
