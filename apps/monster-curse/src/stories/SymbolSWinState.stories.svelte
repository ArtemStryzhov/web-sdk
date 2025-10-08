<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Symbols/S Symbol - Win State',
		parameters: {
			layout: 'fullscreen',
		},
	});
</script>

<script lang="ts">
	import { Container, Text, Graphics, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';
	import Symbol from '../components/Symbol.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import assets from '../game/assets';

	let animationKey = $state(0);
	let isPlaying = $state(false);
	
	const positions = [
		{ position: 0, label: 'Position 0 (Top)', percentage: '5%' },
		{ position: 1, label: 'Position 1', percentage: '32%' },
		{ position: 2, label: 'Position 2 (Mid)', percentage: '55%' },
		{ position: 3, label: 'Position 3', percentage: '79%' },
		{ position: 4, label: 'Position 4 (Bottom)', percentage: '100%' },
	];

	function playAnimation() {
		if (!isPlaying) {
			isPlaying = true;
			animationKey++; // Force re-render to restart animation
		}
	}

	function handleAnimationComplete() {
		isPlaying = false;
	}
</script>

<Story name="S Symbol Win State">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container>
				<!-- Title -->
				<Text
					x={640}
					y={30}
					anchor={0.5}
					text="S Symbol Expansion by Reel Position"
					style={{
						fontFamily: 'Arial',
						fontSize: 24,
						fill: 0xffffff,
						fontWeight: 'bold',
					}}
				/>

				<!-- All 5 positions displayed in a row -->
				{#each positions as { position, label, percentage }, index}
					<Container x={130 + index * 205} y={613}>
						<!-- Label -->
						<Text
							x={0}
							y={-280}
							anchor={0.5}
							text={label}
							style={{
								fontFamily: 'Arial',
								fontSize: 14,
								fill: 0xffffff,
								fontWeight: 'bold',
							}}
						/>
						
						<!-- Percentage -->
						<Text
							x={0}
							y={-260}
							anchor={0.5}
							text={percentage}
							style={{
								fontFamily: 'Arial',
								fontSize: 12,
								fill: 0x00ff00,
							}}
						/>

						<!-- S Symbol with specific position -->
						{#key animationKey}
							<Symbol
								x={0}
								y={0}
								rawSymbol={{ name: 'S', scatter: true, reelPosition: position }}
								state="win"
								loop={false}
								oncomplete={handleAnimationComplete}
							/>
						{/key}
					</Container>
				{/each}

				<!-- Play Button -->
				<Container x={640} y={350}>
					<Graphics
						x={0}
						y={0}
						draw={(g) => {
							g.clear();
							// Button background
							g.beginFill(isPlaying ? 0x666666 : 0x00aa00);
							g.drawRoundedRect(-60, -20, 120, 40, 8);
							g.endFill();
							
							// Button border
							g.lineStyle(2, isPlaying ? 0x444444 : 0x00ff00);
							g.drawRoundedRect(-60, -20, 120, 40, 8);
						}}
						interactive={!isPlaying}
						cursor={isPlaying ? 'default' : 'pointer'}
						onclick={playAnimation}
					/>
					<Text
						x={0}
						y={0}
						anchor={0.5}
						text={isPlaying ? 'Playing...' : '▶️ Play Animation'}
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0xffffff,
							fontWeight: 'bold',
						}}
					/>
				</Container>

				<!-- Reel demonstration on the right side -->
				<Container x={1100} y={100}>
					<Text
						x={0}
						y={-30}
						anchor={0.5}
						text="Reel Positions"
						style={{
							fontFamily: 'Arial',
							fontSize: 18,
							fill: 0xffffff,
							fontWeight: 'bold',
						}}
					/>

					<!-- 5 regular symbols in reel positions -->
					{@const reelSymbols = ['H1', 'L1', 'H2', 'L2', 'H3'] as const}
					{#each reelSymbols as symbolName, position}
						<Container x={0} y={position * 125 + 10}>
							<Symbol
								x={0}
								y={0}
								rawSymbol={{ name: symbolName }}
								state="static"
								loop={false}
							/>
							
							<!-- Position label -->
							<Text
								x={-80}
								y={0}
								anchor={0.5}
								text={`Pos ${position}`}
								style={{
									fontFamily: 'Arial',
									fontSize: 12,
									fill: 0x00ff00,
								}}
							/>
						</Container>
					{/each}

					<!-- Payframes for reel symbols -->
					<Container zIndex={10000}>
						{#each reelSymbols as _, position}
							<SpineProvider x={0} y={position * 125 + 10} key="anticipation" width={SYMBOL_SIZE * 0.6}>
								<SpineTrack trackIndex={0} animationName={'payframe'} loop />
							</SpineProvider>
						{/each}
					</Container>
				</Container>
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>
