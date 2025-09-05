<script lang="ts" module>
	export type ButtonBetKey = 'spin_default' | 'spin_disabled' | 'stop_default' | 'stop_disabled';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateBet, stateBetDerived } from 'state-shared';

	import { getContext } from '../context';

	type Props = {
		children: Snippet<
			[
				{
					key: ButtonBetKey;
					onpress: () => void;
				},
			]
		>;
	};

	const props: Props = $props();
	const context = getContext();

	let stopDisabled = $state(false);
	let stopButtonTriggeredTurbo = $state(false);

	const bet = () => context.eventEmitter.broadcast({ type: 'bet' });

	const stop = () => {
		if (!stopDisabled) {
			if (stateBetDerived.hasAutoBetCounter()) stateBet.autoSpinsCounter = 0;
			
			// Track that turbo was activated by stop button
			if (!stateBet.isTurbo) {
				stopButtonTriggeredTurbo = true;
			}
			
			// Immediately enable turbo mode for faster completion
			stateBetDerived.updateIsTurbo(true, { persistent: false });
			
			// Broadcast stop event to interrupt animations
			context.eventEmitter.broadcast({ type: 'stopButtonClick' });
		}
	};

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressBet' });

		if (context.stateXstateDerived.isIdle()) {
			bet();
		} else {
			stop();
		}
	};

	const getKey = () => {
		if (context.stateXstateDerived.isIdle()) {
			if (!stateBetDerived.isBetCostAvailable()) return 'spin_disabled';
			return 'spin_default';
		}

		if (!context.stateXstateDerived.isIdle()) {
			if (stopDisabled) return 'stop_disabled';
			if (stateBetDerived.hasAutoBetCounter()) return 'stop_default';
			if (stateBet.isTurbo) return 'stop_disabled';
			return 'stop_default';
		}

		return 'spin_default';
	};

	const key = $derived.by(getKey);

	// Watch for state changes to reset turbo when round completes
	$effect(() => {
		const isIdle = context.stateXstateDerived.isIdle();
		
		// When game returns to idle state after stop button turbo was activated
		if (isIdle && stopButtonTriggeredTurbo) {
			stopButtonTriggeredTurbo = false;
			stateBetDerived.updateIsTurbo(false, { persistent: false });
		}
	});

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => (stopDisabled = true),
		stopButtonEnable: () => (stopDisabled = false),
	});
</script>

{@render props.children({ key, onpress })}
