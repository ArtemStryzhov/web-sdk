<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	import { requestAuthenticate, requestReplay } from 'rgs-requests';

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
	import { stateUrlDerived, stateBet, stateConfig, stateModal, stateUi } from 'state-shared';
	import { API_AMOUNT_MULTIPLIER, MOST_USED_BET_INDEXES } from 'constants-shared/bet';

	type Props = { children: Snippet };

	const props: Props = $props();

	let authenticated = $state(false);

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
				stateConfig.betAmountOptions = (typedData.config?.betLevels || []).map(
					(level: number) => level / API_AMOUNT_MULTIPLIER,
				);
				stateConfig.betMenuOptions = stateConfig.betAmountOptions.filter((_, index) =>
					MOST_USED_BET_INDEXES.includes(index),
				);
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
			const betAmountValue = stateUrlDerived.amount() / API_AMOUNT_MULTIPLIER || 0;
			stateBet.betAmount = betAmountValue;
			stateBet.wageredBetAmount = betAmountValue;
			// an unknown key would make stateBetDerived.activeBetMode() null, so only
			// take the mode from the URL when it is actually there
			if (stateUrlDerived.mode()) stateBet.activeBetModeKey = stateUrlDerived.mode();
			if (stateUrlDerived.currency()) stateBet.currency = stateUrlDerived.currency();

			const replayData = await requestReplay({
				rgsUrl: stateUrlDerived.rgsUrl(),
				game: stateUrlDerived.game(),
				mode: stateUrlDerived.mode(),
				version: stateUrlDerived.version(),
				event: stateUrlDerived.event(),
			});

			// error
			if ((replayData as { error?: unknown })?.error) throw replayData;

			// The endpoint returns the recorded round itself, but a wrapped
			// { round } envelope (the shape /wallet/play uses) is accepted too.
			const round = ((replayData as { round?: unknown })?.round ?? replayData) as {
				state?: unknown[];
			};

			if (!round?.state?.length) {
				throw {
					error: 'Empty state in replay response',
					message: JSON.stringify({ replayData }),
				};
			}

			// A replay has no session and no wallet, so it is played back through the
			// resume-bet path: 'event: 0' replays the round from its first book event.
			// @ts-ignore
			stateBet.lastBet = {
				...round,
				event: '0',
				active: true,
				mode: stateBet.activeBetModeKey,
			};
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
