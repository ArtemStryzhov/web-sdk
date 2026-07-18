<script lang="ts">
	import { Button, Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import BaseIcon from './BaseIcon.svelte';
	import BaseTitle from './BaseTitle.svelte';
	import BaseContent from './BaseContent.svelte';
	import BaseScrollable from './BaseScrollable.svelte';
	import BaseButtonWrap from './BaseButtonWrap.svelte';
	import BaseButtonContent from './BaseButtonContent.svelte';
	import BetMenuAmountToggle from './BetMenuAmountToggle.svelte';
	import BetMenuAmountGrid from './BetMenuAmountGrid.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	const confirm = () => {
		stateModal.modal = null;
	};

	const isCompactMenuViewport = () => {
		if (typeof window === 'undefined') {
			return false;
		}

		return window.matchMedia('(orientation: landscape)').matches && window.innerWidth <= 1200 && window.innerHeight <= 600;
	};
</script>

<svelte:body
	class:bet-menu-open={stateModal.modal?.name === 'betAmountMenu'}
	class:bet-menu-compact={stateModal.modal?.name === 'betAmountMenu' && isCompactMenuViewport()}
/>

{#if stateModal.modal?.name === 'betAmountMenu'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="bet-menu-modal">
		<BaseContent maxWidth="100%">
			<div class="bet-menu-title-wrap">
			<BaseTitle>
				{i18nDerived.betMenu()}
			</BaseTitle>
			</div>
			<BaseScrollable type="column">
				<span>{i18nDerived.selectYourBet()}</span>
				<BetMenuAmountToggle />
				<BetMenuAmountGrid />
			</BaseScrollable>
			<BaseButtonWrap type="full-width">
				<Button data-test="confirm-button" onclick={confirm}>
					<BaseIcon width="100%" height="3rem" />
					<BaseButtonContent>
						<span style="font-size: 1rem;">{i18nDerived.confirm()}</span>
					</BaseButtonContent>
				</Button>
			</BaseButtonWrap>
		</BaseContent>
		</div>
	</Popup>
{/if}

<style lang="scss">
	@media (max-width: 420px) and (max-height: 260px) {
		:global(body.bet-menu-open .pop-up-wrap .close-button) {
			transform: scale(0.4);
			transform-origin: center;
		}
	}

	@media (max-width: 840px) and (max-height: 520px) and (orientation: landscape) {
		:global(body.bet-menu-open .pop-up-wrap .close-button) {
			width: 32px !important;
			height: 32px !important;
			margin: 8px !important;
			transform: none !important;
		}

		:global(body.bet-menu-open .pop-up-wrap .close-button::before),
		:global(body.bet-menu-open .pop-up-wrap .close-button::after) {
			width: 18px !important;
			height: 2px !important;
		}

		:global(body.bet-menu-compact .bet-menu-title-wrap) {
			transform: translateY(-10px);
		}
	}
</style>
