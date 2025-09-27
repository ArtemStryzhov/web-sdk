<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Symbols/W Symbol - Win State',
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

<Story name="W Symbol Win State">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container>
				<!-- Title -->
				<Text
					x={400}
					y={50}
					anchor={{ x: 0.5, y: 0 }}
					text="W Symbol - Win State"
					style={{
						fontFamily: 'Arial',
						fontSize: 28,
						fill: 0xffffff,
						fontWeight: 'bold',
					}}
				/>

				<!-- W Symbol in Win State -->
				<Container x={400} y={300}>
					{#key animationKey}
						<Symbol
							x={0}
							y={0}
							rawSymbol={{ name: 'W' }}
							state="win"
							loop={false}
							oncomplete={handleAnimationComplete}
						/>
					{/key}
				</Container>

				<!-- Animation Info -->
				<Container x={50} y={150}>
					<Text
						x={0}
						y={0}
						text="Win State Animations:"
						style={{
							fontFamily: 'Arial',
							fontSize: 20,
							fill: 0x00ff88,
							fontWeight: 'bold',
						}}
					/>
					
					<Text
						x={0}
						y={40}
						text="🔮 Magic Ring Spin (zIndex: 15)"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0xffaa00,
						}}
					/>
					<Text
						x={20}
						y={65}
						text="• Cycles through 4 different ring textures"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xcccccc,
						}}
					/>
					<Text
						x={20}
						y={85}
						text="• Scales from 1.0x → 1.5x → 1.0x over 2 seconds"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xcccccc,
						}}
					/>
					<Text
						x={20}
						y={105}
						text="• Appears on top of main symbol"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xcccccc,
						}}
					/>

					<Text
						x={0}
						y={140}
						text="⚡ Electric Cloud Spin (zIndex: 3)"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0x88aaff,
						}}
					/>
					<Text
						x={20}
						y={165}
						text="• Pink electric cloud animation"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xcccccc,
						}}
					/>
					<Text
						x={20}
						y={185}
						text="• Behind main symbol"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xcccccc,
						}}
					/>

					<Text
						x={0}
						y={220}
						text="💎 Background Crystal (zIndex: 1)"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0xaaaaaa,
						}}
					/>
				</Container>

				<!-- Z-Index Hierarchy -->
				<Container x={450} y={150}>
					<Text
						x={0}
						y={0}
						text="Z-Index Hierarchy:"
						style={{
							fontFamily: 'Arial',
							fontSize: 20,
							fill: 0xff8800,
							fontWeight: 'bold',
						}}
					/>

					<Text
						x={0}
						y={40}
						text="15. Magic Ring (TOP)"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0xffaa00,
						}}
					/>
					
					<Text
						x={0}
						y={65}
						text="10. Main W Symbol"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0xffffff,
						}}
					/>
					
					<Text
						x={0}
						y={90}
						text="3. Electric Cloud"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0x88aaff,
						}}
					/>
					
					<Text
						x={0}
						y={115}
						text="1. Background Crystal"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0xaaaaaa,
						}}
					/>
				</Container>

				<!-- Play Button -->
				<Container x={400} y={450}>
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

				<!-- Instructions -->
				<Container x={50} y={500}>
					<Text
						x={0}
						y={0}
						text="✨ Click the play button to watch the magic ring animation!"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0x00ff88,
							fontStyle: 'italic',
						}}
					/>
					<Text
						x={0}
						y={25}
						text="🎯 Animation plays once then stops - click again to replay"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xcccccc,
							fontStyle: 'italic',
						}}
					/>
				</Container>
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>