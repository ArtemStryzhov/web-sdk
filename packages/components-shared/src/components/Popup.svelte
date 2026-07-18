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
	const playHoverSound = () => {
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('ui-button-hover'));
		}
	};

	let disabled = $state(true);
	let isCompactCloseViewport = $state(false);

	const updateCompactCloseViewport = () => {
		if (typeof window === 'undefined') {
			isCompactCloseViewport = false;
			return;
		}

		const nextValue =
			window.matchMedia('(orientation: landscape)').matches &&
			window.innerWidth <= 1200 &&
			window.innerHeight <= 600;

		if (nextValue !== isCompactCloseViewport) {
			console.info('[Popup] compact close mode', {
				compact: nextValue,
				width: window.innerWidth,
				height: window.innerHeight,
				zIndex: props.zIndex,
			});
		}

		isCompactCloseViewport = nextValue;
	};

	onMount(() => {
		updateCompactCloseViewport();

		const onResize = () => {
			updateCompactCloseViewport();
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('resize', onResize);
			window.addEventListener('orientationchange', onResize);
		}

		void (async () => {
			await waitForTimeout(300);

			disabled = false;
		})();

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('resize', onResize);
				window.removeEventListener('orientationchange', onResize);
			}
		};
	});
</script>

<OnHotkey hotkey="Escape" onpress={closeModal} />

	<div class="pop-up-wrap" class:disabled class:no-fullscreen={props.noFullScreenOverlay} class:compact-close={isCompactCloseViewport} style={`z-index: ${props.zIndex};`}>
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
				<button
					class="close-button"
					data-test="close-button"
					onclick={closeModal}
					onmouseenter={playHoverSound}
					aria-label="Close modal"
					style={isCompactCloseViewport ? 'transform: scale(0.4); transform-origin: center; width: 80px; height: 80px; margin: 20px;' : undefined}
				></button>
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

	.pop-up-wrap.compact-close .close-button {
		width: 32px !important;
		height: 32px !important;
		margin: 8px !important;
	}

	.pop-up-wrap.compact-close .close-button::before,
	.pop-up-wrap.compact-close .close-button::after {
		width: 18px !important;
		height: 2px !important;
	}
</style>
