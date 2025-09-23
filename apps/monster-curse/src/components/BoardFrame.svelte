<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { Sprite, SpineProvider, SpineTrack, Graphics, Container } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const SPINE_SCALE = { width: 0.62, height: 0.66 };
	const SPRITE_SCALE = { width: 1.18, height: 1.18};
	const POSITION_ADJUSTMENT = 1.01;

	type AnimationName = 'reelhouse_glow_start' | 'reelhouse_glow_idle' | 'reelhouse_glow_exit';

	let animationName = $state<AnimationName | undefined>(undefined);
	let loop = $state(false);

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => {
			animationName = 'reelhouse_glow_start';
			loop = false;
		},
		boardFrameGlowHide: () => {
			if (animationName) animationName = 'reelhouse_glow_exit';
		},
	});
</script>

{#if animationName}
	<SpineProvider
		zIndex={-1}
		key="reelhouse"
		x={context.stateGameDerived.boardLayout().x * POSITION_ADJUSTMENT}
		y={context.stateGameDerived.boardLayout().y * POSITION_ADJUSTMENT}
		width={context.stateGameDerived.boardLayout().width * SPINE_SCALE.width}
		height={context.stateGameDerived.boardLayout().height * SPINE_SCALE.height}
	>
		<SpineTrack
			trackIndex={0}
			{animationName}
			{loop}
			listener={{
				complete: (entry) => {
					if (entry.animation) {
						if (entry.animation.name === 'reelhouse_glow_start') {
							animationName = 'reelhouse_glow_idle';
							loop = true;
						}

						if (entry.animation.name === 'reelhouse_glow_exit') {
							animationName = undefined;
							loop = false;
						}
					}
				},
			}}
		/>
	</SpineProvider>
{/if}

<!-- Frame with Pixi.js background -->
{#if true}
	{@const boardLayout = context.stateGameDerived.boardLayout()}
	{@const frameWidth = boardLayout.width * SPRITE_SCALE.width}
	{@const frameHeight = boardLayout.width * SPRITE_SCALE.height}
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
		key="frame_edge.png"
		anchor={0.5}
		x={centerX}
		y={centerY}
		width={frameWidth}
		height={frameHeight}
		zIndex={1}
	/>
{/if}
