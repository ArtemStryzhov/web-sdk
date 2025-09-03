<script lang="ts">
	import { blur } from 'svelte/transition';
	import { onMount, type Snippet } from 'svelte';

	import { waitForTimeout } from 'utils-shared/wait';

	import OnHotkey from './OnHotkey.svelte';

	type Props = {
		children: Snippet;
		zIndex: number;
		persistent?: boolean;
		onclose: () => void;
		noFullScreenOverlay?: boolean;
		allowClickOutsideToClose?: boolean;
	};

	const props: Props = $props();

	const zIndexInternal = {
		topLayer: 2,
		clickToCloseLayer: 1,
		closeButton: 101,
		contentLayer: 100,
	};

	const closeModal = () => (props.persistent ? undefined : props.onclose());

	let disabled = $state(true);

	onMount(async () => {
		await waitForTimeout(300);

		disabled = false;
	});
</script>

<OnHotkey hotkey="Escape" onpress={closeModal} />

	<div class="pop-up-wrap" class:disabled class:no-fullscreen={props.noFullScreenOverlay} style={`z-index: ${props.zIndex};`}>
		{#if !props.noFullScreenOverlay}
			<div class="blur-layer"></div>
		{/if}

		{#if props.allowClickOutsideToClose}
			<div
				tabindex={0}
				class="click-to-close-layer"
				onclick={closeModal}
				onkeypress={closeModal}
				role="button"
				style="--zIndex: {zIndexInternal.clickToCloseLayer}"
			></div>
		{/if}

		<div
			class="top-layer"
			style="--zIndex: {zIndexInternal.topLayer}"
			in:blur={{ duration: 300, opacity: 0 }}
		>
		{#if !props.persistent}
			<div class="close-button-wrap" style="--zIndex: {zIndexInternal.closeButton}">
				<button class="close-button" data-test="close-button" onclick={closeModal} aria-label="Close modal"></button>
			</div>
		{/if}
		{@render props.children()}
	</div>
</div>

<style lang="scss">
	.pop-up-wrap {
		font-family: 'Kanit', sans-serif;
		touch-action: manipulation;
		color: white;
		position: fixed;
		left: 0;
		top: 0;
		bottom: 0;
		right: 0;

		display: flex !important;
		justify-content: center;
		align-items: center;

		&.disabled {
			pointer-events: none;
		}
	}

	.blur-layer {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		right: 0;
		background-color: rgba(20, 20, 23, 0.95);
		/* No blur - removed backdrop-filter */
	}

	.top-layer {
		z-index: var(--zIndex);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.click-to-close-layer {
		z-index: var(--zIndex);

		position: absolute;
		width: 100%;
		height: 100%;
	}

	.close-button-wrap {
		position: absolute;
		top: 0;
		right: 0;
		z-index: var(--zIndex);
	}

	.close-button {
		cursor: pointer;
		background-color: transparent;
		border: none;
		width: 80px;
		height: 80px;
		position: relative;
		padding: 0;
		margin: 20px;
	}

	.close-button::before,
	.close-button::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 45px;
		height: 5px;
		background-color: #D8ECA6;
		border-radius: 2.5px;
		transform-origin: center;
	}

	.close-button::before {
		transform: translate(-50%, -50%) rotate(45deg);
	}

	.close-button::after {
		transform: translate(-50%, -50%) rotate(-45deg);
	}
</style>
