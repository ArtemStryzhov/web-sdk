<script lang="ts" module>
	export type ButtonIncDecKey = 'plusEnabled' | 'plusDisabled' | 'minusEnabled' | 'minusDisabled';
	export type ButtonIncDecType = 'increase' | 'decrease';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { stateBet, stateConfig } from 'state-shared';

	import { getContext } from '../context';

	type Props = {
		type: ButtonIncDecType;
		children: Snippet<
			[
				{
					key: ButtonIncDecKey;
					disabled: boolean;
				},
			]
		>;
	};

	const props: Props = $props();
	const context = getContext();

	const getKey = () => {
		const isIdle = context.stateXstateDerived.isIdle();
		
		if (props.type === 'increase') {
			const biggest = stateConfig.betAmountOptions[stateConfig.betAmountOptions.length - 1];
			const disabled = !isIdle || stateBet.betAmount === biggest;
			return disabled ? 'plusDisabled' : 'plusEnabled';
		} else {
			const smallest = stateConfig.betAmountOptions[0];
			const disabled = !isIdle || stateBet.betAmount === smallest;
			return disabled ? 'minusDisabled' : 'minusEnabled';
		}
	};

	const getDisabled = () => {
		const isIdle = context.stateXstateDerived.isIdle();
		
		if (props.type === 'increase') {
			const biggest = stateConfig.betAmountOptions[stateConfig.betAmountOptions.length - 1];
			return !isIdle || stateBet.betAmount === biggest;
		} else {
			const smallest = stateConfig.betAmountOptions[0];
			return !isIdle || stateBet.betAmount === smallest;
		}
	};

	const key = $derived.by(getKey);
	const disabled = $derived.by(getDisabled);
</script>

{@render props.children({ key, disabled })}
