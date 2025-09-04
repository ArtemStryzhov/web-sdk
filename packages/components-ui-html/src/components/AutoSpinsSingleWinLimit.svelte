<script lang="ts">
	import { stateUi, SINGLE_WIN_LIMIT_TEXT_OPTIONS } from 'state-shared';
	import { OptionsGrid } from 'components-shared';

	import BaseIcon from './BaseIcon.svelte';
	import BaseButtonContent from './BaseButtonContent.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
</script>

<span class="title">{i18nDerived.singleWinLimit()}</span>

<OptionsGrid
	miniSize
	value={stateUi.autoSpinsSingleWinLimitText}
	options={SINGLE_WIN_LIMIT_TEXT_OPTIONS}
	onchange={(value) => (stateUi.autoSpinsSingleWinLimitText = value)}
>
	{#snippet option({ option })}
		<BaseIcon
			width="100%"
			height="2rem"
			border={option === stateUi.autoSpinsSingleWinLimitText
				? '2px white solid'
				: '2px black solid'}
		/>
		<BaseButtonContent>
			<span
				style="font-size: 1rem;"
				class:infinity={option === '∞'}
				class="option-wrap"
				data-test="single-win-limit-options"
			>
				{option}
			</span>
		</BaseButtonContent>
	{/snippet}
</OptionsGrid>

<style lang="scss">
	.title {
		line-height: 2rem;

		// Responsive adjustments
		@media (max-width: 480px) {
			line-height: 1.6rem;
			font-size: 0.9rem;
		}

		@media (max-width: 768px) {
			line-height: 1.8rem;
			font-size: 0.95rem;
		}

		@media (max-height: 500px) {
			line-height: 1.4rem;
			font-size: 0.85rem;
		}
	}

	.option-wrap {
		white-space: nowrap;

		// Responsive font size adjustments
		@media (max-width: 480px) {
			font-size: 0.85rem !important;
		}

		@media (max-width: 768px) {
			font-size: 0.9rem !important;
		}

		@media (max-height: 500px) {
			font-size: 0.8rem !important;
		}
	}

	.infinity {
		font-size: 1.5rem;
		line-height: 1rem;
		margin-top: 0.3rem;
		vertical-align: middle;

		// Responsive adjustments for infinity symbol
		@media (max-width: 480px) {
			font-size: 1.2rem;
			margin-top: 0.2rem;
		}

		@media (max-width: 768px) {
			font-size: 1.3rem;
			margin-top: 0.25rem;
		}

		@media (max-height: 500px) {
			font-size: 1.1rem;
			margin-top: 0.15rem;
		}
	}
</style>
