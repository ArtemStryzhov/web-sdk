<script lang="ts">
	import { zIndex } from 'constants-shared/zIndex';
	import { getContextLayout } from 'utils-layout';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { stateReplayDerived, stateUi } from 'state-shared';
	import { numberToCurrencyString, numberToFloat } from 'utils-shared/amount';

	import { i18nDerived } from '../i18n/i18nDerived';
	import type { EmitterEventModal } from '../types';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();
	const { stateLayout } = getContextLayout();

	// The panel belongs to a replay window only, and it waits for the loading
	// screen: the player presses through that first, which is also what lets the
	// round's sounds play.
	const isReplay = $derived(stateUi.config.mode === 'replay');
	const isVisible = $derived(isReplay && !stateLayout.showLoadingScreen);

	const summary = $derived(stateReplayDerived.summary());

	// "1x", "0.1x", "300x" — a multiplier as the round recorded it, without
	// padding it to a fixed number of decimals.
	const multiplierText = (value: number) => `${numberToFloat(value)}x`;

	const startReplay = () => {
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
		eventEmitter.broadcast({ type: 'replayStart' });
	};
</script>

{#if isVisible && stateReplayDerived.isReady()}
	<div
		class="replay-overlay"
		data-test="replay-start-panel"
		style="--replay-z-index: {zIndex.modal}"
	>
		<div class="replay-panel">
			<div class="replay-badge">{i18nDerived.replay()}</div>
			<h1 class="replay-title">{i18nDerived.betReplay()}</h1>

			<dl class="replay-rows">
				<div class="replay-row">
					<dt>{i18nDerived.mode()}</dt>
					<dd class="accent">{summary.betModeName}</dd>
				</div>

				<div class="replay-divider"></div>

				<div class="replay-row">
					<dt>{i18nDerived.baseBet()}</dt>
					<dd class="accent">{numberToCurrencyString(summary.baseBetAmount)}</dd>
				</div>
				<div class="replay-row">
					<dt>{i18nDerived.costMultiplier()}</dt>
					<dd class="accent">{multiplierText(summary.costMultiplier)}</dd>
				</div>
				<div class="replay-row highlight">
					<dt>{i18nDerived.totalBetCost()}</dt>
					<dd class="accent strong">{numberToCurrencyString(summary.totalBetCost)}</dd>
				</div>

				<div class="replay-divider"></div>

				<div class="replay-row">
					<dt>{i18nDerived.payoutMultiplier()}</dt>
					<dd class="win">{multiplierText(summary.payoutMultiplier)}</dd>
				</div>
				<div class="replay-row highlight win-highlight">
					<dt>{i18nDerived.totalWin()}</dt>
					<dd class="win strong">{numberToCurrencyString(summary.totalWinAmount)}</dd>
				</div>
			</dl>

			<button class="replay-button" data-test="replay-start-button" onclick={startReplay}>
				<span class="replay-button-icon">▶</span>
				{i18nDerived.startReplay()}
			</button>

			<p class="replay-note">{i18nDerived.replayNote()}</p>
		</div>
	</div>
{/if}

{#if isVisible && stateReplayDerived.isFinished()}
	<!--
		The round has reached its final win. The button sits on its own so the
		finished board stays visible behind it; pressing it resets the scene to the
		round's opening state and plays the same round again.
	-->
	<div class="replay-again-wrap" style="--replay-z-index: {zIndex.modal}">
		<button class="replay-button compact" data-test="replay-again-button" onclick={startReplay}>
			<span class="replay-button-icon">▶</span>
			{i18nDerived.replayAgain()}
		</button>
	</div>
{/if}

<style lang="scss">
	.replay-overlay,
	.replay-again-wrap {
		// Every length below is in `em`, so the whole panel scales with this one
		// value instead of being clipped or scrolled on a small replay window.
		// It follows the shorter side of the viewport, which is what runs out
		// first in a popout (400x225 as much as 320x568).
		font-size: clamp(7px, min(2.7vh, 3.4vw), 16px);
		font-family: 'Kanit', sans-serif;
		position: fixed;
		left: 0;
		right: 0;
		z-index: var(--replay-z-index);
		// a replay window is exactly as tall as it is; nothing here may scroll
		overflow: hidden;
	}

	.replay-overlay {
		top: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.6em;
		box-sizing: border-box;
		background-color: rgba(9, 11, 22, 0.88);
	}

	.replay-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.7em;
		width: 100%;
		max-width: 34em;
		padding: 1.1em 1.2em 1em;
		box-sizing: border-box;
		border: 0.07em solid #2c3357;
		border-radius: 0.9em;
		background: linear-gradient(180deg, #151a33 0%, #10142a 100%);
		box-shadow: 0 0.5em 2em rgba(0, 0, 0, 0.45);
		color: #ffffff;
	}

	.replay-badge {
		padding: 0.25em 1.1em;
		border-radius: 999px;
		background-color: #f5c518;
		color: #1a1a1a;
		font-size: 0.85em;
		font-weight: 700;
		letter-spacing: 0.18em;
		line-height: 1.4;
	}

	.replay-title {
		margin: 0;
		font-size: 1.7em;
		font-weight: 700;
		line-height: 1.2;
		text-align: center;
	}

	.replay-rows {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		width: 100%;
		margin: 0;
		padding: 0.7em;
		box-sizing: border-box;
		border-radius: 0.7em;
		background-color: rgba(255, 255, 255, 0.03);
	}

	.replay-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1em;
		padding: 0.3em 0.55em;
		border-radius: 0.4em;
		line-height: 1.35;

		dt {
			color: #9aa2c0;
			font-size: 0.95em;
		}

		dd {
			margin: 0;
			font-weight: 700;
			text-align: right;
			word-break: break-word;
		}
	}

	.replay-row.highlight {
		background-color: rgba(255, 255, 255, 0.05);
	}

	.replay-row.win-highlight {
		background-color: rgba(46, 204, 113, 0.08);
	}

	.replay-row .strong {
		font-size: 1.15em;
	}

	.accent {
		color: #f5c518;
	}

	.win {
		color: #2ecc71;
	}

	.replay-divider {
		height: 0.07em;
		margin: 0.35em 0.55em;
		background-color: rgba(255, 255, 255, 0.1);
	}

	.replay-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5em;
		width: 100%;
		padding: 0.6em 1em;
		border: none;
		border-radius: 0.6em;
		background: linear-gradient(180deg, #ffd23f 0%, #f5a623 100%);
		color: #17140a;
		font-family: inherit;
		font-size: 1.25em;
		font-weight: 700;
		cursor: pointer;
		touch-action: manipulation;

		&:hover {
			filter: brightness(1.08);
		}

		&:active {
			transform: translateY(0.05em);
		}
	}

	.replay-button-icon {
		font-size: 0.85em;
	}

	.replay-note {
		margin: 0;
		color: #6f779a;
		font-size: 0.8em;
		line-height: 1.3;
		text-align: center;
	}

	.replay-again-wrap {
		bottom: 0;
		display: flex;
		justify-content: center;
		padding: 0.8em;
		pointer-events: none;
	}

	.replay-button.compact {
		width: auto;
		padding: 0.5em 1.6em;
		font-size: 1.1em;
		pointer-events: auto;
		box-shadow: 0 0.3em 1.2em rgba(0, 0, 0, 0.5);
	}

	// A very short replay window (400x225 and shorter) has no room for anything
	// that is not a number: the badge and the footnote go, the rest tightens.
	@media (max-height: 260px) {
		.replay-panel {
			gap: 0.45em;
			padding: 0.7em 0.9em;
		}

		.replay-badge,
		.replay-note {
			display: none;
		}

		.replay-title {
			font-size: 1.35em;
		}

		.replay-rows {
			padding: 0.45em;
		}

		.replay-row {
			padding: 0.15em 0.45em;
		}

		.replay-divider {
			margin: 0.2em 0.45em;
		}
	}
</style>
