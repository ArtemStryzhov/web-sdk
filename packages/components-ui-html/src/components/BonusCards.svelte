<script lang="ts">
	import { stateBet, stateModal, stateUi, INFINITY_MARK, type BetModeData } from 'state-shared';
	import { Button } from 'components-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import BaseIcon from './BaseIcon.svelte';
	import BonusCard from './BonusCard.svelte';
	import BaseButtonContent from './BaseButtonContent.svelte';
	import { stateBonus } from '../stateBonus.svelte';
	import type { EmitterEventModal } from '../types';

	type Props = {
		list: BetModeData[];
	};

	const props: Props = $props();
	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();
</script>

{#each props.list as betModeData}
	{#if betModeData.type !== 'default'}
		<BonusCard>
			{#snippet title()}
				<div class="title">
					{betModeData.text.title}
				</div>
			{/snippet}

			{#snippet description()}
				{#if betModeData?.text?.description}
					<div class="description">
						{betModeData.text.description}
					</div>
				{/if}
			{/snippet}

			{#snippet price()}
				<div class="price">
					{`${numberToCurrencyString(stateBet.betAmount * betModeData.costMultiplier)}`}
				</div>
			{/snippet}

			{#snippet button()}
				<Button
					onclick={() => {
						// Set active bet mode for the initial purchase
						stateBet.activeBetModeKey = betModeData.mode;
						
						// Close the buy bonus modal
						stateModal.modal = null;
						
						// For 'buy' type, immediately place the bet
						if (betModeData.type === 'buy') {
							eventEmitter.broadcast({ type: 'bet' });
							// Note: Don't reset to BASE here - let the bet request use the buy mode
							// The mode will be automatically handled:
							// - During resume: ResumeBet.svelte converts buy modes to BASE
							// - After freespins end: freeSpinEnd handler resets to BASE
						}
						
						// For 'activate' type, set infinity limits (same as confirmation logic)
						if (betModeData.type === 'activate') {
							stateUi.autoSpinsLossLimitText = INFINITY_MARK;
							stateUi.autoSpinsSingleWinLimitText = INFINITY_MARK;
						}
						
						eventEmitter.broadcast({ type: 'soundPressGeneral' });
					}}
					disabled={stateBet.betAmount <= 0 ||
						stateBet.balanceAmount < stateBet.betAmount * betModeData.costMultiplier}
				>
					<BaseIcon width="100%" height="2rem" border="2px solid white;" />
					<BaseButtonContent>
						<span style="font-size: 1rem;">{betModeData.text.button}</span>
					</BaseButtonContent>
				</Button>
			{/snippet}
		</BonusCard>
	{/if}
{/each}

<style lang="scss">
	.title {
		font-size: 1rem;
		line-height: 1rem;
		text-align: center;
	}

	.description {
		font-size: 0.75rem;
		text-align: center;
		min-height: 4rem;
		white-space: pre-line;
		display: inline-flex;
		align-items: center;
	}

	.description:empty {
		display: none;
	}

	.price {
		font-size: 1rem;
		line-height: 1rem;
		text-align: center;
		white-space: nowrap;
	}
</style>
