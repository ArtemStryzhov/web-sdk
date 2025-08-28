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
	}

	.range-input-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.rounds-slider {
		width: 313px;
		height: 30px;
		border-radius: 15px;
		background: rgba(217, 217, 217, 0.3);
		outline: none;
		-webkit-appearance: none;
		appearance: none;

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
		}

		&::-moz-range-thumb {
			width: 30px;
			height: 30px;
			border-radius: 50%;
			background: #D8ECA6;
			cursor: pointer;
			border: none;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		}
	}

	.value-display {
		width: 55px;
		height: 57px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
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
	}

	.value-text {
		position: relative;
		z-index: 2;
		font-family: 'Kanit', Arial, sans-serif;
		font-weight: 600;
		font-size: 25px;
		color: #D8ECA6;
	}
</style>
