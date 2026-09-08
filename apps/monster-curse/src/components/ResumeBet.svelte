<script lang="ts">
	import { stateBet, stateUrlDerived } from 'state-shared';
	import { getContext } from '../game/context';
	import { onMount } from 'svelte';

	const context = getContext();

	onMount(() => {
		if (stateBet.lastBet?.active && stateBet.lastBet.mode) {
			// Buy bonus modes (buy_contract, buy_blades, etc.) should only be used for the initial purchase
			// Once in an active freespin session, all continuation bets should use BASE mode
			// This prevents trying to re-purchase the bonus when resuming during freespins
			// A replay is not a real session: there is no follow-up bet that could
			// re-purchase the bonus, and the buy mode is what the round is being
			// replayed as, so keep it intact.
			const isBuyBonusMode = stateBet.lastBet.mode.startsWith('buy_');
			if (isBuyBonusMode && !stateUrlDerived.replay()) {
				// Update both activeBetModeKey and the lastBet.mode itself
				stateBet.activeBetModeKey = 'BASE';
				stateBet.lastBet.mode = 'BASE';
			} else {
				stateBet.activeBetModeKey = stateBet.lastBet.mode;
			}
		}
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	});
</script>
