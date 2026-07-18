<script lang="ts">
	import { onMount } from 'svelte';

	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	let useShortLandscapePadding = $state(false);

	const updateShortLandscapePadding = () => {
		if (typeof window === 'undefined') {
			useShortLandscapePadding = false;
			return;
		}

		const nextValue =
			window.matchMedia('(orientation: landscape)').matches &&
			window.innerWidth <= 1200 &&
			window.innerHeight <= 600;

		if (nextValue !== useShortLandscapePadding) {
			console.info('[ModalGameRules] short landscape padding mode', {
				enabled: nextValue,
				width: window.innerWidth,
				height: window.innerHeight,
			});
		}

		useShortLandscapePadding = nextValue;
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
				style={useShortLandscapePadding ? 'padding-left: 20px; padding-right: 20px; padding-bottom: 30px;' : undefined}
			>
				<div class="rules">
					<h1>ABOUT THE GAME</h1>
					<p>Monster Hunt is a 5-reel, 5-row payline slot. The Silver Sword symbol expands upward on each spin. If the Silver Sword passes through an Elixir Flask during its expansion, the flask's multiplier value is applied to the Silver Sword's own multiplier.</p>

					<h1 class="centered">PAYTABLE</h1>
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
					<p>This game has a theoretical expected return of 96.34% in normal mode. The maximum possible win across all betting modes, with the exception of Monster Contract and Blades of Fate, is 20000x the underlying bet. In Monster Contract and Blades of Fate modes, the maximum possible win reaches 40000x the underlying bet.</p>

					<h1>SPECIAL SYMBOLS</h1>
					<ul class="special_symbols">
						<li class="img_elicsir">
							<span class="symbol-icon"></span>
							<h2>ELIXIR FLASK SYMBOL</h2>
							<p>The Elixir Flask symbol substitutes for all paying symbols and functions as a Wild. Elixir Flask symbols always land with a multiplier value of x2, x3, x4, x5, or x10.</p>
						</li>
						<li class="img_B">
							<span class="symbol-icon"></span>
							<h2>MONSTER CONTRACT SYMBOL</h2>
							<p>The Monster Contract symbol can only appear during the base game.</p>
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
					<p>A winning combination is formed by landing at least 3 matching symbols on adjacent reels, beginning from the leftmost reel, across any of the 15 fixed paylines. Only the single highest win per payline is awarded.</p>

					<img class="paylines-img paylines-desktop" src="assets/sprites/paylines/paylines.png" alt="Paylines" />
					<img class="paylines-img paylines-mobile" src="assets/sprites/paylines/paylines_mob.png" alt="Paylines" />

					<h1>BONUS FEATURES</h1>
					<h2>MONSTER CONTRACT</h2>
					<p>Landing 3 Bonus symbols within a single spin sequence activates the Monster Contract Bonus and awards 10 free spins. This bonus mode features an increased probability of landing Silver Sword and Elixir Flask symbols.</p>

					<h2>BLADES OF FATE</h2>
					<p>Landing 4 Bonus symbols within a single spin sequence activates the Blades of Fate Bonus and awards 10 free spins. This bonus mode features an increased probability of landing Silver Sword and Elixir Flask symbols.</p>

					<h2>FEATURE BUY</h2>
					<p>Players have the option to purchase game features directly through the interface by selecting the BUY BONUS button.</p>

					<h2>MONSTER CONTRACT BONUS BUY</h2>
					<p>Players have the option to purchase the Monster Contract Bonus directly. This feature costs 100 times the underlying bet and carries a theoretical expected return of 96.34%.</p>

					<h2>BLADES OF FATE BONUS BUY</h2>
					<p>Players have the option to purchase the Blades of Fate Bonus directly. This feature costs 300 times the underlying bet and carries a theoretical expected return of 96.34%.</p>

					<h1>GENERAL INFO</h1>
					<p>SPIN BUTTON | Starts a new spin. SLAM STOP BUTTON | Immediately halts the current spin. INFORMATION | Displays game rules and the Paytable with all Symbol Values. AUTOPLAY | Opens the Autoplay settings menu. QUICK SPIN | Switch between Quick Spin, Instant Spin, and Regular speed modes. BUY BONUS | Opens the Feature Buy interface. SOUND | Toggle game sounds On or Off. MUSIC | Toggle background music On or Off. INCREASE | Raises the current Bet Amount. DECREASE | Lowers the current Bet Amount. BALANCE | Displays your current Balance in the selected currency. WIN | Displays the total win amount for the current spin. TOTAL WIN | Displays the cumulative win amount across all spins during free spins.</p>

					<h1>LEGAL NOTICE</h1>
					<p>Any malfunction renders all bets and payouts void. A stable internet connection is required at all times. Should a disconnection occur, please reload the game to complete any unfinished bets. The theoretical expected return is calculated across a large number of spins. Reel animations are purely illustrative and do not represent any physical device.</p>
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
