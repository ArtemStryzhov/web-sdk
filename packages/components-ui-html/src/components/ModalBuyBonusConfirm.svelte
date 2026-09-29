<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateBet, stateModal, stateUi, stateMetaDerived, INFINITY_MARK } from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';

	import BonusCard from './BonusCard.svelte';
	import BonusCardIcon from './BonusCardIcon.svelte';
	import BonusCardDescription from './BonusCardDescription.svelte';
	import BonusCardPrice from './BonusCardPrice.svelte';
	import BonusCardButton from './BonusCardButton.svelte';
	import BuyBonusDustBackground from './BuyBonusDustBackground.svelte';
	import { stateBonusDerived } from '../stateBonus.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import type { EmitterEventModal } from '../types';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const base = (import.meta as any).env?.BASE_URL ?? '/';
	const assetBase = base.endsWith('/') ? base.slice(0, -1) : base;
	const spritesheetUrl = `${assetBase}/assets/sprites/common/spritesheet.png`;

	// Natural size of the stacked content (heading + card), scaled down to fit small screens.
	const CONTENT_WIDTH = 380;
	const CONTENT_HEIGHT = 540;

	let viewportWidth = $state(0);
	let viewportHeight = $state(0);

	const scale = $derived(
		viewportWidth && viewportHeight
			? Math.min(1, (viewportWidth - 16) / CONTENT_WIDTH, (viewportHeight - 16) / CONTENT_HEIGHT)
			: 1,
	);

	const betModeData = $derived(stateBonusDerived.selectedBetModeData());

	// The icon follows the card's position among the modes of the same type in the buy bonus menu.
	const iconIndex = $derived(
		stateMetaDerived
			.betModeMetaList()
			.filter((item) => item.type === betModeData?.type)
			.findIndex((item) => item.mode === betModeData?.mode),
	);

	const totalPrice = $derived(stateBet.betAmount * (betModeData?.costMultiplier ?? 0));
	const isDisabled = $derived(stateBet.betAmount <= 0 || stateBet.balanceAmount < totalPrice);

	const backToMenu = () => (stateModal.modal = { name: 'buyBonus' });

	const confirm = () => {
		if (!betModeData || isDisabled) return;

		stateBet.activeBetModeKey = betModeData.mode;
		stateModal.modal = null;

		if (betModeData.type === 'buy') {
			eventEmitter.broadcast({ type: 'bet' });
		}

		if (betModeData.type === 'activate') {
			stateUi.autoSpinsLossLimitText = INFINITY_MARK;
			stateUi.autoSpinsSingleWinLimitText = INFINITY_MARK;
		}

		eventEmitter.broadcast({ type: 'soundPressGeneral' });
	};
</script>

<svelte:window bind:innerWidth={viewportWidth} bind:innerHeight={viewportHeight} />

{#if stateModal.modal?.name === 'buyBonusConfirm' && betModeData}
	<Popup zIndex={zIndex.dialog} onclose={backToMenu}>
		<div class="buy-bonus-confirm-container" style={`--spritesheet-url: url(${spritesheetUrl});`}>
			<BuyBonusDustBackground />
			<div
				class="stage"
				style={`width: ${CONTENT_WIDTH * scale}px; height: ${CONTENT_HEIGHT * scale}px;`}
			>
				<div class="content" style={`transform: scale(${scale});`}>
					<div class="heading" data-test="confirm-heading">{i18nDerived.confirmPurchase()}</div>

					<BonusCard>
						{#snippet icon()}
							<BonusCardIcon index={iconIndex} />
						{/snippet}
						{#snippet title()}
							<div class="title"></div>
						{/snippet}
						{#snippet description()}
							<BonusCardDescription text={betModeData.text.description} />
						{/snippet}
						{#snippet price()}
							<BonusCardPrice amount={totalPrice} />
						{/snippet}
						{#snippet button()}
							<div data-test="confirm-button" class="card-button">
								<BonusCardButton
									label={i18nDerived.confirm()}
									fontSize="30px"
									disabled={isDisabled}
									onclick={confirm}
								/>
							</div>
						{/snippet}
					</BonusCard>
				</div>
			</div>
		</div>
	</Popup>
{/if}

<style lang="scss">
	.buy-bonus-confirm-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stage {
		position: relative;
		z-index: 10;
		flex: none;
	}

	.content {
		position: absolute;
		top: 0;
		left: 0;
		width: 380px;
		height: 540px;
		transform-origin: top left;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}

	.title {
		display: none;
	}

	.heading {
		display: inline-block;
		font-family: 'Crom', Arial, sans-serif;
		font-weight: normal;
		font-size: 40px;
		line-height: 1.1em;
		text-align: center;
		text-transform: uppercase;
		color: #61e5ff;
		text-shadow: 3px 6px 0px #bf00b5;
		-webkit-text-stroke: 5px transparent;
		background: linear-gradient(180deg, #ff70ea 0%, #7b15ff 100%);
		-webkit-background-clip: text;
		background-clip: text;
		padding: 2px 4px;
	}

	// The shared card shrinks itself on narrow screens; here the whole stage is scaled instead.
	.content :global(.bonus-card-wrap) {
		transform: none !important;
		width: 360px !important;
		max-width: 360px !important;
		flex: none !important;
	}

	.content :global(.frame-content) {
		transform: translateY(-20px) !important;
	}

	:global(.pop-up-wrap:has(.buy-bonus-confirm-container) .top-layer) {
		width: 100vw;
		height: 100vh;
	}

	:global(.pop-up-wrap:has(.buy-bonus-confirm-container) .close-button-wrap) {
		position: fixed;
		top: max(22px, calc(env(safe-area-inset-top) + 10px));
		right: max(10px, calc(env(safe-area-inset-right) + 10px));
		transform: none;
		z-index: 200;
	}
</style>
