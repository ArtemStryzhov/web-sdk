<script lang="ts">
	import { Button } from 'components-shared';
	import {
		stateUi,
		stateBet,
		stateModal,
		stateBetDerived,
	} from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';

	import BaseIcon from './BaseIcon.svelte';
	import BaseButtonContent from './BaseButtonContent.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import type { EmitterEventModal } from '../types';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();

	const startAutoBet = () => {
		stateBet.autoSpinsCounter = stateUi.autoSpinsCustomRounds;
		if (stateBetDerived.activeBetMode().type === 'buy') stateBet.activeBetModeKey = 'BASE';
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
		eventEmitter.broadcast({ type: 'autoBet' });
		stateModal.modal = null;
	};
</script>

<div class="button-container">
	<Button disabled={!stateBetDerived.isBetCostAvailable()} onclick={startAutoBet}>
		<BaseIcon width="100%" height="3rem" background="rgba(217, 217, 217, 0.3)" />
		<BaseButtonContent>
			<span class="start-button-text">{i18nDerived.startAutoplay()}</span>
		</BaseButtonContent>
	</Button>
</div>

<style>
	.button-container {
		min-width: 135px;
		width: max-content;
		display: flex;
		justify-content: center;
		margin: 0 auto;
	}

	.start-button-text {
		font-family: 'Kanit', Arial, sans-serif !important;
		font-size: 25px !important;
		font-weight: 600 !important;
		color: #D8ECA6 !important;
		line-height: 1 !important;
		white-space: nowrap;
		padding: 0 1rem;
	}
</style>
