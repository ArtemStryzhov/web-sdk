<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Symbols/S - Scatter Symbol',
		parameters: {
			layout: 'fullscreen',
		},
	});
</script>

<script lang="ts">
	import { Container, Text, Graphics } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';

	import Symbol from '../components/Symbol.svelte';
	import { SYMBOL_STATES } from '../game/types';
	import assets from '../game/assets';

	const SYMBOL_SIZE = 200;
	const GRID_SIZE = 300;
	const MARGIN = 50;

	// Animation states to showcase
	const ANIMATION_STATES = ['static', 'spin', 'land', 'win', 'postWinStatic', 'expand'] as const;
</script>

<Story name="S Symbol Showcase">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container>
				<!-- Title -->
				<Text
					x={400}
					y={20}
					anchor={{ x: 0.5, y: 0 }}
					text="S Symbol - Scatter Symbol"
					style={{
						fontFamily: 'Arial',
						fontSize: 28,
						fill: 0xffffff,
						fontWeight: 'bold',
					}}
				/>

				<!-- Description -->
				<Text
					x={400}
					y={60}
					anchor={{ x: 0.5, y: 0 }}
					text="This symbol has NO background layers - only the foreground symbol"
					style={{
						fontFamily: 'Arial',
						fontSize: 16,
						fill: 0xff6666,
					}}
				/>

				<!-- Static vs Animated Comparison -->
				<Container y={120}>
					<!-- Static Version -->
					<Container x={200}>
						<Text
							x={0}
							y={-80}
							anchor={{ x: 0.5, y: 0 }}
							text="Static Version"
							style={{
								fontFamily: 'Arial',
								fontSize: 18,
								fill: 0xffff00,
								fontWeight: 'bold',
							}}
						/>
						<Graphics
							draw={(g) => {
								g.clear();
								g.rect(-120, -120, 240, 240);
								g.fill({ color: 0x333333, alpha: 0.8 });
								g.stroke({ color: 0x666666, width: 2 });
							}}
						/>
						<Symbol
							x={0}
							y={0}
							rawSymbol={{ name: 'S', scatter: true }}
							state="static"
						/>
					</Container>

					<!-- Animated Version -->
					<Container x={600}>
						<Text
							x={0}
							y={-80}
							anchor={{ x: 0.5, y: 0 }}
							text="Animated Version (Win State)"
							style={{
								fontFamily: 'Arial',
								fontSize: 18,
								fill: 0x00ff00,
								fontWeight: 'bold',
							}}
						/>
						<Graphics
							draw={(g) => {
								g.clear();
								g.rect(-120, -120, 240, 240);
								g.fill({ color: 0x333333, alpha: 0.8 });
								g.stroke({ color: 0x666666, width: 2 });
							}}
						/>
						<Symbol
							x={0}
							y={0}
							rawSymbol={{ name: 'S', scatter: true }}
							state="win"
							loop={true}
						/>
					</Container>
				</Container>

				<!-- Animation States Grid -->
				<Container y={400}>
					<Text
						x={400}
						y={0}
						anchor={{ x: 0.5, y: 0 }}
						text="All Animation States"
						style={{
							fontFamily: 'Arial',
							fontSize: 20,
							fill: 0xffffff,
							fontWeight: 'bold',
						}}
					/>

					{#each ANIMATION_STATES as state, index}
						{@const x = index * 150 + 50}
						{@const y = 50}

						<Container {x} {y}>
							<!-- State label -->
							<Text
								x={0}
								y={-80}
								anchor={{ x: 0.5, y: 0 }}
								text={state}
								style={{
									fontFamily: 'Arial',
									fontSize: 14,
									fill: 0xffffff,
									fontWeight: 'bold',
								}}
							/>

							<!-- Background rectangle -->
							<Graphics
								draw={(g) => {
									g.clear();
									g.rect(-60, -60, 120, 120);
									g.fill({ color: 0x222222, alpha: 0.9 });
									g.stroke({ color: 0x555555, width: 1 });
								}}
							/>

							<!-- Symbol in this state -->
							<Symbol
								x={0}
								y={0}
								rawSymbol={{ name: 'S', scatter: true }}
								{state}
								loop={state === 'win' || state === 'spin'}
							/>
						</Container>
					{/each}
				</Container>

				<!-- Comparison with Regular Symbol -->
				<Container y={700}>
					<Text
						x={400}
						y={0}
						anchor={{ x: 0.5, y: 0 }}
						text="Comparison: Scatter vs Regular Symbol"
						style={{
							fontFamily: 'Arial',
							fontSize: 20,
							fill: 0xffffff,
							fontWeight: 'bold',
						}}
					/>

					<!-- Scatter Symbol -->
					<Container x={200} y={50}>
						<Text
							x={0}
							y={-80}
							anchor={{ x: 0.5, y: 0 }}
							text="S - Scatter (No Background)"
							style={{
								fontFamily: 'Arial',
								fontSize: 14,
								fill: 0xff6666,
								fontWeight: 'bold',
							}}
						/>
						<Graphics
							draw={(g) => {
								g.clear();
								g.rect(-60, -60, 120, 120);
								g.fill({ color: 0x333333, alpha: 0.8 });
								g.stroke({ color: 0x666666, width: 2 });
							}}
						/>
						<Symbol
							x={0}
							y={0}
							rawSymbol={{ name: 'S', scatter: true }}
							state="static"
						/>
					</Container>

					<!-- Regular Symbol -->
					<Container x={600} y={50}>
						<Text
							x={0}
							y={-80}
							anchor={{ x: 0.5, y: 0 }}
							text="H2 - Regular (With Background)"
							style={{
								fontFamily: 'Arial',
								fontSize: 14,
								fill: 0x00ff00,
								fontWeight: 'bold',
							}}
						/>
						<Graphics
							draw={(g) => {
								g.clear();
								g.rect(-60, -60, 120, 120);
								g.fill({ color: 0x333333, alpha: 0.8 });
								g.stroke({ color: 0x666666, width: 2 });
							}}
						/>
						<Symbol
							x={0}
							y={0}
							rawSymbol={{ name: 'H2' }}
							state="static"
						/>
					</Container>
				</Container>
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>

<Story name="S Symbol Multiplier Collection">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container>
				<!-- Title -->
				<Text
					x={600}
					y={30}
					anchor={{ x: 0.5, y: 0 }}
					text="S Symbol Multiplier Collection Feature"
					style={{
						fontFamily: 'Arial',
						fontSize: 32,
						fill: 0xffffff,
						fontWeight: 'bold',
					}}
				/>

				<!-- Description -->
				<Text
					x={600}
					y={80}
					anchor={{ x: 0.5, y: 0 }}
					text="During expansion, S symbols collect all W multipliers in the same reel and multiply by their own value"
					style={{
						fontFamily: 'Arial',
						fontSize: 18,
						fill: 0x61E5FF,
					}}
				/>

				<!-- Formula -->
				<Text
					x={600}
					y={120}
					anchor={{ x: 0.5, y: 0 }}
					text="Formula: (Sum of W multipliers in reel) × S multiplier = Final multiplier"
					style={{
						fontFamily: 'Arial',
						fontSize: 16,
						fill: 0x00ff00,
						fontWeight: 'bold',
					}}
				/>

				<!-- Example 1: S symbol with collected multiplier -->
				<Container x={200} y={200}>
					<Text
						x={0}
						y={-50}
						anchor={{ x: 0.5, y: 0 }}
						text="Example: W×3 + W×5 + S×4 = ×32"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0x00ff00,
							fontWeight: 'bold',
						}}
					/>
					
					<Graphics
						draw={(g) => {
							g.clear();
							g.rect(-100, -100, 200, 200);
							g.fill({ color: 0x1a1a2e, alpha: 0.9 });
							g.stroke({ color: 0x00ff00, width: 2 });
						}}
					/>
					
					<Symbol
						x={0}
						y={0}
						rawSymbol={{ 
							name: 'S', 
							scatter: true, 
							multiplier: 4,
							collectedMultiplier: 32 
						}}
						state="expand"
						loop={true}
					/>
					
					<Text
						x={0}
						y={120}
						anchor={{ x: 0.5, y: 0 }}
						text="S×4 → Collected ×32"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0x00ff00,
						}}
					/>
				</Container>

				<!-- Example 2: S symbol with smaller collected multiplier -->
				<Container x={600} y={200}>
					<Text
						x={0}
						y={-50}
						anchor={{ x: 0.5, y: 0 }}
						text="Example: W×2 + S×3 = ×6"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0xffaa00,
							fontWeight: 'bold',
						}}
					/>
					
					<Graphics
						draw={(g) => {
							g.clear();
							g.rect(-100, -100, 200, 200);
							g.fill({ color: 0x1a1a2e, alpha: 0.9 });
							g.stroke({ color: 0xffaa00, width: 2 });
						}}
					/>
					
					<Symbol
						x={0}
						y={0}
						rawSymbol={{ 
							name: 'S', 
							scatter: true, 
							multiplier: 3,
							collectedMultiplier: 6 
						}}
						state="expand"
						loop={true}
					/>
					
					<Text
						x={0}
						y={120}
						anchor={{ x: 0.5, y: 0 }}
						text="S×3 → Collected ×6"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xffaa00,
						}}
					/>
				</Container>

				<!-- Example 3: S symbol without W multipliers -->
				<Container x={1000} y={200}>
					<Text
						x={0}
						y={-50}
						anchor={{ x: 0.5, y: 0 }}
						text="No W symbols: S×2 = ×2"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0xff6666,
							fontWeight: 'bold',
						}}
					/>
					
					<Graphics
						draw={(g) => {
							g.clear();
							g.rect(-100, -100, 200, 200);
							g.fill({ color: 0x1a1a2e, alpha: 0.9 });
							g.stroke({ color: 0xff6666, width: 2 });
						}}
					/>
					
					<Symbol
						x={0}
						y={0}
						rawSymbol={{ 
							name: 'S', 
							scatter: true, 
							multiplier: 2
						}}
						state="expand"
						loop={true}
					/>
					
					<Text
						x={0}
						y={120}
						anchor={{ x: 0.5, y: 0 }}
						text="S×2 → Own multiplier ×2"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xff6666,
						}}
					/>
				</Container>

				<!-- State comparison -->
				<Container y={450}>
					<Text
						x={600}
						y={0}
						anchor={{ x: 0.5, y: 0 }}
						text="State Comparison: Win vs Expand"
						style={{
							fontFamily: 'Arial',
							fontSize: 20,
							fill: 0xffffff,
							fontWeight: 'bold',
						}}
					/>

					<!-- Win state -->
					<Container x={400} y={80}>
						<Text
							x={0}
							y={-50}
							anchor={{ x: 0.5, y: 0 }}
							text="Win State (Regular)"
							style={{
								fontFamily: 'Arial',
								fontSize: 16,
								fill: 0x00ff00,
								fontWeight: 'bold',
							}}
						/>
						
						<Graphics
							draw={(g) => {
								g.clear();
								g.rect(-80, -80, 160, 160);
								g.fill({ color: 0x333333, alpha: 0.8 });
								g.stroke({ color: 0x00ff00, width: 2 });
							}}
						/>
						
						<Symbol
							x={0}
							y={0}
							rawSymbol={{ name: 'S', scatter: true, multiplier: 4 }}
							state="win"
							loop={true}
						/>
					</Container>

					<!-- Expand state -->
					<Container x={800} y={80}>
						<Text
							x={0}
							y={-50}
							anchor={{ x: 0.5, y: 0 }}
							text="Expand State (Collection)"
							style={{
								fontFamily: 'Arial',
								fontSize: 16,
								fill: 0x61E5FF,
								fontWeight: 'bold',
							}}
						/>
						
						<Graphics
							draw={(g) => {
								g.clear();
								g.rect(-80, -80, 160, 160);
								g.fill({ color: 0x333333, alpha: 0.8 });
								g.stroke({ color: 0x61E5FF, width: 2 });
							}}
						/>
						
						<Symbol
							x={0}
							y={0}
							rawSymbol={{ 
								name: 'S', 
								scatter: true, 
								multiplier: 4,
								collectedMultiplier: 32 
							}}
							state="expand"
							loop={true}
						/>
					</Container>
				</Container>

				<!-- Technical details -->
				<Container y={650}>
					<Text
						x={600}
						y={0}
						anchor={{ x: 0.5, y: 0 }}
						text="🔧 Technical Implementation"
						style={{
							fontFamily: 'Arial',
							fontSize: 18,
							fill: 0xffffff,
							fontWeight: 'bold',
						}}
					/>
					
					<Text
						x={600}
						y={40}
						anchor={{ x: 0.5, y: 0 }}
						text="• S symbols automatically collect W multipliers during expansion"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xcccccc,
						}}
					/>
					
					<Text
						x={600}
						y={65}
						anchor={{ x: 0.5, y: 0 }}
						text="• Uses 'expand' state instead of 'win' for collection animation"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xcccccc,
						}}
					/>
					
					<Text
						x={600}
						y={90}
						anchor={{ x: 0.5, y: 0 }}
						text="• Displays collected multiplier with same styling as W symbols"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xcccccc,
						}}
					/>
				</Container>
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>