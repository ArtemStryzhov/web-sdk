<script lang="ts">
	import { onMount } from 'svelte';

	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateMetaDerived, stateModal, stateUrlDerived } from 'state-shared';

	import { i18nDerived } from '../i18n/i18nDerived';

	const isSocial = $derived(stateUrlDerived.social());

	// Mode names come from the game's bet-mode dictionary, the same one the reels,
	// the replay panel and index.json read. The second argument is only what a game
	// that does not register these modes falls back to — the dictionary wins.
	const contractName = $derived(stateMetaDerived.betModeName('feature_contract', 'Monster Contract'));
	const bladesName = $derived(stateMetaDerived.betModeName('feature_blades', 'Blades of Fate'));
	const contractHeading = $derived(contractName.toUpperCase());
	const bladesHeading = $derived(bladesName.toUpperCase());

	// Jurisdiction-compliant labels for social (sweepstakes) casino mode
	const txt = $derived({
		paytableHeading: isSocial ? 'WIN TABLE' : 'PAYTABLE',
		payingSymbols: isSocial ? 'winning symbols' : 'paying symbols',
		featureBuyHeading: isSocial ? 'FEATURE PLAY' : 'FEATURE BUY',
		buyBonusButton: isSocial ? 'FEATURE PLAY' : 'BUY BONUS',
		purchaseFeature: isSocial ? 'play game features' : 'purchase game features',
		monsterContractBuyHeading: `${contractHeading} ${isSocial ? 'BONUS PLAY' : 'BONUS BUY'}`,
		monsterContractPurchase: isSocial
			? `Players have the option to play the ${contractName} Bonus directly. This feature can be played for 100 times the underlying play amount and carries a theoretical expected return of 96.34%.`
			: `Players have the option to purchase the ${contractName} Bonus directly. This feature costs 100 times the underlying bet and carries a theoretical expected return of 96.34%.`,
		bladesOfFateBuyHeading: `${bladesHeading} ${isSocial ? 'BONUS PLAY' : 'BONUS BUY'}`,
		bladesOfFatePurchase: isSocial
			? `Players have the option to play the ${bladesName} Bonus directly. This feature can be played for 300 times the underlying play amount and carries a theoretical expected return of 96.34%.`
			: `Players have the option to purchase the ${bladesName} Bonus directly. This feature costs 300 times the underlying bet and carries a theoretical expected return of 96.34%.`,
		aboutTheGame: isSocial
			? 'Beast Hunt is a 5-reel, 5-row slot. The Silver Sword symbol expands upward on each spin. If the Silver Sword passes through an Elixir Flask during its expansion, the flask\'s multiplier value is applied to the Silver Sword\'s own multiplier.'
			: 'Beast Hunt is a 5-reel, 5-row payline slot. The Silver Sword symbol expands upward on each spin. If the Silver Sword passes through an Elixir Flask during its expansion, the flask\'s multiplier value is applied to the Silver Sword\'s own multiplier.',
		maxWin: isSocial
			? `This game has a theoretical expected return of 96.44% in normal mode, and 96.34% in both ${contractName} and ${bladesName} modes. The maximum possible win is 20000x the underlying play amount in normal mode, in ${contractName} and in ${bladesName}.`
			: `This game has a theoretical expected return of 96.44% in normal mode, and 96.34% in both ${contractName} and ${bladesName} modes. The maximum possible win is 20000x the underlying bet in normal mode, in ${contractName} and in ${bladesName}.`,
		waysToWin: isSocial
			? 'A winning combination is formed by landing at least 3 matching symbols on adjacent reels, beginning from the leftmost reel, across any of the 15 fixed lines. Only the single highest win per line is awarded.'
			: 'A winning combination is formed by landing at least 3 matching symbols on adjacent reels, beginning from the leftmost reel, across any of the 15 fixed paylines. Only the single highest win per payline is awarded.',
		paylinesImageAlt: isSocial ? 'Lines' : 'Paylines',

		// ── User Interaction Guide ───────────────────────────────────────────────
		// Same substitutions as the rest of the map: a social build plays rather
		// than bets or buys, and holds coins rather than funds.
		howToPlay: isSocial
			? 'Use the \u2212 and + buttons to change the play value. Press the SPIN button to play. The space bar can be used instead of the SPIN button.'
			: 'Use the \u2212 and + buttons to change the bet value. Press the SPIN button to play. The space bar can be used instead of the SPIN button.',
		betLabel: isSocial ? 'PLAY' : 'BET',
		balanceDescription: isSocial
			? 'shows the current amount of coins available to play.'
			: 'shows the current amount of funds available to play.',
		betDescription: isSocial
			? 'shows the current total play amount for a single game round.'
			: 'shows the current total bet for a single game round.',
		increaseDecreaseDescription: isSocial
			? 'decrease and increase the current play amount, cycling through the play levels available in the game.'
			: 'decrease and increase the current bet, cycling through the bet levels available in the game.',
		spinDescription: isSocial
			? 'starts the game round at the current play amount.'
			: 'starts the game round at the current bet.',
		buyBonusDescription: isSocial
			? `opens the feature play menu, where the ${contractName} Bonus and the ${bladesName} Bonus can be played directly. A confirmation step is required before a feature is played.`
			: `opens the feature purchase menu, where the ${contractName} Bonus and the ${bladesName} Bonus can be purchased directly. A confirmation step is required before a purchase is made.`,
		autoplayMenuDescription: isSocial
			? 'Select the number of automatic rounds to start automatic play. Automatic play runs at the currently selected play amount and stops when the selected number of rounds has been played, when the balance is insufficient for the next round, or when automatic play is stopped manually.'
			: 'Select the number of automatic rounds to start automatic play. Automatic play runs at the currently selected bet and stops when the selected number of rounds has been played, when the balance is insufficient for the next round, or when automatic play is stopped manually.',
	});

	// The button artwork carries no lettering — the game draws the label over it in
	// Pixi, so the guide reproduces the same two lines over the same sprite.
	const buyBonusButtonLines = $derived(isSocial ? ['FEATURE', 'PLAY'] : ['BUY', 'BONUS']);

	let useShortLandscapePadding = $state(false);
	let usePortraitTallPadding = $state(false);
	let use800x450Width = $state(false);

	const updateShortLandscapePadding = () => {
		if (typeof window === 'undefined') {
			useShortLandscapePadding = false;
			usePortraitTallPadding = false;
			use800x450Width = false;
			return;
		}

		const nextShortLandscape =
			window.matchMedia('(orientation: landscape)').matches &&
			window.innerWidth <= 1200 &&
			window.innerHeight <= 600;

		const nextPortraitTall =
			window.matchMedia('(orientation: portrait)').matches &&
			window.innerWidth >= 420 &&
			window.innerWidth <= 430 &&
			window.innerHeight >= 810 &&
			window.innerHeight <= 815;

		// 800x450-like: landscape, wider detection range to catch all ~800x450 variants
		const next800x450 =
			window.matchMedia('(orientation: landscape)').matches &&
			window.innerWidth >= 700 &&
			window.innerWidth <= 900 &&
			window.innerHeight >= 400 &&
			window.innerHeight <= 520;

		useShortLandscapePadding = nextShortLandscape;
		usePortraitTallPadding = nextPortraitTall;
		use800x450Width = next800x450;
	};

	const closeModal = () => {
		stateModal.modal = null;
	};

	const playHoverSound = () => {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('ui-button-hover'));
		}
	};

	onMount(() => {
		updateShortLandscapePadding();

		const onResize = () => {
			updateShortLandscapePadding();
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('resize', onResize);
			window.addEventListener('orientationchange', onResize);
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('resize', onResize);
				window.removeEventListener('orientationchange', onResize);
			}
		};
	});

</script>

{#if stateModal.modal?.name === 'gameRules'}
	<div class="game-rules-background"></div>

	<div class="close-button-container">
		<button class="custom-close-button" aria-label="Close game rules" onclick={closeModal} onmouseenter={playHoverSound}>
			<div class="close-x">
				<div class="diagonal-line line-1"></div>
				<div class="diagonal-line line-2"></div>
			</div>
		</button>
	</div>

	<Popup zIndex={zIndex.modal} persistent={true} onclose={() => (stateModal.modal = null)}>
		<div
			class="rules-scale-wrapper"
			style={useShortLandscapePadding ? '--rules-content-scale: 1;' : undefined}
		>
			<div
				class="rules-scroll-container"
				style={use800x450Width ? 'padding-left: 70px; padding-right: 70px; padding-bottom: 30px;' : (useShortLandscapePadding ? 'padding-left: 20px; padding-right: 20px; padding-bottom: 30px;' : (usePortraitTallPadding ? 'padding-left: 45px; padding-right: 45px; padding-bottom: 30px;' : undefined))}
				style:padding-top="40px"
				style:padding-bottom={use800x450Width || useShortLandscapePadding || usePortraitTallPadding ? '30px' : '60px'}
			>
				<div class="rules">
					<h1>ABOUT THE GAME</h1>
					<p>{txt.aboutTheGame}</p>

					<h1 class="centered">{txt.paytableHeading}</h1>
					<div class="symbol-rows">
						<ul class="l_symbols">
							<li class="img_A">
								<span class="symbol-icon"></span>
								<span>3x <b>0.2</b></span>
								<span>4x <b>0.5</b></span>
								<span>5x <b>2</b></span>
							</li>
							<li class="img_K">
								<span class="symbol-icon"></span>
								<span>3x <b>0.2</b></span>
								<span>4x <b>0.5</b></span>
								<span>5x <b>2</b></span>
							</li>
							<li class="img_Q">
								<span class="symbol-icon"></span>
								<span>3x <b>0.3</b></span>
								<span>4x <b>0.7</b></span>
								<span>5x <b>3</b></span>
							</li>
							<li class="img_J">
								<span class="symbol-icon"></span>
								<span>3x <b>0.3</b></span>
								<span>4x <b>0.7</b></span>
								<span>5x <b>3</b></span>
							</li>
							<li class="img_X">
								<span class="symbol-icon"></span>
								<span>3x <b>0.5</b></span>
								<span>4x <b>1</b></span>
								<span>5x <b>5</b></span>
							</li>
						</ul>

						<ul class="h_symbols">
							<li class="img_cat">
								<span class="symbol-icon"></span>
								<span>3x <b>1</b></span>
								<span>4x <b>2</b></span>
								<span>5x <b>8</b></span>
							</li>
							<li class="img_griffon">
								<span class="symbol-icon"></span>
								<span>3x <b>1.5</b></span>
								<span>4x <b>3</b></span>
								<span>5x <b>10</b></span>
							</li>
							<li class="img_bear">
								<span class="symbol-icon"></span>
								<span>3x <b>1.5</b></span>
								<span>4x <b>5</b></span>
								<span>5x <b>15</b></span>
							</li>
							<li class="img_wolf">
								<span class="symbol-icon"></span>
								<span>3x <b>2</b></span>
								<span>4x <b>10</b></span>
								<span>5x <b>20</b></span>
							</li>
						</ul>
					</div>

					<h1>ABOUT THE GAME</h1>
					<p>{txt.maxWin}</p>

					<h1>SPECIAL SYMBOLS</h1>
					<ul class="special_symbols">
						<li class="img_elicsir">
							<span class="symbol-icon"></span>
							<h2>ELIXIR FLASK SYMBOL</h2>
							<p>The Elixir Flask symbol substitutes for all {txt.payingSymbols} and functions as a Wild. Elixir Flask symbols always land with a multiplier value of x2, x3, x4, x5, or x10.</p>
						</li>
						<li class="img_B">
							<span class="symbol-icon"></span>
							<h2>{contractHeading} SYMBOL</h2>
							<p>The {contractName} symbol can only appear during the base game.</p>
						</li>
					</ul>

					<h1>FEATURES</h1>
					<h2>EXPANDING SILVER SWORD SYMBOLS</h2>
					<ul class="special_symbols">
						<li class="img_sword">
							<img src="assets/sprites/sword.png" alt="Silver Sword" class="sword-img" />
							<p>Silver Sword symbols land with a random multiplier value of <b>2x, 3x, 4x, 5x, 10x, 15x</b>, or <b>20x</b>. Upon landing, if a Silver Sword symbol participates in a winning combination, it expands upward to the top of the grid. All positions covered by an expanded Silver Sword symbol count as Wild. Each reel can hold only 1 Silver Sword symbol at a time. During upward expansion, Silver Sword symbols absorb any Elixir Flask symbols in their path, adding the flask's multiplier value to their own. If a winning combination contains more than one Silver Sword or Elixir Flask symbol carrying a multiplier, all multiplier values are summed before being applied to the total win. Silver Sword symbols become sticky upon landing and can expand on each subsequent spin, provided they form part of a winning combination. If a new Silver Sword symbol lands on a reel that already contains one, the upper symbol is removed.</p>
						</li>
					</ul>

					<h1>WAYS TO WIN</h1>
					<p>{txt.waysToWin}</p>

					<img class="paylines-img paylines-desktop" src="assets/sprites/paylines/paylines.png" alt={txt.paylinesImageAlt} />
					<img class="paylines-img paylines-mobile" src="assets/sprites/paylines/paylines_mob.png" alt={txt.paylinesImageAlt} />

					<h1>BONUS FEATURES</h1>
					<h2>{contractHeading}</h2>
					<p>Landing 3 Bonus symbols within a single spin sequence activates the {contractName} Bonus and awards 10 free spins. This bonus mode features an increased probability of landing Silver Sword and Elixir Flask symbols. Bonus symbols do not appear on the board during the {contractName} Bonus, so the free spins cannot be retriggered and no additional free spins can be awarded.</p>

					<h2>{bladesHeading}</h2>
					<p>Landing 4 Bonus symbols within a single spin sequence activates the {bladesName} Bonus and awards 10 free spins. This bonus mode features an increased probability of landing Silver Sword and Elixir Flask symbols. Bonus symbols do not appear on the board during the {bladesName} Bonus, so the free spins cannot be retriggered and no additional free spins can be awarded.</p>

					<h2>{txt.featureBuyHeading}</h2>
					<p>Players have the option to {txt.purchaseFeature} directly through the interface by selecting the {txt.buyBonusButton} button.</p>

					<h2>{txt.monsterContractBuyHeading}</h2>
					<p>{txt.monsterContractPurchase}</p>

					<h2>{txt.bladesOfFateBuyHeading}</h2>
					<p>{txt.bladesOfFatePurchase}</p>

					<h1>USER INTERACTION GUIDE</h1>
					<h2 class="plain">HOW TO PLAY</h2>
					<ul class="ui_controls">
						<li>
							<span class="control-visual">
								<span class="control-stack">
									<img class="control-img control-img--pair" src="assets/sprites/minus_enabled.png" alt="Decrease" />
									<img class="control-img control-img--pair" src="assets/sprites/plus_enabled.png" alt="Increase" />
								</span>
							</span>
							<p>{txt.howToPlay}</p>
						</li>
					</ul>

					<h2>MAIN GAME INTERFACE</h2>
					<ul class="ui_controls">
						<li>
							<span class="control-visual">
								<span class="control-readout">
									<span class="control-readout-label">BALANCE</span>
									<span class="control-readout-value">1,000.00</span>
								</span>
							</span>
							<p><b>BALANCE</b> &mdash; {txt.balanceDescription}</p>
						</li>

						<li>
							<span class="control-visual">
								<span class="control-readout">
									<span class="control-readout-label">{txt.betLabel}</span>
									<span class="control-readout-value">1.00</span>
								</span>
							</span>
							<p><b>{txt.betLabel}</b> &mdash; {txt.betDescription}</p>
						</li>

						<li>
							<span class="control-visual">
								<span class="control-stack">
									<img class="control-img control-img--pair" src="assets/sprites/minus_enabled.png" alt="Decrease" />
									<img class="control-img control-img--pair" src="assets/sprites/plus_enabled.png" alt="Increase" />
								</span>
							</span>
							<p><b>&minus;</b> and <b>+</b> &mdash; {txt.increaseDecreaseDescription}</p>
						</li>

						<li>
							<span class="control-visual">
								<span class="control-round-button">
									<img class="control-round-button-bg" src="assets/sprites/bgback.png" alt="" />
									<img class="control-spin-icon" src="assets/sprites/play.png" alt="Spin" />
								</span>
							</span>
							<p><b>SPIN</b> &mdash; {txt.spinDescription}</p>
						</li>

						<li>
							<span class="control-visual">
								<img class="control-img control-portrait-only" src="assets/sprites/autospin_mob_default.png" alt="Autoplay" />
								<span class="control-flat control-landscape-only">AUTOPLAY</span>
							</span>
							<p><b>AUTOPLAY</b> &mdash; opens the automatic play menu. A confirmation step is required before automatic play starts.</p>
						</li>

						<li>
							<span class="control-visual">
								<span class="control-buy">
									<span class="control-buy-frame"></span>
									<span class="control-buy-text">
										<span>{buyBonusButtonLines[0]}</span>
										<span>{buyBonusButtonLines[1]}</span>
									</span>
								</span>
							</span>
							<p><b>{txt.buyBonusButton}</b> &mdash; {txt.buyBonusDescription}</p>
						</li>

						<li>
							<span class="control-visual">
								<img class="control-img control-img--pair" src="assets/sprites/sound-on.png" alt="Sound on" />
								<img class="control-img control-img--pair" src="assets/sprites/sound-off.png" alt="Sound off" />
							</span>
							<p><b>Sound icon</b> &mdash; toggles all sound and music on and off.</p>
						</li>

						<li>
							<span class="control-visual">
								<span class="control-menu" role="img" aria-label="Menu"><i></i><i></i><i></i></span>
							</span>
							<p><b>&#9776; (Menu)</b> &mdash; opens the MAIN MENU.</p>
						</li>
					</ul>

					<h2>MAIN MENU</h2>
					<ul class="ui_controls">
						<li>
							<span class="control-visual">
								<span class="control-pill">
									<span class="control-pill-knob">
										<img src="assets/sprites/info.png" alt="" />
									</span>
									<span class="control-pill-text">GAME<br />INFO</span>
								</span>
							</span>
							<p><b>GAME INFO</b> &mdash; opens the information screen containing the game rules, the {txt.paytableHeading.toLowerCase()}, the ways to win and the description of all bonus features.</p>
						</li>

						<li>
							<span class="control-visual">
								<span class="control-pill control-pill--knob-right">
									<span class="control-pill-knob">
										<img src="assets/sprites/vector.png" alt="" />
									</span>
									<span class="control-pill-text">TURBO</span>
								</span>
							</span>
							<p><b>TURBO</b> &mdash; toggles turbo spin mode on and off. Turbo mode speeds up the presentation of a round; it does not affect the outcome of the round or the amount won.</p>
						</li>

						<li>
							<span class="control-visual">
								<span class="control-close" role="img" aria-label="Close"><i></i><i></i></span>
							</span>
							<p><b>X</b> &mdash; closes the menu and returns to the game.</p>
						</li>
					</ul>

					<h2>AUTOPLAY</h2>
					<ul class="ui_controls">
						<!--
							A still of the autoplay menu, built from the same markup and the same
							style values as `AutoSpinsOptions.svelte` and `AutoSpinsStartButton.svelte`,
							minus the panel background, and scaled into the guide's icon column.
							It illustrates the menu, so the slider is inert and the whole still is
							hidden from assistive technology — the paragraph beside it already
							carries the same information as text.
						-->
						<li class="autoplay-row">
							<div class="control-visual">
								<div class="autoplay-preview" aria-hidden="true">
									<div class="autoplay-preview-row">
										<input
											class="autoplay-preview-slider"
											type="range"
											min="0"
											max="200"
											value="10"
											disabled
											tabindex="-1"
										/>
										<div class="autoplay-preview-value">
											<div class="autoplay-preview-value-background"></div>
											<span class="autoplay-preview-value-text">10</span>
										</div>
									</div>
									<div class="autoplay-preview-start">
										<span class="autoplay-preview-start-text">{i18nDerived.startAutoplay()}</span>
									</div>
								</div>
							</div>
							<p>{txt.autoplayMenuDescription}</p>
						</li>

						<li>
							<span class="control-visual">
								<span class="control-round-button">
									<img class="control-round-button-bg" src="assets/sprites/bgback.png" alt="" />
									<img class="control-stop-icon" src="assets/sprites/stop.png" alt="Stop" />
								</span>
							</span>
							<p><b>STOP</b> &mdash; stops the reels of the current round immediately. Stopping the reels does not affect the outcome of the round or the amount won.</p>
						</li>
					</ul>

					<h1>GENERAL DISCLAIMER</h1>
					<p>Malfunction voids all wins and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many plays. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser.</p>
					<p>TM and © 2026 Engine.</p>
				</div>
			</div>
		</div>
	</Popup>
{/if}

<style lang="scss">
	// ─── Modal chrome ────────────────────────────────────────────────────────────
	.game-rules-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: #141417;
		opacity: 0.9;
		z-index: 49;
		pointer-events: none;
	}

	.close-button-container {
		position: fixed;
		top: 40px;
		right: 0px;
		z-index: 51;
		pointer-events: auto;
	}

	// On screens > 1800px, move close button 20px left
	@media (min-width: 1801px) {
		.close-button-container {
			right: 20px;
		}
	}

	.custom-close-button {
		width: 60px;
		height: 40px;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: #000000;
			opacity: 0.01;
			border-radius: 0;
		}

		&:hover {
			opacity: 0.8;
		}
	}

	.close-x {
		position: relative;
		width: 22.5px;
		height: 22.5px;
	}

	.diagonal-line {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 22.5px;
		height: 2.5px;
		background-color: #d8eca6;
		border-radius: 1.25px;
		transform-origin: center;

		&.line-1 {
			transform: translate(-50%, -50%) rotate(45deg);
		}

		&.line-2 {
			transform: translate(-50%, -50%) rotate(-45deg);
		}
	}

	// ─── Rules content ───────────────────────────────────────────────────────────
	.rules-scale-wrapper {
		--rules-content-scale: 1;
		width: 100vw;
		height: 100dvh;
		min-height: 100vh;
		transform: scale(var(--rules-content-scale));
		transform-origin: top center;
	}

	.rules-scroll-container {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		box-sizing: border-box;
		padding: 40px 30px 60px;
	}

	// Width > 360: increase left and right padding by 15px (30px + 15px = 45px)
	@media (min-width: 361px) {
		.rules-scroll-container {
			padding-left: 45px;
			padding-right: 45px;
		}
	}

	// On 800x450: constrain .rules width to 660px (= 800 - 2*70px effective margin)
	// Targeting .rules instead of .rules-scroll-container avoids inline style specificity conflicts
	@media (orientation: landscape) and (min-width: 750px) and (max-width: 850px) and (min-height: 420px) and (max-height: 480px) {
		.rules-scroll-container .rules {
			width: 660px;
			margin-left: auto;
			margin-right: auto;
		}
	}

	// Width > 1000px: increase left and right padding by 20px more (45px + 20px = 65px)
	@media (min-width: 1001px) {
		.rules-scroll-container {
			padding-left: 65px;
			padding-right: 65px;
		}
	}

	// Width >= 1024: increase left and right padding (45px + 15px + 20px = 80px)
	@media (min-width: 1024px) {
		.rules-scroll-container {
			padding-left: 80px;
			padding-right: 80px;
		}
	}

	// Width > 1300px: fixed width content with 1190px max-width
	@media (min-width: 1301px) {
		.rules-scroll-container {
			margin: 0 auto;
		}
		
		.rules-scroll-container .rules {
			max-width: 1190px;
			width: 1190px;
			margin: 0 auto;
		}
	}

	// On 425x812: fix bottom padding to be minimal like on other screens, ensure scroll bar at right edge
	@media (min-width: 420px) and (max-width: 430px) and (min-height: 810px) and (max-height: 815px) {
		.rules-scroll-container {
			padding-left: 45px;
			padding-right: 45px;
			padding-bottom: 30px;
			overflow-x: visible;
		}
	}

	.rules {
		font-family: 'Kanit', Arial, sans-serif;
		color: #ffffff;
		font-size: 23px;
		line-height: 1.35;
		width: 100%;
		max-width: none;
		padding: 0;
		box-sizing: border-box;
		text-align: left;
		align-self: stretch;

		h1,
		b {
			color: #b5d36b;
		}

		h1.centered {
			text-align: center;
		}

		h2.plain {
			color: #ffffff;
		}

		h1,
		h2 {
			font-size: 35px;
			line-height: 1.1;
			font-weight: 700;
			margin: 34px 0 14px;
		}

		p {
			margin: 0 0 14px;
		}

		ul {
			list-style: none;
			padding: 0;
			margin: 0;
		}
	}

	// ─── Paytable symbol rows ────────────────────────────────────────────────────
	.symbol-rows {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 20px;
	}

	.l_symbols,
	.h_symbols {
		display: flex;
		flex-wrap: nowrap;
		justify-content: center;
		gap: 12px;
	}

	.l_symbols li,
	.h_symbols li {
		width: 170px;
		text-align: center;
		font-size: 30px;
		line-height: 1.2;

		span {
			display: block;
			white-space: nowrap;
		}
	}

	// ─── Symbol sprite (1000×601 source → 0.6× = 600×360.6 displayed) ───────────
	.symbol-icon {
		display: block;
		width: 120px;
		height: 120px;
		margin: 0 auto 10px;
		background-image: url('assets/sprites/symbolsStatic/symbolsStatic.png');
		background-repeat: no-repeat;
		background-size: 600px 360.6px;
	}

	// l1.png  x:200 y:0
	.img_A .symbol-icon {
		background-position: -120px 0;
	}

	// l2.png  x:800 y:0
	.img_K .symbol-icon {
		background-position: -480px 0;
	}

	// l3.png  x:600 y:0
	.img_Q .symbol-icon {
		background-position: -360px 0;
	}

	// l4.png  x:400 y:0
	.img_J .symbol-icon {
		background-position: -240px 0;
	}

	// l5.png  x:0 y:0
	.img_X .symbol-icon {
		background-position: 0 0;
	}

	// h1.png  x:600 y:200
	.img_cat .symbol-icon {
		background-position: -360px -120px;
	}

	// h2.png  x:400 y:200
	.img_griffon .symbol-icon {
		background-position: -240px -120px;
	}

	// h3.png  x:0 y:200
	.img_bear .symbol-icon {
		background-position: 0 -120px;
	}

	// h4.png  x:200 y:200
	.img_wolf .symbol-icon {
		background-position: -120px -120px;
	}

	// ─── Special symbols (float layout) ─────────────────────────────────────────
	.special_symbols {
		margin-top: 10px;

		li {
			margin-bottom: 18px;
			clear: both;
			overflow: auto;

			h2 {
				margin-top: 0;
			}
		}

		.symbol-icon {
			float: left;
			margin: 0 16px 8px 0;
		}
	}

	// w.png  x:200 y:400
	.img_elicsir .symbol-icon {
		background-position: -120px -240px;
	}

	// b.png  x:0 y:400
	.img_B .symbol-icon {
		background-position: 0 -240px;
	}

	.sword-img {
		width: auto;
		height: 373px;
		float: left;
		margin: 0 60px 8px 0;
	}

	// ─── Paylines image ───────────────────────────────────────────────────────────
	.paylines-img {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 20px 0;
	}

	.paylines-mobile {
		display: none;
	}

	// ─── User Interaction Guide ────────────────────────────────────────
	// Every visual below is the artwork the game itself draws, so the guide cannot
	// drift away from the live UI. Menu and close are the only two controls Pixi
	// builds from primitives rather than a sprite, so they are rebuilt here at the
	// same dimensions and colour.
	.ui_controls {
		margin: 10px 0 20px;

		li {
			display: flex;
			align-items: center;
			gap: 30px;
			margin-bottom: 20px;
		}

		p {
			margin: 0;
			flex: 1 1 auto;
		}
	}

	.control-visual {
		flex: 0 0 auto;
		width: 180px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
	}

	.control-img {
		display: block;
		width: auto;
		height: 76px;
	}

	.control-img--pair {
		height: 62px;
	}

	// − above +, the order and the axis the game itself uses.
	.control-stack {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	// SPIN / STOP — the light blob with the icon layered over it, at the same
	// relative sizes ButtonBet.svelte uses.
	.control-round-button {
		position: relative;
		display: block;
		width: 96px;
		height: 96px;
	}

	.control-round-button-bg,
	.control-spin-icon,
	.control-stop-icon {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.control-round-button-bg {
		width: 96px;
		height: 96px;
	}

	.control-spin-icon {
		width: 110px;
		height: 110px;
	}

	.control-stop-icon {
		width: 37px;
		height: 37px;
	}

	// Bonus-buy button — the frame is the `common` spritesheet cell (198×198 at
	// 1,196 in a 2884×2027 sheet) scaled to 120px, with the label drawn over it
	// exactly as the game draws it.
	.control-buy {
		position: relative;
		display: block;
		width: 120px;
		height: 120px;
	}

	.control-buy-frame {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: url('assets/sprites/common/spritesheet.png');
		background-repeat: no-repeat;
		background-size: 1747.9px 1228.5px;
		background-position: -0.6px -118.8px;
	}

	.control-buy-text {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		font-size: 21px;
		font-weight: 600;
		line-height: 1.15;
		color: #61e5ff;
	}

	// BALANCE / BET readouts, stacked the way UiLabel.svelte stacks them.
	.control-readout {
		display: flex;
		flex-direction: column;
		align-items: center;
		line-height: 1.15;
	}

	.control-readout-label {
		font-weight: 600;
		color: #d8eca6;
	}

	.control-readout-value {
		color: #e0e0e0;
	}

	// GAME INFO / TURBO pills, matching ButtonGameRules.svelte and ButtonTurbo.svelte.
	.control-pill {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 168px;
		height: 56px;
		padding: 0 6px;
		box-sizing: border-box;
		border-radius: 28px;
		background-color: rgba(217, 217, 217, 0.3);
	}

	.control-pill-knob {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 22px;
		background-color: rgba(207, 208, 202, 0.2);

		img {
			display: block;
			width: 11px;
			height: 24px;
		}
	}

	.control-pill-text {
		flex: 1 1 auto;
		text-align: center;
		font-size: 17px;
		font-weight: 600;
		line-height: 1.1;
		color: #d8eca6;
	}

	// Turbo reads as engaged: knob to the right, label to the left, lime bolt —
	// the end state of the toggle animation in ButtonTurbo.svelte.
	.control-pill--knob-right {
		flex-direction: row-reverse;
	}

	// AUTOPLAY the way UiButton.svelte draws it — 230×66 at 0.73, radius 20,
	// rgba(217, 217, 217, 0.3), lime label. Portrait swaps in the sprite the game
	// swaps in, so each orientation shows the control the player actually gets.
	.control-flat {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 168px;
		height: 48px;
		border-radius: 15px;
		background-color: rgba(217, 217, 217, 0.3);
		font-size: 29px;
		font-weight: 600;
		line-height: 1;
		color: #d8eca6;
	}

	.control-portrait-only {
		display: none;
	}

	@media (orientation: portrait) {
		.control-portrait-only {
			display: block;
		}

		.control-landscape-only {
			display: none;
		}
	}

	// Hamburger and close — 45/32/45 × 5 bars, 2.5 radius, #D8ECA6, as in
	// ButtonMenu.svelte and ButtonClose.svelte.
	.control-menu,
	.control-close {
		position: relative;
		width: 45px;
		height: 45px;
	}

	.control-menu {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 7px;

		i {
			display: block;
			height: 5px;
			border-radius: 2.5px;
			background-color: #d8eca6;

			&:nth-child(1),
			&:nth-child(3) {
				width: 45px;
			}

			&:nth-child(2) {
				width: 32px;
			}
		}
	}

	// ─── Autoplay menu still ───────────────────────────────────────────
	// Values copied from AutoSpinsOptions.svelte and AutoSpinsStartButton.svelte so
	// the still and the live menu stay identical; only the panel background is left out.
	// The still keeps the menu's own pixel values and is shrunk as a whole into the
	// 180px icon column, so it lines up with every other visual in the guide. `zoom`
	// rather than `transform` because it shrinks the layout box too, which keeps the
	// column width right at every breakpoint below without a per-breakpoint factor.
	.autoplay-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		width: 384px; // 313 slider + 1rem gap + 55 value badge
		zoom: 0.46875; // 180 / 384
	}

	.autoplay-preview-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.autoplay-preview-slider {
		width: 313px;
		height: 30px;
		margin: 0;
		border-radius: 15px;
		background: rgba(217, 217, 217, 0.3);
		outline: none;
		opacity: 1;
		cursor: default;
		-webkit-appearance: none;
		appearance: none;

		&::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 30px;
			height: 30px;
			border: none;
			border-radius: 50%;
			background: #d8eca6;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
			cursor: default;
		}

		&::-moz-range-thumb {
			width: 30px;
			height: 30px;
			border: none;
			border-radius: 50%;
			background: #d8eca6;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
			cursor: default;
		}
	}

	.autoplay-preview-value {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 55px;
		height: 57px;
	}

	.autoplay-preview-value-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(217, 217, 217, 0.3);
		border-radius: 23px;
		transform: rotate(45deg);
		transform-origin: center center;
		z-index: 1;
	}

	.autoplay-preview-value-text {
		position: relative;
		z-index: 2;
		font-size: 25px;
		font-weight: 600;
		line-height: 1;
		color: #d8eca6;
	}

	.autoplay-preview-start {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 135px;
		width: max-content;
		height: 3rem;
		padding: 0 1rem;
		border-radius: 135px;
		background: rgba(217, 217, 217, 0.3);
	}

	.autoplay-preview-start-text {
		font-size: 25px;
		font-weight: 600;
		line-height: 1;
		white-space: nowrap;
		color: #d8eca6;
	}

	@media (max-width: 480px) {
		.autoplay-preview-row {
			flex-direction: column;
			gap: 0.75rem;
		}

		.autoplay-preview-slider {
			width: 250px;
			height: 26px;
			border-radius: 13px;

			&::-webkit-slider-thumb {
				width: 26px;
				height: 26px;
			}

			&::-moz-range-thumb {
				width: 26px;
				height: 26px;
			}
		}

		.autoplay-preview-value {
			width: 48px;
			height: 50px;
		}

		.autoplay-preview-value-background {
			border-radius: 20px;
		}

		.autoplay-preview-value-text {
			font-size: 18px;
		}

		.autoplay-preview-start {
			min-width: 120px;
			padding: 0 0.75rem;
		}

		.autoplay-preview-start-text {
			font-size: 18px;
		}
	}

	@media (max-width: 768px) {
		.autoplay-preview-row {
			gap: 0.875rem;
		}

		.autoplay-preview-slider {
			width: 280px;
			height: 28px;
			border-radius: 14px;

			&::-webkit-slider-thumb {
				width: 28px;
				height: 28px;
			}

			&::-moz-range-thumb {
				width: 28px;
				height: 28px;
			}
		}

		.autoplay-preview-value {
			width: 52px;
			height: 54px;
		}

		.autoplay-preview-value-background {
			border-radius: 22px;
		}

		.autoplay-preview-value-text {
			font-size: 22px;
		}

		.autoplay-preview-start {
			min-width: 125px;
			padding: 0 0.875rem;
		}

		.autoplay-preview-start-text {
			font-size: 22px;
		}
	}

	@media (max-height: 600px) {
		.autoplay-preview-slider {
			height: 26px;
			border-radius: 13px;
		}

		.autoplay-preview-value {
			width: 50px;
			height: 52px;
		}

		.autoplay-preview-value-text {
			font-size: 20px;
		}

		.autoplay-preview-start-text {
			font-size: 20px;
		}
	}

	@media (max-height: 500px) {
		.autoplay-preview-row {
			gap: 0.5rem;
		}

		.autoplay-preview-slider {
			width: 240px;
			height: 24px;
			border-radius: 12px;

			&::-webkit-slider-thumb {
				width: 24px;
				height: 24px;
			}

			&::-moz-range-thumb {
				width: 24px;
				height: 24px;
			}
		}

		.autoplay-preview-value {
			width: 45px;
			height: 47px;
		}

		.autoplay-preview-value-background {
			border-radius: 18px;
		}

		.autoplay-preview-value-text {
			font-size: 16px;
		}

		.autoplay-preview-start {
			padding: 0 0.5rem;
		}

		.autoplay-preview-start-text {
			font-size: 16px;
		}
	}

	.control-close {
		display: block;

		i {
			position: absolute;
			top: 50%;
			left: 50%;
			width: 45px;
			height: 5px;
			margin: -2.5px 0 0 -22.5px;
			border-radius: 2.5px;
			background-color: #d8eca6;

			&:nth-child(1) {
				transform: rotate(45deg);
			}

			&:nth-child(2) {
				transform: rotate(-45deg);
			}
		}
	}

	@media (orientation: portrait) {
		.symbol-rows {
			flex-direction: row;
			flex-wrap: wrap;
			gap: 8px;
		}

		.l_symbols,
		.h_symbols {
			display: contents;
		}

		.l_symbols li,
		.h_symbols li {
			width: calc(33.333% - 6px);
			flex-shrink: 0;
			flex-grow: 0;
		}

		.paylines-desktop {
			display: none;
		}

		.paylines-mobile {
			display: block;
			margin-left: auto;
			margin-right: auto;
		}
	}

	@media (max-width: 1023px) {
		.rules-scroll-container {
			padding-bottom: 12px;
			padding-left: 12px;
			padding-right: 12px;
		}
	}

	@media (max-width: 799px) {
		.rules-scroll-container {
			padding-left: 10px;
			padding-right: 10px;
		}
	}

	// ─── Responsive symbol scaling ────────────────────────────────────────────────

	// < 700px: 80% of base size
	@media (max-width: 699px) {
		.symbol-icon {
			width: 96px;
			height: 96px;
			background-size: 480px 288.5px;
		}

		.img_A .symbol-icon { background-position: -96px 0; }
		.img_K .symbol-icon { background-position: -384px 0; }
		.img_Q .symbol-icon { background-position: -288px 0; }
		.img_J .symbol-icon { background-position: -192px 0; }
		.img_X .symbol-icon { background-position: 0 0; }
		.img_cat .symbol-icon { background-position: -288px -96px; }
		.img_griffon .symbol-icon { background-position: -192px -96px; }
		.img_bear .symbol-icon { background-position: 0 -96px; }
		.img_wolf .symbol-icon { background-position: -96px -96px; }
		.img_elicsir .symbol-icon { background-position: -96px -192px; }
		.img_B .symbol-icon { background-position: 0 -192px; }

		.sword-img { height: 298px; }
	}

	// < 550px: 60% of base size, 70% font sizes
	@media (max-width: 549px) {
		.rules {
			font-size: 16px;

			h1,
			h2 {
				font-size: 24.5px;
			}
		}

		.l_symbols li,
		.h_symbols li {
			font-size: 21px;
		}

		.symbol-icon {
			width: 72px;
			height: 72px;
			background-size: 360px 216.4px;
		}

		.img_A .symbol-icon { background-position: -72px 0; }
		.img_K .symbol-icon { background-position: -288px 0; }
		.img_Q .symbol-icon { background-position: -216px 0; }
		.img_J .symbol-icon { background-position: -144px 0; }
		.img_X .symbol-icon { background-position: 0 0; }
		.img_cat .symbol-icon { background-position: -216px -72px; }
		.img_griffon .symbol-icon { background-position: -144px -72px; }
		.img_bear .symbol-icon { background-position: 0 -72px; }
		.img_wolf .symbol-icon { background-position: -72px -72px; }
		.img_elicsir .symbol-icon { background-position: -72px -144px; }
		.img_B .symbol-icon { background-position: 0 -144px; }

		.sword-img { height: 224px; }
	}

	// Guide visuals follow the same step-downs as the paytable symbols above.
	@media (max-width: 699px) {
		.ui_controls li {
			gap: 22px;
		}

		.control-visual {
			width: 148px;
			gap: 12px;
		}

		.control-img { height: 62px; }
		.control-img--pair { height: 50px; }

		.control-round-button,
		.control-round-button-bg {
			width: 78px;
			height: 78px;
		}

		.control-spin-icon { width: 90px; height: 90px; }
		.control-stop-icon { width: 30px; height: 30px; }

		.control-buy { width: 98px; height: 98px; }

		.control-buy-frame {
			background-size: 1427.4px 1003.3px;
			background-position: -0.5px -97px;
		}

		.control-buy-text { font-size: 17px; }

		.control-pill {
			width: 138px;
			height: 46px;
			border-radius: 23px;
			gap: 8px;
		}

		.control-pill-knob {
			width: 36px;
			height: 36px;
			border-radius: 18px;

			img { width: 9px; height: 20px; }
		}

		.control-pill-text { font-size: 14px; }

		.control-stack { gap: 6px; }

		.control-flat {
			width: 138px;
			height: 40px;
			border-radius: 12px;
			font-size: 24px;
		}
	}

	@media (max-width: 699px) {
		.ui_controls li.autoplay-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 14px;
		}

		.autoplay-row .control-visual {
			width: auto;
			justify-content: flex-start;
		}

		.autoplay-preview {
			zoom: 0.7;
		}
	}

	@media (max-width: 549px) {
		.ui_controls li {
			gap: 16px;
			margin-bottom: 16px;
		}

		.control-visual {
			width: 112px;
			gap: 10px;
		}

		.control-img { height: 48px; }
		.control-img--pair { height: 40px; }

		.control-round-button,
		.control-round-button-bg {
			width: 60px;
			height: 60px;
		}

		.control-spin-icon { width: 69px; height: 69px; }
		.control-stop-icon { width: 23px; height: 23px; }

		.control-buy { width: 76px; height: 76px; }

		.control-buy-frame {
			background-size: 1107px 778.1px;
			background-position: -0.4px -75.2px;
		}

		.control-buy-text { font-size: 13px; }

		.control-pill {
			width: 106px;
			height: 36px;
			border-radius: 18px;
			gap: 6px;
			padding: 0 4px;
		}

		.control-pill-knob {
			width: 28px;
			height: 28px;
			border-radius: 14px;

			img { width: 7px; height: 15px; }
		}

		.control-pill-text { font-size: 11px; }

		.control-stack { gap: 5px; }

		.control-flat {
			width: 106px;
			height: 31px;
			border-radius: 9px;
			font-size: 18px;
		}

		.control-menu,
		.control-close {
			width: 32px;
			height: 32px;
		}

		.control-menu {
			gap: 5px;

			i {
				height: 4px;
				border-radius: 2px;

				&:nth-child(1),
				&:nth-child(3) { width: 32px; }

				&:nth-child(2) { width: 23px; }
			}
		}

		.control-close i {
			width: 32px;
			height: 4px;
			margin: -2px 0 0 -16px;
			border-radius: 2px;
		}
	}

	@media (max-width: 1023px) {
		.rules-scale-wrapper {
			--rules-content-scale: 0.8;
		}
	}

	@media (max-width: 749px) {
		.rules-scale-wrapper {
			--rules-content-scale: 0.68;
		}
	}

	// < 450px: 50% of base size
	@media (max-width: 449px) {
		.rules-scale-wrapper {
			--rules-content-scale: 0.578;
		}

		.symbol-icon {
			width: 60px;
			height: 60px;
			background-size: 300px 180.3px;
		}

		.img_A .symbol-icon { background-position: -60px 0; }
		.img_K .symbol-icon { background-position: -240px 0; }
		.img_Q .symbol-icon { background-position: -180px 0; }
		.img_J .symbol-icon { background-position: -120px 0; }
		.img_X .symbol-icon { background-position: 0 0; }
		.img_cat .symbol-icon { background-position: -180px -60px; }
		.img_griffon .symbol-icon { background-position: -120px -60px; }
		.img_bear .symbol-icon { background-position: 0 -60px; }
		.img_wolf .symbol-icon { background-position: -60px -60px; }
		.img_elicsir .symbol-icon { background-position: -60px -120px; }
		.img_B .symbol-icon { background-position: 0 -120px; }

		.sword-img { height: 187px; }
	}

	// Keep tall narrow phones from looking vertically compressed by the <=449 scale rule
	@media (max-width: 449px) and (min-height: 800px) {
		.rules-scale-wrapper {
			--rules-content-scale: 0.95;
		}

		.rules-scroll-container {
			padding-bottom: 30px;
		}
	}

	// Short narrow phones (e.g. 375x667)
	@media (max-width: 390px) and (max-height: 700px) {
		.rules-scale-wrapper {
			--rules-content-scale: 1;
		}

		.rules-scroll-container {
			padding-left: 27px;
			padding-right: 27px;
			padding-bottom: 30px;
		}
	}

	// Ultra-short landscape screens (e.g. 400x225)
	@media (max-width: 420px) and (max-height: 260px) {
		.rules-scroll-container {
			padding-left: 20px;
			padding-right: 20px;
			padding-bottom: 30px;
		}
	}

	// High-DPR equivalent of ultra-short landscape screens (e.g. 800x450 CSS viewport)
	@media (max-width: 840px) and (max-height: 520px) and (orientation: landscape) {
		.rules-scroll-container {
			padding-left: 20px !important;
			padding-right: 20px !important;
			padding-bottom: 30px !important;
		}
	}
</style>
