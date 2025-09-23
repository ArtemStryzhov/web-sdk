<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Symbols/H2 - High Value 2',
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
	const ANIMATION_STATES = ['static', 'spin', 'land', 'win', 'postWinStatic'] as const;
</script>

<Story name="H2 Symbol Showcase">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container>
				<!-- Title -->
				<Text
					x={400}
					y={20}
					anchor={{ x: 0.5, y: 0 }}
					text="H2 Symbol - High Value 2"
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
					text="This symbol uses single background layer: bg_stone.png + h2.png"
					style={{
						fontFamily: 'Arial',
						fontSize: 16,
						fill: 0xcccccc,
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
							rawSymbol={{ name: 'H2' }}
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
							rawSymbol={{ name: 'H2' }}
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
								rawSymbol={{ name: 'H2' }}
								{state}
								loop={state === 'win' || state === 'spin'}
							/>
						</Container>
					{/each}
				</Container>
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>