<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import PressToContinue from './PressToContinue.svelte';
	import StoneAnimation from './StoneAnimation.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();
	let resizeTick = $state(0);

	const debounce = (func: () => void, delay: number) => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			timeoutId = setTimeout(() => {
				func();
			}, delay);
		};
	};

	const refreshViewport = () => {
		resizeTick++;
	};

	// Calculate logo scale based on layout and screen height
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());
	const logoGlobalScale = 0.95;
	const isWidth1124OrLess = $derived(canvasSizes.width <= 1124);
	const isViewport1200x675Like = $derived.by(() => {
		if (layoutType !== 'desktop') {
			return false;
		}

		const similarity = Math.min(canvasSizes.width / 1200, canvasSizes.height / 675);
		return similarity >= 0.97 && similarity <= 1.03;
	});
	const isMidDesktopViewport = $derived.by(() => {
		if (layoutType !== 'desktop') {
			return false;
		}

		const similarity = Math.min(canvasSizes.width / 1200, canvasSizes.height / 675);
		return similarity >= 0.9 && similarity <= 1.2;
	});
	const logoYOffset1200x675 = $derived(isViewport1200x675Like ? -5 : 0);
const logoScale = $derived(
	(() => {
		resizeTick;

		if (layoutType === 'desktop') {
			let scale = 0.4;

			if (canvasSizes.height < 550) {
				scale = 0.3 * 0.7; // 30% smaller (base 0.3 * 0.7 = 0.21)
			}
			if (canvasSizes.height < 650) {
				scale = 0.3 * 0.8; // 20% smaller (base 0.3 * 0.8 = 0.24)
			}
			if (canvasSizes.height < 800) {
				scale = 0.3;
			}

			// Width <= 1024: shrink logo an additional 20%
			if (canvasSizes.width <= 1024) {
				scale *= 0.8;
			}

			if (isMidDesktopViewport && !isViewport1200x675Like) {
				scale *= 0.85;
			}

			if (isViewport1200x675Like) {
				scale *= 0.85 * 0.85 * 0.95;
			}

			if (isWidth1124OrLess) {
				scale *= 0.85;
			}

			return scale * logoGlobalScale;
		}

		if (layoutType === 'tablet') {
			return (0.4 / 2) * 1.2 * logoGlobalScale; // 2 times smaller on tablet, then increased by 20%
		}

		if (layoutType === 'portrait') {
			return (0.4 / 3) * 1.3 * 1.5 * logoGlobalScale; // 30% larger on portrait, then increased by 50%
		}

		if (layoutType === 'landscape') {
			const baseScale = 0.4 / 3; // 3 times smaller on landscape
			// On small landscape screens (<=450px width), make logo 2x smaller
			if (canvasSizes.width <= 450) {
				return (baseScale / 2) * logoGlobalScale;
			}
			return baseScale * logoGlobalScale;
		}

		return 0.4 * logoGlobalScale;
	})()
);

	onMount(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const onResize = debounce(() => {
			refreshViewport();
		}, 300);
		const onResizeImmediate = () => {
			refreshViewport();
			onResize();
		};

		window.addEventListener('resize', onResizeImmediate);
		window.addEventListener('orientationchange', onResizeImmediate);
		window.visualViewport?.addEventListener('resize', onResizeImmediate);

		return () => {
			window.removeEventListener('resize', onResizeImmediate);
			window.removeEventListener('orientationchange', onResizeImmediate);
			window.visualViewport?.removeEventListener('resize', onResizeImmediate);
		};
	});

	let stonesFalling = $state(false);

	const onPressToContinue = () => {
		stonesFalling = true;
	};

	const onStoneComplete = () => {
		stonesFalling = false;
		props.onloaded();
	};
</script>

<!-- logo and loading progress -->
<FadeContainer show={!context.stateApp.loaded}>
	<Sprite
		key="logo_v.png"
		anchor={{ x: 0.5, y: 0 }}
		x={canvasSizes.width * 0.5}
		y={20 + logoYOffset1200x675}
		width={719 * logoScale}
		height={628 * logoScale}
	/>
	<!-- Progress bar intentionally hidden: keep loading screen visuals only -->
</FadeContainer>

<!-- press to continue -->
<FadeContainer show={context.stateApp.loaded}>
	<Sprite
		key="logo_v.png"
		anchor={{ x: 0.5, y: 0 }}
		x={canvasSizes.width * 0.5}
		y={20 + logoYOffset1200x675}
		width={719 * logoScale}
		height={628 * logoScale}
		zIndex={10002}
	/>
	<!-- Stone animation layer -->
	{#if stonesFalling}
		<StoneAnimation coverAlpha={0} onComplete={onStoneComplete} />
	{/if}

	<!-- Button layer -->
	<PressToContinue onpress={onPressToContinue} />
</FadeContainer>
