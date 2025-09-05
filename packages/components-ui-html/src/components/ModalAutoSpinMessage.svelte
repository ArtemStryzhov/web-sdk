<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { getContextLayout } from 'utils-layout';
	import { stateModal } from 'state-shared';

	import BaseContent from './BaseContent.svelte';
	import BaseTitle from './BaseTitle.svelte';
	import BaseScrollable from './BaseScrollable.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	const { stateLayoutDerived } = getContextLayout();
	const isPortrait = $derived(stateLayoutDerived.layoutType() === 'portrait');

	const messageMap = $derived({
		lossLimitReached: i18nDerived.lossLimitReached(),
		singleWinLimitReached: i18nDerived.singleWinLimitReached(),
		insufficientFunds: i18nDerived.insufficientFunds(),
	});
</script>

{#if stateModal.modal?.name === 'autoSpinMessage'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)} noFullScreenOverlay allowClickOutsideToClose>
		<BaseContent width="720px" height="420px">
			<BaseTitle>
				{i18nDerived.notification()}
			</BaseTitle>
			<BaseScrollable type="column">
				<span class="text" data-test="auto-spin-stop-info">{i18nDerived.autoSpinsStopInfo()}</span>
				<div class="scrollY info-text" data-test="auto-spin-stop-content">
					{messageMap[stateModal.modal.message]}
				</div>
			</BaseScrollable>
		</BaseContent>
	</Popup>
{/if}

<style lang="scss">
	.text {
		text-align: center;
		font-size: 1.1rem;

		@media (max-width: 480px) {
			font-size: 1rem;
		}

		@media (max-width: 768px) {
			font-size: 1.05rem;
		}
	}

	.info-text {
		text-align: center;
		max-height: 100px;
		max-width: 480px;
		border-radius: 8px;
		border: 1px solid white;
		white-space: normal;
		padding: 1rem;

		@media (max-width: 480px) {
			max-width: 100%;
			max-height: 120px;
			padding: 0.75rem;
			font-size: 0.9rem;
			border-radius: 6px;
		}

		@media (max-width: 768px) {
			max-width: 90%;
			max-height: 110px;
			padding: 0.875rem;
			font-size: 0.95rem;
		}

		@media (max-height: 600px) {
			max-height: 80px;
			padding: 0.75rem;
			font-size: 0.9rem;
		}

		@media (max-height: 500px) {
			max-height: 60px;
			padding: 0.5rem;
			font-size: 0.85rem;
		}
	}

	// Portrait layout: make close button 2x smaller (32px instead of 64px)
	:global(.close-button) {
		@media (orientation: portrait) {
			width: 32px !important;
			height: 32px !important;
			margin: 10px !important;
		}
	}

	:global(.close-button::before),
	:global(.close-button::after) {
		// Portrait layout: make cross lines 2x smaller
		@media (orientation: portrait) {
			width: 18px !important; // 36px / 2 = 18px
			height: 3px !important; // Slightly thicker for visibility on small size
		}
	}
</style>
