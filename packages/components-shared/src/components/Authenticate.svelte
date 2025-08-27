<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	import { requestAuthenticate } from 'rgs-requests';
	import { stateUrlDerived, stateBet, stateConfig, stateModal } from 'state-shared';
	import { API_AMOUNT_MULTIPLIER, MOST_USED_BET_INDEXES } from 'constants-shared/bet';
	import { browser } from '$app/environment';//remove when not needed

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

			// balance
			if (authenticateData?.balance) {
				// Example of authenticateData.balance
				// {
				// 		"amount": 10000000000000000,
				// 		"currency": "USD"
				// },
				stateBet.currency = authenticateData.balance.currency;
				stateBet.balanceAmount = authenticateData.balance.amount / API_AMOUNT_MULTIPLIER;
			}

			// config
			if (authenticateData?.config) {
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
				stateConfig.jurisdiction = authenticateData?.config?.jurisdiction;
				stateConfig.betAmountOptions = (authenticateData.config?.betLevels || []).map(
					(level) => level / API_AMOUNT_MULTIPLIER,
				);
				stateConfig.betMenuOptions = stateConfig.betAmountOptions.filter((_, index) =>
					MOST_USED_BET_INDEXES.includes(index),
				);
			}

			// round
			if (authenticateData?.round) {
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

				if(authenticateData.round?.state) {
					// @ts-ignore
					stateBet.lastBet =  authenticateData.round;
				}

				if(authenticateData.round?.amount) {
					const betAmountValue =
						authenticateData.round.amount > 0
							? authenticateData.round.amount / API_AMOUNT_MULTIPLIER
							: 0;
					stateBet.betAmount = betAmountValue;
					stateBet.wageredBetAmount = betAmountValue;
				}

				if (authenticateData.round?.mode) {
					stateBet.activeBetModeKey = authenticateData.round.mode;
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
