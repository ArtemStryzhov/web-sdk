<script lang="ts">
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import BaseContent from './BaseContent.svelte';
	import BaseTitle from './BaseTitle.svelte';
	import BaseScrollable from './BaseScrollable.svelte';
	import BaseButtonWrap from './BaseButtonWrap.svelte';
	import AutoSpinsOptions from './AutoSpinsOptions.svelte';
	import AutoSpinsStartButton from './AutoSpinsStartButton.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
</script>

{#if stateModal.modal?.name === 'autoSpin'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)} noFullScreenOverlay allowClickOutsideToClose>
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
	</Popup>
{/if}

<style lang="scss">
	.autoplay-title {
		font-family: 'Kanit', Arial, sans-serif !important;
		font-size: 55px !important;
		font-weight: bold !important;
		color: #D8ECA6 !important; // Same color as WIN label
		text-align: center;
		line-height: 1;
		margin: 50px 0 20px 0;
		padding: 0;
	}

	// Make close button 20% smaller (80px -> 64px)
	:global(.close-button) {
		width: 64px !important;
		height: 64px !important;
	}

	:global(.close-button::before),
	:global(.close-button::after) {
		width: 36px !important; // 45px * 0.8 = 36px
	}
</style>
