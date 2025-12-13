<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer, LoadingProgress } from 'components-pixi';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import PressToContinue from './PressToContinue.svelte';
	import StoneAnimation from './StoneAnimation.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// Calculate logo scale based on layout and screen height
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());
const logoScale = $derived(
	(() => {
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

		return scale;
		}

		if (layoutType === 'tablet') {
			return 0.4 / 2; // 2 times smaller on tablet
		}

		if (layoutType === 'portrait') {
			return (0.4 / 3) * 1.3; // 30% larger on portrait
		}

		if (layoutType === 'landscape') {
			const baseScale = 0.4 / 3; // 3 times smaller on landscape
			// On small landscape screens (<=450px width), make logo 2x smaller
			if (canvasSizes.width <= 450) {
				return baseScale / 2;
			}
			return baseScale;
		}

		return 0.4;
	})()
);

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
		y={20}
		width={719 * logoScale}
		height={628 * logoScale}
	/>
	<MainContainer>
		<Container
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.5}
		>
			{#if !context.stateApp.loaded}
				<LoadingProgress y={250} width={1967 * 0.2} height={346 * 0.2}>
					{#snippet background(sizes)}
						<Sprite key="progressBarBackground.png" {...sizes} />
					{/snippet}
					{#snippet progress(sizes)}
						<Sprite key="progressBar.png" {...sizes} />
					{/snippet}
					{#snippet frame(sizes)}
						<Sprite key="progressBarFrame.png" {...sizes} />
					{/snippet}
				</LoadingProgress>
			{/if}
		</Container>
	</MainContainer>
</FadeContainer>

<!-- press to continue -->
<FadeContainer show={context.stateApp.loaded}>
	<Sprite
		key="logo_v.png"
		anchor={{ x: 0.5, y: 0 }}
		x={canvasSizes.width * 0.5}
		y={20}
		width={719 * logoScale}
		height={628 * logoScale}
		zIndex={10002}
	/>
	<!-- Stone animation layer -->
	{#if stonesFalling}
		<StoneAnimation duration={500} speed={4500} scale={1/2} onComplete={onStoneComplete} />
	{/if}

	<!-- Button layer -->
	<PressToContinue onpress={onPressToContinue} />
</FadeContainer>
