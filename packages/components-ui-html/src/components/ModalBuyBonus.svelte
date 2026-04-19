<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { getContextLayout } from 'utils-layout';
	import { stateModal, stateMetaDerived } from 'state-shared';

	import BonusCards from './BonusCards.svelte';
	import BonusContentWrapLarge from './BonusContentWrapLarge.svelte';
	import BonusContentWrapPortrait from './BonusContentWrapPortrait.svelte';
	import BonusContentWrapLandscape from './BonusContentWrapLandscape.svelte';
	import BuyBonusDustBackground from './BuyBonusDustBackground.svelte';

	const { stateLayoutDerived } = getContextLayout();

	const activateList = $derived(
		stateMetaDerived.betModeMetaList().filter((item) => item.type === 'activate'),
	);

	const buyList = $derived(
		stateMetaDerived.betModeMetaList().filter((item) => item.type === 'buy'),
	);

	const COMPONENT_MAP = {
		desktop: BonusContentWrapLarge,
		tablet: BonusContentWrapLarge,
		portrait: BonusContentWrapPortrait,
		landscape: BonusContentWrapLandscape,
	} as const;

	const BonusContentWrap = $derived(COMPONENT_MAP[stateLayoutDerived.layoutType()]);
</script>

{#if stateModal.modal?.name === 'buyBonus'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="buy-bonus-modal-container">
			<BuyBonusDustBackground />
			<BonusContentWrap maxListLength={Math.max(activateList.length, buyList.length)}>
				{#snippet bonusCardsActivate()}
					<BonusCards list={activateList} />
				{/snippet}

				{#snippet bonusCardsBuy()}
					<BonusCards list={buyList} />
				{/snippet}
			</BonusContentWrap>
		</div>
	</Popup>
{/if}

<style lang="scss">
	.buy-bonus-modal-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	// Close button styling - no background
	:global(.pop-up-wrap:not(.no-fullscreen) .close-button) {
		background-color: transparent !important;
	}

	@media (orientation: portrait) {
		:global(.pop-up-wrap:has(.buy-bonus-modal-container) .top-layer) {
			width: 100vw;
			height: 100vh;
		}

		:global(.pop-up-wrap:has(.buy-bonus-modal-container) .close-button-wrap) {
			position: fixed;
			top: max(22px, calc(env(safe-area-inset-top) + 10px));
			right: max(10px, calc(env(safe-area-inset-right) + 10px));
			transform: none;
			z-index: 200;
		}

		:global(.pop-up-wrap:has(.buy-bonus-modal-container) .close-button) {
			width: 64px;
			height: 64px;
			margin: 0;
		}
	}
</style>
