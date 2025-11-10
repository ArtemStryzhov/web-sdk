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
				<div class="button-container">
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
						<div class="button-background"></div>
						<BaseButtonContent>
							<span class="button-text">{betModeData.text.button}</span>
						</BaseButtonContent>
					</Button>
				</div>
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

	.button-container {
		position: relative;
		width: 100%;
	}

	.button-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: url('/assets/sprites/common/buy_button_active.png');
		background-size: contain;
		background-position: center;
		background-repeat: no-repeat;
		z-index: 0;
		pointer-events: none;
	}

	.button-text {
		position: relative;
		z-index: 1;
		font-family: 'Lalezar', sans-serif;
		font-weight: 400;
		font-style: normal;
		font-size: 47px;
		line-height: 100%;
		text-align: center;
		color: #61E5FF;
	}
</style>
