<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { getContextLayout } from 'utils-layout';
	import { stateModal } from 'state-shared';

	import BaseContent from './BaseContent.svelte';
	import BaseTitle from './BaseTitle.svelte';
	import BaseScrollable from './BaseScrollable.svelte';
	import BaseButtonWrap from './BaseButtonWrap.svelte';
	import AutoSpinsOptions from './AutoSpinsOptions.svelte';
	import AutoSpinsStartButton from './AutoSpinsStartButton.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	const { stateLayoutDerived } = getContextLayout();
	const isPortrait = $derived(stateLayoutDerived.layoutType() === 'portrait');
</script>

{#if stateModal.modal?.name === 'autoSpin'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)} noFullScreenOverlay allowClickOutsideToClose>
		<div class="autoplay-modal-container">
			<div class="autoplay-background"></div>
			<BaseContent width="720px" height="420px">
				<BaseTitle>
					<div class="autoplay-title">{i18nDerived.autoSpins()}</div>
				</BaseTitle>
				<BaseScrollable type="column">
					<AutoSpinsOptions />
				</BaseScrollable>
				<BaseButtonWrap type="full-width">
					<AutoSpinsStartButton />
				</BaseButtonWrap>
			</BaseContent>
		</div>
	</Popup>
{/if}

<style lang="scss">
	.autoplay-modal-container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;

		:global(.ui-popup-standard-content-wrap) {
			position: relative;
			z-index: 1;
		}
	}

	.autoplay-background {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 720px;
		height: 420px;
		background-color: rgba(20, 20, 23, 0.95);
		border-radius: 12px;
		z-index: 0;

		// Responsive sizing to match BaseContent
		@media (max-width: 480px) {
			width: 95vw;
			height: 420px;
		}

		@media (max-width: 768px) {
			width: 90vw;
			height: 420px;
		}

		@media (max-width: 1024px) {
			width: 80vw;
			height: 420px;
		}
	}

	.autoplay-title {
		font-family: 'Kanit', Arial, sans-serif !important;
		font-size: 55px !important;
		font-weight: bold !important;
		color: #D8ECA6 !important; // Same color as WIN label
		text-align: center;
		line-height: 1;
		margin: 50px 0 20px 0;
		padding: 0;

		// Responsive font sizes and margins
		@media (max-width: 480px) {
			font-size: 22px !important;
			margin: 20px 0 15px 0;
		}

		@media (max-width: 768px) {
			font-size: 26px !important;
			margin: 30px 0 18px 0;
		}

		@media (max-height: 600px) {
			font-size: 22px !important;
			margin: 15px 0 10px 0;
		}

		@media (max-height: 500px) {
			font-size: 20px !important;
			margin: 10px 0 8px 0;
		}
	}

	// Responsive close button sizes
	:global(.close-button-wrap) {
		@media (orientation: portrait) {
			transform: translate(-30px, -35px);
		}
	}

	:global(.close-button) {
		width: 64px !important;
		height: 64px !important;

		@media (max-width: 480px) {
			width: 40px !important;
			height: 40px !important;
			margin: 10px !important;
		}

		@media (max-width: 768px) {
			width: 50px !important;
			height: 50px !important;
			margin: 15px !important;
		}

		// Portrait layout: make close button 2x smaller (32px instead of 64px)
		@media (orientation: portrait) {
			width: 32px !important;
			height: 32px !important;
			margin: 10px !important;
		}
	}

	:global(.close-button::before),
	:global(.close-button::after) {
		width: 36px !important; // 45px * 0.8 = 36px

		@media (max-width: 480px) {
			width: 24px !important;
			height: 4px !important;
		}

		@media (max-width: 768px) {
			width: 32px !important;
		}

		// Portrait layout: make cross lines 2x smaller
		@media (orientation: portrait) {
			width: 18px !important; // 36px / 2 = 18px
			height: 3px !important; // Slightly thicker for visibility on small size
		}
	}
</style>
