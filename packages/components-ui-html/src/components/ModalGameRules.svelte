<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	import BaseContent from './BaseContent.svelte';
	import BaseScrollable from './BaseScrollable.svelte';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();
	
	const closeModal = () => {
		stateModal.modal = null;
	};
</script>

{#if stateModal.modal?.name === 'gameRules'}
	<!-- Custom background for game rules modal -->
	<div class="game-rules-background"></div>
	
	<!-- Custom close button matching main menu style -->
	<div class="close-button-container">
		<button class="custom-close-button" aria-label="Close game rules" onclick={closeModal}>
			<div class="close-x">
				<div class="diagonal-line line-1"></div>
				<div class="diagonal-line line-2"></div>
			</div>
		</button>
	</div>
	
	<Popup zIndex={zIndex.modal} persistent={true} onclose={() => (stateModal.modal = null)}>
		<BaseContent maxWidth="100%">
			<BaseScrollable type="column">
				<span>ADD YOUR GAME RULES</span>
				{@render props.children()}
			</BaseScrollable>
		</BaseContent>
	</Popup>
{/if}

<style lang="scss">
	.game-rules-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: #141417;
		opacity: 0.95;
		z-index: 49; // Just below the modal (zIndex.modal is 50)
		pointer-events: none;
	}

	.close-button-container {
		position: fixed;
		top: 40px;
		right: 40px;
		z-index: 51; // Above the modal
		pointer-events: auto;
	}

	.custom-close-button {
		width: 60px; // Reduced by 2x (was 120px)
		height: 40px; // Reduced by 2x (was 80px)
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		
		// Almost transparent background like the original
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
		width: 22.5px; // Reduced by 2x (was 45px)
		height: 22.5px; // Reduced by 2x (was 45px)
	}

	.diagonal-line {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 22.5px; // Reduced by 2x (was 45px)
		height: 2.5px; // Reduced by 2x (was 5px)
		background-color: #D8ECA6; // Same light green color as main menu
		border-radius: 1.25px; // Reduced by 2x (was 2.5px)
		transform-origin: center;
		
		&.line-1 {
			transform: translate(-50%, -50%) rotate(45deg);
		}
		
		&.line-2 {
			transform: translate(-50%, -50%) rotate(-45deg);
		}
	}
</style>
