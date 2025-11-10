<script lang="ts">
	import { Sprite, Graphics } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const SPRITE_SCALE = { width: 1.18, height: 1.18};
	const POSITION_ADJUSTMENT = 1.01;

	// Detect bonus game state (buy_blades and buy_contract trigger freegame)
	const isBonusGame = $derived(context.stateGame.gameType === 'freegame');
	
	// Switch frame based on game type
	const frameKey = $derived(isBonusGame ? 'frame_bg.png' : 'frame_edge.png');
</script>

<!-- Frame with Pixi.js background -->
{#if true}
	{@const boardLayout = context.stateGameDerived.boardLayout()}
	{@const frameWidth = boardLayout.width * SPRITE_SCALE.width}
	{@const frameHeight = boardLayout.height * SPRITE_SCALE.height}
	{@const bgWidth = frameWidth * 0.95}
	{@const bgHeight = frameHeight * 0.95}
	{@const centerX = boardLayout.x * POSITION_ADJUSTMENT}
	{@const centerY = boardLayout.y * POSITION_ADJUSTMENT}

	<Graphics
		x={centerX - bgWidth / 2}
		y={centerY - bgHeight / 2}
		zIndex={0}
		draw={(graphics) => {
			graphics.clear();
			graphics.rect(0, 0, bgWidth, bgHeight);
			graphics.fill({ color: 0x000000, alpha: 0.7 });
		}}
	/>

	<Sprite
		key={frameKey}
		anchor={0.5}
		x={centerX}
		y={centerY}
		width={frameWidth}
		height={frameHeight}
		zIndex={1}
	/>
{/if}
