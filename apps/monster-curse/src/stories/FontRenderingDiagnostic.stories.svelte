<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'DIAGNOSTIC/<FontRendering>',
		parameters: {
			layout: 'fullscreen',
		},
	});
</script>

<script lang="ts">
	import { Container, Text, Graphics, Rectangle } from 'pixi-svelte';
	import { ResponsiveText } from 'components-pixi';
	import { StoryPixiApp } from 'components-storybook';
	import { FillGradient, type TextStyleOptions } from 'pixi.js';
	import assets from '../game/assets';
	import { setContext } from '../game/context';
	import { getContext } from '../game/context';

	setContext();
	const context = getContext();

	// Replicate multiplierFontStyle from Win.svelte
	const multiplierFontStyle = (fontSizeOverride?: number): TextStyleOptions => {
		let layoutType = 'landscape';
		let isDesktop = false;
		try {
			layoutType = context.stateLayoutDerived.layoutType();
			isDesktop = layoutType === 'desktop';
		} catch (e) {
			// Fallback if context not fully initialized
			isDesktop = false;
		}
		const baseFontSize = 60;
		const fontSize = fontSizeOverride || (isDesktop ? baseFontSize * 1.85 : baseFontSize * 1.4);
		const strokeThickness = 5;
		const shadowDistance = Math.hypot(3, 6);

		const strokeGradient = new FillGradient({
			type: 'linear',
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			colorStops: [
				{ offset: 0, color: '#FF70EA' },
				{ offset: 1, color: '#7B15FF' },
			],
			textureSpace: 'local',
		});

		// Calculate padding needed for stroke and shadow
		// Stroke extends strokeThickness/2 on all sides
		// Shadow extends shadowDistance in the shadow direction, but we need extra top padding for tall characters
		// Add extra padding at top for font ascenders that extend beyond bounds
		const paddingTop = strokeThickness + 10; // Extra space for tall characters (3, 5, 6, 8, 9, D, K, L, X, Y)
		const paddingBottom = strokeThickness + Math.ceil(shadowDistance); // Space for shadow extending downward
		const paddingLeft = strokeThickness;
		const paddingRight = strokeThickness + Math.ceil(shadowDistance * Math.cos(Math.atan2(6, 3))); // Space for shadow extending right

		return {
			fontFamily: 'Crom, Arial, sans-serif',
			fontSize,
			align: 'center' as const,
			fontWeight: 'normal' as TextStyleOptions['fontWeight'],
			fill: '#61E5FF',
			stroke: strokeGradient,
			strokeThickness,
			lineJoin: 'round',
			dropShadow: true,
			dropShadowColor: '#BF00B5',
			dropShadowBlur: 0,
			dropShadowAngle: Math.atan2(6, 3),
			dropShadowDistance: shadowDistance,
		} as TextStyleOptions;
	};

	// Font style without stroke/shadow
	const multiplierFontStyleNoEffects = (fontSizeOverride?: number): TextStyleOptions => {
		let layoutType = 'landscape';
		let isDesktop = false;
		try {
			layoutType = context.stateLayoutDerived.layoutType();
			isDesktop = layoutType === 'desktop';
		} catch (e) {
			// Fallback if context not fully initialized
			isDesktop = false;
		}
		const baseFontSize = 60;
		const fontSize = fontSizeOverride || (isDesktop ? baseFontSize * 1.85 : baseFontSize * 1.4);

		return {
			fontFamily: 'Crom, Arial, sans-serif',
			fontSize,
			align: 'center' as const,
			fontWeight: 'normal' as TextStyleOptions['fontWeight'],
			fill: '#61E5FF',
		} as TextStyleOptions;
	};

	// Character sets
	const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
	const NUMBERS = '0123456789';
	const CURRENCY = '$€£¥•';

	// Test strings
	const ALL_CHARS = UPPERCASE + LOWERCASE + NUMBERS + CURRENCY;
	const TEST_AMOUNT = '$1,234.56';
	const TEST_LARGE_AMOUNT = '$999,999,999.99';

	// Helper to create background rectangle for text bounds visualization
	function createTextBoundsRect(width: number, height: number, color: number = 0x00ff00, alpha: number = 0.2) {
		return (g: any) => {
			g.clear();
			g.beginFill(color, alpha);
			g.drawRect(-width / 2, -height / 2, width, height);
			g.endFill();
			g.lineStyle(1, color, 0.5);
			g.drawRect(-width / 2, -height / 2, width, height);
		};
	}

	// Helper to create grid lines
	function createGridLines(width: number, height: number, spacing: number = 50) {
		return (g: any) => {
			g.clear();
			g.lineStyle(1, 0x666666, 0.3);
			// Vertical lines
			for (let x = 0; x <= width; x += spacing) {
				g.moveTo(x, 0);
				g.lineTo(x, height);
			}
			// Horizontal lines
			for (let y = 0; y <= height; y += spacing) {
				g.moveTo(0, y);
				g.lineTo(width, y);
			}
		};
	}
</script>

<Story name="Font Rendering Diagnostic">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container>
				<!-- Background Grid -->
				<Graphics draw={createGridLines(1920, 1080, 50)} />

				<!-- Title -->
				<Text
					x={960}
					y={20}
					anchor={{ x: 0.5, y: 0 }}
					text="Font Rendering Diagnostic - All Characters & Configurations"
					style={{
						fontFamily: 'Arial',
						fontSize: 32,
						fill: 0xffffff,
						fontWeight: 'bold',
					}}
				/>

				<!-- Configuration 1: Exact match to Win.svelte (anchor 0.5, Container, full styling) -->
				<Container x={200} y={80}>
					<Text
						x={0}
						y={0}
						text="Config 1: Win.svelte Match (anchor 0.5, Container, full style)"
						style={{
							fontFamily: 'Arial',
							fontSize: 18,
							fill: 0x00ff88,
							fontWeight: 'bold',
						}}
					/>

					<!-- Test Amount -->
					<!-- Add extra top padding by shifting text down to account for stroke and tall character ascenders -->
					<Container x={0} y={40} cullable={false}>
						<Container y={15}>
							<ResponsiveText
								anchor={0.5}
								maxWidth={2130}
								text={TEST_AMOUNT}
								style={multiplierFontStyle()}
							/>
						</Container>
					</Container>

					<!-- All Characters Grid -->
					<Container x={0} y={120}>
						{#each Array.from(ALL_CHARS) as char, index}
							{@const col = index % 13}
							{@const row = Math.floor(index / 13)}
							<Container x={col * 60} y={row * 80} cullable={false}>
								<Container y={8}>
									<ResponsiveText
										anchor={0.5}
										maxWidth={50}
										text={char}
										style={multiplierFontStyle(40)}
									/>
								</Container>
							</Container>
						{/each}
					</Container>
				</Container>

				<!-- Configuration 2: Anchor 0 (top-left) -->
				<Container x={200} y={600}>
					<Text
						x={0}
						y={0}
						text="Config 2: Anchor 0 (top-left)"
						style={{
							fontFamily: 'Arial',
							fontSize: 18,
							fill: 0x00ff88,
							fontWeight: 'bold',
						}}
					/>

					<!-- Test Amount -->
					<!-- Add extra top padding by shifting text down to account for stroke and tall character ascenders -->
					<Container x={0} y={40} cullable={false}>
						<Container y={15}>
							<ResponsiveText
								anchor={{ x: 0, y: 0 }}
								maxWidth={2130}
								text={TEST_AMOUNT}
								style={multiplierFontStyle()}
							/>
						</Container>
					</Container>

					<!-- All Characters Grid -->
					<Container x={0} y={120}>
						{#each Array.from(ALL_CHARS) as char, index}
							{@const col = index % 13}
							{@const row = Math.floor(index / 13)}
							<Container x={col * 60} y={row * 80} cullable={false}>
								<Container y={8}>
									<ResponsiveText
										anchor={{ x: 0, y: 0 }}
										maxWidth={50}
										text={char}
										style={multiplierFontStyle(40)}
									/>
								</Container>
							</Container>
						{/each}
					</Container>
				</Container>

				<!-- Configuration 3: Without stroke/shadow -->
				<Container x={1000} y={80}>
					<Text
						x={0}
						y={0}
						text="Config 3: No stroke/shadow effects"
						style={{
							fontFamily: 'Arial',
							fontSize: 18,
							fill: 0x00ff88,
							fontWeight: 'bold',
						}}
					/>

					<!-- Test Amount -->
					<Container x={0} y={40} cullable={false}>
						<ResponsiveText
							anchor={0.5}
							maxWidth={2130}
							text={TEST_AMOUNT}
							style={multiplierFontStyleNoEffects()}
						/>
					</Container>

					<!-- All Characters Grid -->
					<Container x={0} y={120}>
						{#each Array.from(ALL_CHARS) as char, index}
							{@const col = index % 13}
							{@const row = Math.floor(index / 13)}
							<Container x={col * 60} y={row * 80} cullable={false}>
								<ResponsiveText
									anchor={0.5}
									maxWidth={50}
									text={char}
									style={multiplierFontStyleNoEffects(40)}
								/>
							</Container>
						{/each}
					</Container>
				</Container>

				<!-- Configuration 4: Minimal Container (single level) -->
				<Container x={1000} y={600}>
					<Text
						x={0}
						y={0}
						text="Config 4: Minimal Container (single level)"
						style={{
							fontFamily: 'Arial',
							fontSize: 18,
							fill: 0x00ff88,
							fontWeight: 'bold',
						}}
					/>

					<!-- Test Amount - Single Container level -->
					<!-- Add extra top padding by shifting text down to account for stroke and tall character ascenders -->
					<Container x={0} y={40} cullable={false}>
						<Container y={15}>
							<ResponsiveText
								anchor={0.5}
								maxWidth={2130}
								text={TEST_AMOUNT}
								style={multiplierFontStyle()}
							/>
						</Container>
					</Container>

					<!-- All Characters Grid - Single Container per character -->
					{#each Array.from(ALL_CHARS) as char, index}
						{@const col = index % 13}
						{@const row = Math.floor(index / 13)}
						<Container x={1000 + col * 60} y={600 + 120 + row * 80} cullable={false}>
							<Container y={8}>
								<ResponsiveText
									anchor={0.5}
									maxWidth={50}
									text={char}
									style={multiplierFontStyle(40)}
								/>
							</Container>
						</Container>
					{/each}
				</Container>

				<!-- Configuration 5: Different font sizes -->
				<Container x={600} y={1000}>
					<Text
						x={0}
						y={0}
						anchor={{ x: 0.5, y: 0 }}
						text="Config 5: Different Font Sizes"
						style={{
							fontFamily: 'Arial',
							fontSize: 18,
							fill: 0x00ff88,
							fontWeight: 'bold',
						}}
					/>

					<!-- Small size -->
					<Container x={-200} y={50} cullable={false}>
						<Text
							x={0}
							y={0}
							anchor={0.5}
							text="Small (40px)"
							style={{
								fontFamily: 'Arial',
								fontSize: 14,
								fill: 0xcccccc,
							}}
						/>
						<Container y={8}>
							<ResponsiveText
								anchor={0.5}
								maxWidth={2130}
								text={TEST_AMOUNT}
								style={multiplierFontStyle(40)}
							/>
						</Container>
					</Container>

					<!-- Medium size -->
					<Container x={0} y={50} cullable={false}>
						<Text
							x={0}
							y={0}
							anchor={0.5}
							text="Medium (80px)"
							style={{
								fontFamily: 'Arial',
								fontSize: 14,
								fill: 0xcccccc,
							}}
						/>
						<Container y={12}>
							<ResponsiveText
								anchor={0.5}
								maxWidth={2130}
								text={TEST_AMOUNT}
								style={multiplierFontStyle(80)}
							/>
						</Container>
					</Container>

					<!-- Large size -->
					<Container x={200} y={50} cullable={false}>
						<Text
							x={0}
							y={0}
							anchor={0.5}
							text="Large (120px)"
							style={{
								fontFamily: 'Arial',
								fontSize: 14,
								fill: 0xcccccc,
							}}
						/>
						<Container y={15}>
							<ResponsiveText
								anchor={0.5}
								maxWidth={2130}
								text={TEST_AMOUNT}
								style={multiplierFontStyle(120)}
							/>
						</Container>
					</Container>

					<!-- Extra Large size -->
					<Container x={400} y={50} cullable={false}>
						<Text
							x={0}
							y={0}
							anchor={0.5}
							text="Extra Large (160px)"
							style={{
								fontFamily: 'Arial',
								fontSize: 14,
								fill: 0xcccccc,
							}}
						/>
						<Container y={18}>
							<ResponsiveText
								anchor={0.5}
								maxWidth={2130}
								text={TEST_AMOUNT}
								style={multiplierFontStyle(160)}
							/>
						</Container>
					</Container>
				</Container>

				<!-- Additional Test: Large Amount String -->
				<Container x={960} y={1200}>
					<Text
						x={0}
						y={0}
						anchor={0.5}
						text="Large Amount Test (full Win.svelte style)"
						style={{
							fontFamily: 'Arial',
							fontSize: 18,
							fill: 0xffaa00,
							fontWeight: 'bold',
						}}
					/>
					<!-- Add extra top padding by shifting text down to account for stroke and tall character ascenders -->
					<Container x={0} y={40} cullable={false}>
						<Container y={15}>
							<ResponsiveText
								anchor={0.5}
								maxWidth={2130}
								text={TEST_LARGE_AMOUNT}
								style={multiplierFontStyle()}
							/>
						</Container>
					</Container>
				</Container>

				<!-- Instructions -->
				<Container x={50} y={1050}>
					<Text
						x={0}
						y={0}
						text="Instructions:"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: 0xffffff,
							fontWeight: 'bold',
						}}
					/>
					<Text
						x={0}
						y={25}
						text="• Config 1: Exact match to Win.svelte implementation"
						style={{
							fontFamily: 'Arial',
							fontSize: 12,
							fill: 0xcccccc,
						}}
					/>
					<Text
						x={0}
						y={45}
						text="• Config 2: Tests if anchor point causes clipping"
						style={{
							fontFamily: 'Arial',
							fontSize: 12,
							fill: 0xcccccc,
						}}
					/>
					<Text
						x={0}
						y={65}
						text="• Config 3: Tests if stroke/shadow effects cause clipping"
						style={{
							fontFamily: 'Arial',
							fontSize: 12,
							fill: 0xcccccc,
						}}
					/>
					<Text
						x={0}
						y={85}
						text="• Config 4: Tests if Container wrapper causes clipping"
						style={{
							fontFamily: 'Arial',
							fontSize: 12,
							fill: 0xcccccc,
						}}
					/>
					<Text
						x={0}
						y={105}
						text="• Config 5: Tests different font sizes for clipping issues"
						style={{
							fontFamily: 'Arial',
							fontSize: 12,
							fill: 0xcccccc,
						}}
					/>
					<Text
						x={0}
						y={130}
						text="Look for characters cut at the top, especially: A, B, D, E, F, H, I, K, L, M, N, P, R, T, 0-9"
						style={{
							fontFamily: 'Arial',
							fontSize: 12,
							fill: 0xffaa00,
							fontWeight: 'bold',
						}}
					/>
				</Container>
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>

