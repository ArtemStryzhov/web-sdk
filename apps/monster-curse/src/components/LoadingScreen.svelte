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
		x={context.stateLayoutDerived.canvasSizes().width * 0.5}
		y={20}
		width={719*0.4}
		height={628*0.4}
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
		x={context.stateLayoutDerived.canvasSizes().width * 0.5}
		y={20}
		width={719*0.4}
		height={628*0.4}
		zIndex={10002}
	/>
	<!-- Stone animation layer -->
	{#if stonesFalling}
		<StoneAnimation duration={500} speed={4500} scale={1/2} onComplete={onStoneComplete} />
	{/if}

	<!-- Button layer -->
	<PressToContinue onpress={onPressToContinue} />
</FadeContainer>
