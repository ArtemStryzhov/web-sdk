<script lang="ts">
	import { stateBet, stateModal, stateUi, INFINITY_MARK, type BetModeData } from 'state-shared';
	import { Button } from 'components-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';

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

	const base = (import.meta as any).env?.BASE_URL ?? '/';
	const assetBase = base.endsWith('/') ? base.slice(0, -1) : base;
	const spritesheetUrl = `${assetBase}/assets/sprites/common/spritesheet.png`;
</script>

<div class="cards" style={`--spritesheet-url: url(${spritesheetUrl});`}>
	{#each props.list as betModeData, idx}
		{#if betModeData.type !== 'default'}
			<div class="card-item">
				<BonusCard>
					{#snippet icon()}
						{#if idx === 0}
							<div class="icon-sprite icon-3icons"></div>
						{:else if idx === 1}
							<div class="icon-sprite icon-4icons"></div>
						{/if}
					{/snippet}
					{#snippet title()}
						<div class="title"></div>
					{/snippet}

					{#snippet description()}
						{#if betModeData?.text?.description}
							<div class="description">
								{betModeData.text.description}
							</div>
						{/if}
					{/snippet}

					{#snippet price()}
						{@const price = stateBet.betAmount * betModeData.costMultiplier}
						{@const currencySymbol = stateBet.currency === 'USD' ? '$' : `${stateBet.currency} `}
						{@const formatted = price.toFixed(2)}
						{@const [intPart, decPart] = formatted.split('.')}
						<div class="price">
							<span class="currency">{currencySymbol}</span>
							<span class="price-int">{intPart}</span>
							<span class="price-sep">.</span>
							<span class="price-dec">{decPart}</span>
						</div>
					{/snippet}

					{#snippet button()}
						{@const isDisabled = stateBet.betAmount <= 0 ||
							stateBet.balanceAmount < stateBet.betAmount * betModeData.costMultiplier}
						<div class={`button-container ${isDisabled ? 'disabled' : ''}`}>
							<Button
								onclick={() => {
									// Set active bet mode for the initial purchase
									stateBet.activeBetModeKey = betModeData.mode;
									
									// Close the buy bonus modal
									stateModal.modal = null;
									
									// For 'buy' type, immediately place the bet
									if (betModeData.type === 'buy') {
										eventEmitter.broadcast({ type: 'bet' });
									}
									
									// For 'activate' type, set infinity limits (same as confirmation logic)
									if (betModeData.type === 'activate') {
										stateUi.autoSpinsLossLimitText = INFINITY_MARK;
										stateUi.autoSpinsSingleWinLimitText = INFINITY_MARK;
									}
									
									eventEmitter.broadcast({ type: 'soundPressGeneral' });
								}}
								disabled={isDisabled}
							>
								<div class="button-background"></div>
								<BaseButtonContent>
									<span class="button-text">{betModeData.text.button}</span>
								</BaseButtonContent>
							</Button>
						</div>
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

	.description {
		font-family: 'Chelsea Market', 'Arial', sans-serif;
		font-size: 1.16rem; /* 20% smaller */
		text-align: center;
		min-height: 4.5rem;
		white-space: pre-line;
		display: inline-flex;
		align-items: center;
		color: #FFFFFF;
	}

	.description:empty {
		display: none;
	}

	.price {
		display: inline-block;
		font-size: 42px; /* further -15% */
		line-height: 1.1em;
		text-align: center;
		white-space: nowrap;
		font-family: 'Crom', Arial, sans-serif;
		font-weight: normal;
		color: #61E5FF;
		text-shadow: 3px 6px 0px #BF00B5;
		-webkit-text-stroke: 5px transparent;
		background: linear-gradient(180deg, #FF70EA 0%, #7B15FF 100%);
		-webkit-background-clip: text;
		background-clip: text;
		padding: 2px 4px;
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
	}

	.price .currency {
		font-family: 'Kanit', Arial, sans-serif; /* fallback font with currency glyphs */
		font-size: 0.9em;
	}

	.price .price-int {
		font-family: 'Crom', Arial, sans-serif;
	}

	.price .price-sep,
	.price .price-dec {
		font-family: 'Crom', Arial, sans-serif;
	}

	/* Make decimal point always visible */
	.price .price-sep {
		font-family: 'Kanit', Arial, sans-serif; /* ensure glyph */
		font-size: 0.95em;
		-webkit-text-stroke: 0;
		text-shadow: none;
		color: #61E5FF;
		display: inline-block;
		line-height: 1em;
	}

	.button-container {
		position: relative;
		width: 100%;
		height: 72px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.button-background {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 166px;
		height: 63px;
		transform: translate(-50%, -50%);
		background-image: var(--spritesheet-url);
		background-size: 2884px 2027px; /* full atlas */
		background-position: -1795px -1px; /* buy_btn_active */
		background-repeat: no-repeat;
		z-index: 0;
		pointer-events: none;
	}

	.button-container.disabled .button-background {
		background-position: -1795px -66px; /* buy_btn_disabled */
	}

	.button-text {
		position: relative;
		z-index: 1;
		font-family: 'Lalezar', sans-serif;
		font-weight: 400;
		font-style: normal;
		font-size: 39px; /* further -15% */
		line-height: 100%;
		text-align: center;
		color: #61E5FF;
	}

	.icon-sprite {
		background-image: var(--spritesheet-url);
		background-size: 2884px 2027px;
		background-repeat: no-repeat;
		pointer-events: none;
	}

	.icon-3icons {
		margin-top: 35px;
		width: 156px;
		height: 156px;
		background-position: -1px -1px;
	}

	.icon-4icons {
		margin-top: 35px;
		width: 176px;
		height: 156px;
		background-position: -159px -1px;
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
