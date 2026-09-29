<script lang="ts">
	import { stateBet, stateModal, type BetModeData } from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';

	import BonusCard from './BonusCard.svelte';
	import BonusCardIcon from './BonusCardIcon.svelte';
	import BonusCardDescription from './BonusCardDescription.svelte';
	import BonusCardPrice from './BonusCardPrice.svelte';
	import BonusCardButton from './BonusCardButton.svelte';
	import { stateBonus } from '../stateBonus.svelte';
	import type { EmitterEventModal } from '../types';

	type Props = {
		list: BetModeData[];
	};

	const props: Props = $props();
	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const base = (import.meta as any).env?.BASE_URL ?? '/';
	const assetBase = base.endsWith('/') ? base.slice(0, -1) : base;
	const spritesheetUrl = `${assetBase}/assets/sprites/common/spritesheet.png`;

	// The purchase itself is placed by the confirmation popup, never straight from the card.
	const askConfirmation = (betModeData: BetModeData) => {
		stateBonus.selectedBetModeKey = betModeData.mode;
		stateModal.modal = { name: 'buyBonusConfirm' };
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
	};
</script>

<div class="cards" style={`--spritesheet-url: url(${spritesheetUrl});`}>
	{#each props.list as betModeData, idx}
		{#if betModeData.type !== 'default'}
			<div class="card-item">
				<BonusCard>
					{#snippet icon()}
						<BonusCardIcon index={idx} />
					{/snippet}
					{#snippet title()}
						<div class="title"></div>
					{/snippet}

					{#snippet description()}
						<BonusCardDescription text={betModeData?.text?.description} />
					{/snippet}

					{#snippet price()}
						<BonusCardPrice amount={stateBet.betAmount * betModeData.costMultiplier} />
					{/snippet}

					{#snippet button()}
						<BonusCardButton
							label={betModeData.text.button}
							disabled={stateBet.betAmount <= 0 ||
								stateBet.balanceAmount < stateBet.betAmount * betModeData.costMultiplier}
							onclick={() => askConfirmation(betModeData)}
						/>
					{/snippet}
				</BonusCard>
			</div>
		{/if}
	{/each}
</div>

<style lang="scss">
	.cards {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		justify-content: center;
	}

	.card-item {
		display: flex;
	}

	.title {
		display: none;
	}

	/* Portrait: stack cards vertically */
	@media (orientation: portrait) {
		.cards {
			flex-direction: column;
			align-items: center;
			gap: 0 !important; /* control spacing via card-item margins */
		}

		.card-item {
			width: 100%;
			justify-content: center;
			margin: 0 !important;
		}

		.card-item:not(:last-child) {
			margin-bottom: 0 !important; /* tighten vertical spacing */
		}

		:global(.bonus-card-wrap) {
			width: 100% !important;
			max-width: 360px !important;
		}
	}

	/* Extra small widths: ensure stacked with 20px vertical spacing */
	@media (max-width: 400px) {
		.cards {
			flex-direction: column;
			align-items: center;
			gap: 0 !important;
		}

		.card-item {
			width: 100%;
			justify-content: center;
			margin: 0 !important;
			padding: 0;
		}

		.card-item:not(:last-child) {
			margin-bottom: -130px !important;
		}
	}
</style>
