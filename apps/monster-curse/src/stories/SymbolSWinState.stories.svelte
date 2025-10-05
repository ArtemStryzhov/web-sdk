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
	import { Container, Text, Graphics } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';
	import Symbol from '../components/Symbol.svelte';
	import assets from '../game/assets';

	let animationKey = $state(0);
	let isPlaying = $state(false);

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
				<!-- S Symbol at bottom of page -->
				<Container x={400} y={600}>
					{#key animationKey}
						<Symbol
							x={0}
							y={0}
							rawSymbol={{ name: 'S', scatter: true }}
							state="win"
							loop={false}
							oncomplete={handleAnimationComplete}
						/>
					{/key}
				</Container>

				<!-- Play Button -->
				<Container x={400} y={450}>
					<Graphics
						x={300}
						y={0}
						draw={(g) => {
							g.clear();
							// Button background
							g.beginFill(isPlaying ? 0x666666 : 0x00aa00);
							g.drawRoundedRect(-80, -20, 160, 40, 8);
							g.endFill();
							
							// Button border
							g.lineStyle(2, isPlaying ? 0x444444 : 0x00ff00);
							g.drawRoundedRect(-80, -20, 160, 40, 8);
						}}
						interactive={!isPlaying}
						cursor={isPlaying ? 'default' : 'pointer'}
						onclick={playAnimation}
					/>
					<Text
						x={300}
						y={0}
						anchor={0.5}
						text={isPlaying ? 'Playing...' : '⚔️ Play Sword Animation'}
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0xffffff,
							fontWeight: 'bold',
						}}
					/>
				</Container>
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>
