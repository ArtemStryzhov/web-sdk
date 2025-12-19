<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'COMPONENTS/<WinAnimation>',
		parameters: {
			layout: 'fullscreen',
		},
	});
</script>

<script lang="ts">
	import { Container, Text, Graphics, Sprite } from 'pixi-svelte';
	import { ResponsiveText } from 'components-pixi';
	import { StoryPixiApp } from 'components-storybook';
	import WinAnimation from '../components/WinAnimation.svelte';
	import { winLevelMap, type WinLevel } from '../game/winLevelMap';
	import assets from '../game/assets';
	import { setContext } from '../game/context';
	import { FillGradient, type TextStyleOptions } from 'pixi.js';

	setContext();

	// Match multiplier.css exactly: font-size: 50px, text-shadow: 3px 6px 0px #BF00B5, -webkit-text-stroke: 5px transparent
	const multiplierFontStyle = (): TextStyleOptions => {
		const strokeThickness = 5; // Match -webkit-text-stroke: 5px
		const shadowDistance = Math.hypot(3, 6); // Match text-shadow: 3px 6px (distance = sqrt(3^2 + 6^2) ≈ 6.708)

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

		return {
			fontFamily: 'Crom, Arial, sans-serif', // Match multiplier.css font-family: 'Crom', Arial, sans-serif
			fontSize: 50, // Match multiplier.css font-size: 50px
			align: 'center' as const,
			fontWeight: 'normal' as TextStyleOptions['fontWeight'], // Match font-weight: normal
			fill: '#61E5FF', // Match color: #61E5FF
			stroke: strokeGradient, // Match border-image gradient: linear-gradient(180deg, #FF70EA 0%, #7B15FF 100%)
			strokeThickness, // Match -webkit-text-stroke: 5px
			lineJoin: 'round',
			dropShadow: true,
			dropShadowColor: '#BF00B5', // Match text-shadow: 3px 6px 0px #BF00B5
			dropShadowBlur: 0, // Match text-shadow blur: 0px
			dropShadowAngle: Math.atan2(6, 3), // Match text-shadow: 3px 6px
			dropShadowDistance: shadowDistance,
		} as TextStyleOptions;
	};

	const WIN_LEVELS = [6, 7, 8, 9, 10] as const;
	
	let selectedLevel = $state<WinLevel>(6);
	let animationKey = $state(0);
	let animationState = $state<'intro' | 'idle' | 'outro'>('intro');
	let isPlaying = $state(false);
	const winAmountText = '$1,500.00'; // Static example win amount

	const winLevelData = $derived(winLevelMap[selectedLevel]);
	const animationMap = $derived(winLevelData?.animation);

	function playAnimation() {
		if (!isPlaying) {
			isPlaying = true;
			animationState = 'intro';
			animationKey++; // Force re-render to restart animation
		}
	}

	function resetAnimation() {
		isPlaying = false;
		animationState = 'intro';
		animationKey++;
	}

	function handleAnimationStateChange(newState: 'intro' | 'idle' | 'outro') {
		animationState = newState;
		if (newState === 'outro') {
			// After a short delay, stop playing
			setTimeout(() => {
				isPlaying = false;
			}, 2000);
		}
	}

	function triggerOutro() {
		if (isPlaying && animationState === 'idle') {
			animationState = 'outro';
		}
	}

	function selectLevel(level: WinLevel) {
		selectedLevel = level;
		resetAnimation();
	}

	const formatDuration = (seconds: number) => {
		return `${seconds / 1000}s`;
	};

	const getLevelColor = (level: WinLevel): number => {
		switch (level) {
			case 6: return 0x00aaff; // Blue for Big Win
			case 7: return 0xff00ff; // Magenta for Mega Win
			case 8: return 0xff8800; // Orange for Super Mega Win
			case 9: return 0xff0000; // Red for Sensational
			case 10: return 0xffdd00; // Gold for Sensational (Max)
			default: return 0xffffff;
		}
	};
</script>

<Story name="Win Levels Preview">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container>
				<!-- Title -->
				<Text
					x={640}
					y={30}
					anchor={{ x: 0.5, y: 0 }}
					text="Big Win Animations - All Levels"
					style={{
						fontFamily: 'Arial',
						fontSize: 32,
						fill: 0xffffff,
						fontWeight: 'bold',
					}}
				/>

				<!-- Win Level Selector Buttons -->
				<Container x={100} y={80}>
					<Text
						x={0}
						y={0}
						text="Select Win Level:"
						style={{
							fontFamily: 'Arial',
							fontSize: 20,
							fill: 0xffffff,
							fontWeight: 'bold',
						}}
					/>
					
					{#each WIN_LEVELS as level, index}
						{@const isSelected = selectedLevel === level}
						{@const levelData = winLevelMap[level]}
						{@const buttonX = index * 180}
						
						<Container x={buttonX} y={40}>
							<!-- Button Background -->
							<Graphics
								draw={(g) => {
									g.clear();
									g.beginFill(isSelected ? getLevelColor(level) : 0x333333);
									g.drawRoundedRect(0, 0, 170, 60, 8);
									g.endFill();
									g.lineStyle(2, isSelected ? 0xffffff : 0x666666);
									g.drawRoundedRect(0, 0, 170, 60, 8);
								}}
								interactive={!isPlaying}
								cursor={isPlaying ? 'default' : 'pointer'}
								onclick={() => selectLevel(level)}
							/>
							
							<!-- Button Text -->
							<Text
								x={85}
								y={15}
								anchor={{ x: 0.5, y: 0 }}
								text="Level {level}"
								style={{
									fontFamily: 'Arial',
									fontSize: 14,
									fill: isSelected ? 0x000000 : 0xffffff,
									fontWeight: 'bold',
								}}
							/>
							<Text
								x={85}
								y={35}
								anchor={{ x: 0.5, y: 0 }}
								text={levelData?.text || ''}
								style={{
									fontFamily: 'Arial',
									fontSize: 12,
									fill: isSelected ? 0x000000 : 0xcccccc,
								}}
							/>
						</Container>
					{/each}
				</Container>

				<!-- Win Animation Display Area -->
				{#if isPlaying}
					{#if selectedLevel === 6}
						<!-- Level 6: Static sprite -->
						{#key animationKey}
							<Container x={640} y={250}>
								<Sprite
									key="big.png"
									anchor={0.5}
									width={412.5}
									height={126}
								/>
							</Container>
							<Container x={640} y={400}>
								<ResponsiveText
									anchor={0.5}
									maxWidth={2130}
									text={winAmountText}
									style={multiplierFontStyle()}
								/>
							</Container>
						{/key}
					{:else if animationMap}
						<!-- Levels 7-10: Spine animations -->
						{#key animationKey}
							<Container x={640} y={400}>
								<WinAnimation {animationMap}>
									<ResponsiveText
										anchor={0.5}
										maxWidth={2130}
										text={winAmountText}
										style={{
											fontFamily: 'Crom, Arial, sans-serif',
											fontSize: 120,
											align: 'center',
											fontWeight: 'bold',
											fill: 0x61E5FF,
										}}
									/>
								</WinAnimation>
							</Container>
						{/key}
					{/if}
				{/if}

				<!-- Info Panel -->
				<Container x={100} y={200}>
					<Text
						x={0}
						y={0}
						text="Current Win Level Info:"
						style={{
							fontFamily: 'Arial',
							fontSize: 20,
							fill: 0x00ff88,
							fontWeight: 'bold',
						}}
					/>

					<Text
						x={0}
						y={35}
						text="Level: {selectedLevel} - {winLevelData?.text || 'N/A'}"
						style={{
							fontFamily: 'Arial',
							fontSize: 16,
							fill: getLevelColor(selectedLevel),
						}}
					/>

					{#if selectedLevel === 6}
						<Text
							x={0}
							y={60}
							text="Display Type: Static Sprite (big.png)"
							style={{
								fontFamily: 'Arial',
								fontSize: 14,
								fill: 0x00ff88,
							}}
						/>
					{:else}
						<Text
							x={0}
							y={60}
							text="Animation State: {animationState}"
							style={{
								fontFamily: 'Arial',
								fontSize: 14,
								fill: 0xffffff,
							}}
						/>
					{/if}

					<Text
						x={0}
						y={85}
						text="Presentation Duration: {formatDuration(winLevelData?.presentDuration || 0)}"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0xcccccc,
						}}
					/>

					{#if animationMap}
						<Text
							x={0}
							y={120}
							text="Animations:"
							style={{
								fontFamily: 'Arial',
								fontSize: 16,
								fill: 0xffaa00,
								fontWeight: 'bold',
							}}
						/>
						<Text
							x={20}
							y={145}
							text="• Intro: {animationMap.intro}"
							style={{
								fontFamily: 'Arial',
								fontSize: 13,
								fill: 0xcccccc,
							}}
						/>
						<Text
							x={20}
							y={165}
							text="• Idle: {animationMap.idle} (loops)"
							style={{
								fontFamily: 'Arial',
								fontSize: 13,
								fill: 0xcccccc,
							}}
						/>
						<Text
							x={20}
							y={185}
							text="• Outro: {animationMap.outro}"
							style={{
								fontFamily: 'Arial',
								fontSize: 13,
								fill: 0xcccccc,
							}}
						/>
					{/if}

					{#if winLevelData?.sound?.bgm}
						<Text
							x={0}
							y={220}
							text="Background Music: {winLevelData.sound.bgm}"
							style={{
								fontFamily: 'Arial',
								fontSize: 13,
								fill: 0x88aaff,
							}}
						/>
					{/if}
				</Container>

				<!-- Control Buttons -->
				<Container x={640} y={600}>
					<!-- Play Button -->
					<Container x={-120} y={0}>
						<Graphics
							draw={(g) => {
								g.clear();
								g.beginFill(isPlaying ? 0x666666 : 0x00aa00);
								g.drawRoundedRect(-60, -20, 120, 40, 8);
								g.endFill();
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
							text={isPlaying ? 'Playing...' : '▶️ Play'}
							style={{
								fontFamily: 'Arial',
								fontSize: 16,
								fill: 0xffffff,
								fontWeight: 'bold',
							}}
						/>
					</Container>

					<!-- Stop Idle / Trigger Outro Button -->
					{#if isPlaying && animationState === 'idle'}
						<Container x={20} y={0}>
							<Graphics
								draw={(g) => {
									g.clear();
									g.beginFill(0xff6600);
									g.drawRoundedRect(-60, -20, 120, 40, 8);
									g.endFill();
									g.lineStyle(2, 0xff8800);
									g.drawRoundedRect(-60, -20, 120, 40, 8);
								}}
								interactive={true}
								cursor="pointer"
								onclick={triggerOutro}
							/>
							<Text
								x={0}
								y={0}
								anchor={0.5}
								text="⏹️ Stop Idle"
								style={{
									fontFamily: 'Arial',
									fontSize: 16,
									fill: 0xffffff,
									fontWeight: 'bold',
								}}
							/>
						</Container>
					{/if}

					<!-- Reset Button -->
					<Container x={160} y={0}>
						<Graphics
							draw={(g) => {
								g.clear();
								g.beginFill(0xaa0000);
								g.drawRoundedRect(-60, -20, 120, 40, 8);
								g.endFill();
								g.lineStyle(2, 0xff0000);
								g.drawRoundedRect(-60, -20, 120, 40, 8);
							}}
							interactive={true}
							cursor="pointer"
							onclick={resetAnimation}
						/>
						<Text
							x={0}
							y={0}
							anchor={0.5}
							text="🔄 Reset"
							style={{
								fontFamily: 'Arial',
								fontSize: 16,
								fill: 0xffffff,
								fontWeight: 'bold',
							}}
						/>
					</Container>
				</Container>

				<!-- Instructions -->
				<Container x={100} y={680}>
					<Text
						x={0}
						y={0}
						text="✨ Select a win level above, then click Play to see the animation sequence"
						style={{
							fontFamily: 'Arial',
							fontSize: 14,
							fill: 0x00ff88,
							fontStyle: 'italic',
						}}
					/>
					<Text
						x={0}
						y={25}
						text="🎬 Animation Flow: Intro (plays once) → Idle (loops) → Outro (click 'Stop Idle' or wait)"
						style={{
							fontFamily: 'Arial',
							fontSize: 13,
							fill: 0xcccccc,
							fontStyle: 'italic',
						}}
					/>
					<Text
						x={0}
						y={50}
						text="🔄 Click Reset to restart from the beginning"
						style={{
							fontFamily: 'Arial',
							fontSize: 13,
							fill: 0xcccccc,
							fontStyle: 'italic',
						}}
					/>
				</Container>
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>

