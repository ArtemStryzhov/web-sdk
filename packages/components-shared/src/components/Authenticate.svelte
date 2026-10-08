<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	import { requestAuthenticate } from 'rgs-requests';

	// Define the response type locally to avoid import issues
	type AuthenticateResponse = {
		status?: { statusCode?: string; statusMessage?: string };
		balance?: { amount: number; currency: string };
		round?: {
			roundID?: number;
			amount?: number;
			payout?: number;
			payoutMultiplier?: number;
			active?: boolean;
			mode?: string;
			event?: string;
			state?: unknown[];
		};
		config?: {
			minBet?: number;
			maxBet?: number;
			stepBet?: number;
			betLevels?: number[];
			betModes?: Record<string, { mode?: string; costMultiplier?: number; feature?: boolean }>;
			defaultBetLevel?: number;
			jurisdiction: {
				socialCasino: boolean;
				disabledFullscreen: boolean;
				disabledTurbo: boolean;
				disabledSuperTurbo: boolean;
				disabledAutoplay: boolean;
				disabledSlamstop: boolean;
				disabledSpacebar: boolean;
				disabledBuyFeature: boolean;
				displayNetPosition: boolean;
				displayRTP: boolean;
				displaySessionTimer: boolean;
				minimumRoundDuration: number;
			};
		};
		error?: unknown;
	};
	import {
		stateUrlDerived,
		stateBet,
		stateConfig,
		stateModal,
		stateUi,
	} from 'state-shared';
	import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';

	import { loadReplayRound } from '../replay';

	type Props = { children: Snippet };

	const props: Props = $props();

	let authenticated = $state(false);

	const MENU_OPTIONS_MAX = 19;
	// evenly spread subset of the RGS levels, always including first and last
	const pickMenuOptions = (levels: number[]) => {
		if (levels.length <= MENU_OPTIONS_MAX) return levels;
		const picked = Array.from(
			{ length: MENU_OPTIONS_MAX },
			(_, i) => levels[Math.round((i * (levels.length - 1)) / (MENU_OPTIONS_MAX - 1))],
		);
		return picked.filter((value, index, array) => array.indexOf(value) === index);
	};

	const authenticate = async () => {
		try {
			// Real server authentication
			const authenticateData = await requestAuthenticate({
				rgsUrl: stateUrlDerived.rgsUrl(),
				sessionID: stateUrlDerived.sessionID(),
				language: stateUrlDerived.lang(),
			});

			// error
			if (authenticateData?.error) throw authenticateData;

			// Cast to proper type to help TypeScript
			const typedData = authenticateData as AuthenticateResponse;

			// balance
			if (typedData?.balance) {
				// Example of authenticateData.balance
				// {
				// 		"amount": 10000000000000000,
				// 		"currency": "USD"
				// },
				stateBet.currency = typedData.balance.currency;
				stateBet.balanceAmount = typedData.balance.amount / API_AMOUNT_MULTIPLIER;
			}

			// config
			if (typedData?.config) {
				// Example of authenticateData.config
				// {
				// 	"gameID": "37_test-lines",
				// 	"minBet": 100000,
				// 	"maxBet": 1000000000,
				// 	"stepBet": 10000,
				// 	"defaultBetLevel": 1000000,
				// 	"betLevels": [100000, 200000, ..., 1000000000],
				// 	"betModes": {},
				// 	"jurisdiction": {
				// 			"socialCasino": false,
				// 			"disabledFullscreen": false,
				// 			"disabledTurbo": false,
				// 			"disabledSuperTurbo": false,
				// 			"disabledAutoplay": false,
				// 			"disabledSlamstop": false,
				// 			"disabledSpacebar": false,
				// 			"disabledBuyFeature": false,
				// 			"displayNetPosition": false,
				// 			"displayRTP": false,
				// 			"displaySessionTimer": false,
				// 			"minimumRoundDuration": 0
				// 	}
				// }
				stateConfig.jurisdiction = typedData?.config?.jurisdiction;
				const { minBet, maxBet, stepBet, defaultBetLevel, betLevels } = typedData.config;
				const toAmount = (value: number) => value / API_AMOUNT_MULTIPLIER;

				let levels = [...(betLevels || [])].sort((a, b) => a - b).map(toAmount);
				if (minBet !== undefined) levels = levels.filter((level) => level >= toAmount(minBet));
				if (maxBet !== undefined) levels = levels.filter((level) => level <= toAmount(maxBet));

				if (levels.length > 0) {
					stateConfig.betAmountOptions = levels;
					stateConfig.betMenuOptions = pickMenuOptions(levels);
				}
				stateConfig.minBet = minBet !== undefined ? toAmount(minBet) : levels[0];
				stateConfig.maxBet = maxBet !== undefined ? toAmount(maxBet) : levels[levels.length - 1];
				stateConfig.stepBet = stepBet !== undefined ? toAmount(stepBet) : undefined;
				stateConfig.defaultBetLevel =
					defaultBetLevel !== undefined ? toAmount(defaultBetLevel) : undefined;

				// initial bet: RGS default, otherwise the closest allowed level
				const initialBet = stateConfig.defaultBetLevel ?? stateBet.betAmount;
				const allowed = stateConfig.betAmountOptions;
				const closest = allowed.reduce(
					(best, level) =>
						Math.abs(level - initialBet) < Math.abs(best - initialBet) ? level : best,
					allowed[0],
				);
				stateBet.betAmount = closest;
				stateBet.wageredBetAmount = closest;
			}

			// round
			if (typedData?.round) {
				// Example of authenticateData.round
				// {
				// 	"betID": 62277967,
				// 	"amount": 1000000,
				// 	"payout": 33400000,
				// 	"payoutMultiplier": 33.4,
				// 	"active": true,
				// 	"state": [...],
				// 	"mode": "BONUS",
				// 	"event": null
				// }

				if (typedData.round?.state) {
					// @ts-ignore
					stateBet.lastBet = typedData.round;
				}

				if (typedData.round?.amount) {
					const betAmountValue =
						typedData.round.amount > 0 ? typedData.round.amount / API_AMOUNT_MULTIPLIER : 0;
					stateBet.betAmount = betAmountValue;
					stateBet.wageredBetAmount = betAmountValue;
				}

				if (typedData.round?.mode) {
					stateBet.activeBetModeKey = typedData.round.mode;
				}
			}
		} catch (error) {
			console.error(error);
			stateModal.modal = { name: 'error', error };
		}
	};

	const handleReplay = async () => {
		try {
			await loadReplayRound();
		} catch (error) {
			console.error(error);
			stateModal.modal = { name: 'error', error };
		}
	};

	onMount(async () => {
		if (stateUrlDerived.replay()) {
			stateUi.config.mode = 'replay';
			await handleReplay();
		} else {
			stateUi.config.mode = 'default';
			await authenticate();
		}

		authenticated = true;
	});
</script>

{#if authenticated}
	{@render props.children()}
{/if}
