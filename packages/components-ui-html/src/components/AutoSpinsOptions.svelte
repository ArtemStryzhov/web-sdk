<script lang="ts">
	import { stateUi } from 'state-shared';

	// Type assertion to help TypeScript recognize the autoSpinsCustomRounds property
	const typedStateUi = stateUi as typeof stateUi & { autoSpinsCustomRounds: number };
</script>

<div class="range-input-container">
	<div class="range-input-wrapper">
		<input
			type="range"
			min="0"
			max="200"
			value={typedStateUi.autoSpinsCustomRounds}
			oninput={(e) => (typedStateUi.autoSpinsCustomRounds = parseInt((e.target as HTMLInputElement).value))}
			class="rounds-slider"
		/>
		<div class="value-display">
			<div class="value-background"></div>
			<span class="value-text">{typedStateUi.autoSpinsCustomRounds}</span>
		</div>
	</div>
</div>

<style lang="scss">
	.range-input-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100px;
		padding: 1rem;

		// Responsive adjustments for container
		@media (max-width: 480px) {
			min-height: 80px;
			padding: 0.75rem;
		}

		@media (max-width: 768px) {
			min-height: 90px;
			padding: 0.875rem;
		}

		@media (max-height: 600px) {
			min-height: 70px;
			padding: 0.75rem;
		}

		@media (max-height: 500px) {
			min-height: 60px;
			padding: 0.5rem;
		}
	}

	.range-input-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;

		// Responsive adjustments for wrapper
		@media (max-width: 480px) {
			gap: 0.75rem;
			flex-direction: column;
		}

		@media (max-width: 768px) {
			gap: 0.875rem;
		}

		@media (max-height: 500px) {
			gap: 0.5rem;
		}
	}

	.rounds-slider {
		width: 313px;
		height: 30px;
		border-radius: 15px;
		background: rgba(217, 217, 217, 0.3);
		outline: none;
		-webkit-appearance: none;
		appearance: none;

		// Responsive adjustments for slider
		@media (max-width: 480px) {
			width: 250px;
			height: 26px;
			border-radius: 13px;
		}

		@media (max-width: 768px) {
			width: 280px;
			height: 28px;
			border-radius: 14px;
		}

		@media (max-height: 600px) {
			height: 26px;
			border-radius: 13px;
		}

		@media (max-height: 500px) {
			width: 240px;
			height: 24px;
			border-radius: 12px;
		}

		&::-webkit-slider-thumb {
			-webkit-appearance: none;
			appearance: none;
			width: 30px;
			height: 30px;
			border-radius: 50%;
			background: #D8ECA6;
			cursor: pointer;
			border: none;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

			// Responsive thumb sizes
			@media (max-width: 480px) {
				width: 26px;
				height: 26px;
			}

			@media (max-width: 768px) {
				width: 28px;
				height: 28px;
			}

			@media (max-height: 500px) {
				width: 24px;
				height: 24px;
			}
		}

		&::-moz-range-thumb {
			width: 30px;
			height: 30px;
			border-radius: 50%;
			background: #D8ECA6;
			cursor: pointer;
			border: none;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

			// Responsive thumb sizes for Firefox
			@media (max-width: 480px) {
				width: 26px;
				height: 26px;
			}

			@media (max-width: 768px) {
				width: 28px;
				height: 28px;
			}

			@media (max-height: 500px) {
				width: 24px;
				height: 24px;
			}
		}
	}

	.value-display {
		width: 55px;
		height: 57px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;

		// Responsive adjustments for value display
		@media (max-width: 480px) {
			width: 48px;
			height: 50px;
		}

		@media (max-width: 768px) {
			width: 52px;
			height: 54px;
		}

		@media (max-height: 600px) {
			width: 50px;
			height: 52px;
		}

		@media (max-height: 500px) {
			width: 45px;
			height: 47px;
		}
	}

	.value-background {
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

		// Responsive border radius
		@media (max-width: 480px) {
			border-radius: 20px;
		}

		@media (max-width: 768px) {
			border-radius: 22px;
		}

		@media (max-height: 500px) {
			border-radius: 18px;
		}
	}

	.value-text {
		position: relative;
		z-index: 2;
		font-family: 'Kanit', Arial, sans-serif;
		font-weight: 600;
		font-size: 25px;
		color: #D8ECA6;

		// Responsive font sizes
		@media (max-width: 480px) {
			font-size: 18px;
		}

		@media (max-width: 768px) {
			font-size: 22px;
		}

		@media (max-height: 600px) {
			font-size: 20px;
		}

		@media (max-height: 500px) {
			font-size: 16px;
		}
	}
</style>
