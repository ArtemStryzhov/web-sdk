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
	import { stateUrlDerived, stateBet, stateConfig, stateModal } from 'state-shared';
	import { API_AMOUNT_MULTIPLIER, MOST_USED_BET_INDEXES } from 'constants-shared/bet';
	// Browser detection for development mode
	const browser = typeof window !== 'undefined';

	type Props = { children: Snippet };

	const props: Props = $props();

	let authenticated = $state(false);

	// Check for local development mode //remove when not needed***
	const isLocalMock = browser && (
		window.location.search.includes('mock=true') ||
		window.location.hostname === 'localhost' ||
		window.location.hostname === '127.0.0.1'
	);

	const mockAuthenticate = async () => {
		console.log('🎮 Using LOCAL MOCK authentication for development');
		
		// Set mock balance
		stateBet.currency = 'USD';
		stateBet.balanceAmount = 10000; // $10,000 mock balance
		stateBet.betAmount = 1; // $1 default bet

		// Set mock config
		stateConfig.jurisdiction = {
			socialCasino: false,
			disabledFullscreen: false,
			disabledTurbo: false,
			disabledSuperTurbo: false,
			disabledAutoplay: false,
			disabledSlamstop: false,
			disabledSpacebar: false,
			disabledBuyFeature: false,
			displayNetPosition: false,
			displayRTP: false,
			displaySessionTimer: false,
			minimumRoundDuration: 0
		};

		// Mock bet levels
		const mockBetLevels = [
			100000,    // $1.00
			200000,    // $2.00
			500000,    // $5.00
			1000000,   // $10.00
			2000000,   // $20.00
			5000000,   // $50.00
			10000000,  // $100.00
		];

		stateConfig.betAmountOptions = mockBetLevels.map(level => level / API_AMOUNT_MULTIPLIER);
		stateConfig.betMenuOptions = stateConfig.betAmountOptions.filter((_, index) =>
			MOST_USED_BET_INDEXES.includes(index),
		);

		console.log('💰 Mock balance:', stateBet.balanceAmount, stateBet.currency);
		console.log('🎯 Available bet amounts:', stateConfig.betAmountOptions);

		return true;
	};
//remove when not needed***
	const authenticate = async () => {
		try {
//remove when not needed***
			// Use mock authentication in local development //remove when not needed***
			if (isLocalMock) {
				await mockAuthenticate();
				return;
			}

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

				if(typedData.round?.state) {
					// @ts-ignore
					stateBet.lastBet =  typedData.round;
				}

				if(typedData.round?.amount) {
					const betAmountValue =
						typedData.round.amount > 0
							? typedData.round.amount / API_AMOUNT_MULTIPLIER
							: 0;
					stateBet.betAmount = betAmountValue;
					stateBet.wageredBetAmount = betAmountValue;
				}

				if (typedData.round?.mode) {
					stateBet.activeBetModeKey = typedData.round.mode;
				};
			}
		} catch (error) {
			console.error(error);
			stateModal.modal = { name: 'error', error };
		}
	};

	onMount(async () => {
		await authenticate();
		authenticated = true;
	});
</script>

{#if authenticated}
	{@render props.children()}
{/if}
