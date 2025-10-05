<script lang="ts">
	import { SpineProvider, SpineTrack, Graphics, Container, type SpineTrackProps } from 'pixi-svelte';
	import * as PIXI from 'pixi.js';
	import { stateBetDerived } from 'state-shared';

	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';

	type Props = {
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		x?: number;
		y?: number;
		listener: SpineTrackProps['listener'];
		loop?: boolean;
	};

	let spineProvider = $state<SpineProvider>();
	let revealProgress = $state(0);
	let hasAnimated = $state(false);
	let crystalScale = $state(1.0);

	const props: Props = $props();

	// Mask drawing function for S symbol
	function drawMask(graphics: PIXI.Graphics) {
		const spineHeight = 770;
		const initialVisibleHeight = 200;
		
		if (props.symbolInfo?.assetKey === 'S' && props.symbolInfo.animationName === 'sword_expanding') {
			const currentVisibleHeight = initialVisibleHeight + (spineHeight - initialVisibleHeight) * revealProgress;
			const maskBottom = spineHeight / 2;
			const maskTop = maskBottom - currentVisibleHeight;
			
			graphics.rect(-150, maskTop, 300, currentVisibleHeight);
			graphics.fill(0xffffff);
		}
	}

	// Animate reveal for S symbol
	$effect(() => {
		if (props.symbolInfo?.assetKey === 'S' && props.symbolInfo.animationName === 'sword_expanding' && !hasAnimated) {
			hasAnimated = true;

			const startTime = Date.now();
			const duration = 800;

			const animate = () => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);
				revealProgress = progress;

				if (progress < 1) {
					requestAnimationFrame(animate);
				}
			};

			requestAnimationFrame(animate);
		}
	});

	// Reset animation flag when leaving win state
	$effect(() => {
		if (props.symbolInfo?.animationName !== 'sword_expanding') {
			hasAnimated = false;
			revealProgress = 0;
			crystalScale = 1.0;
		}
	});
</script>

	{#if props.symbolInfo}
	{@const isS = props.symbolInfo.assetKey === 'S'}

	{#if isS}
		{@const swordOffsetX = 10}
		{@const swordOffsetY = -180}

		<!-- Container with mask for S symbol -->
		<Container x={props.x} y={props.y}>
			<!-- Mask that crops and grows - always present in expanding state -->
			<Graphics draw={drawMask} isMask={true} x={swordOffsetX} y={swordOffsetY} />
			
			<SpineProvider
				key={props.symbolInfo.assetKey}
				anchor={0.5}
				x={swordOffsetX}
				y={swordOffsetY}
				width={props.symbolInfo.sizeRatios?.width ? props.symbolInfo.sizeRatios.width : SYMBOL_SIZE}
				height={props.symbolInfo.sizeRatios?.height ? props.symbolInfo.sizeRatios.height : SYMBOL_SIZE}
				bind:this={spineProvider}
			>
				<SpineTrack
					loop={props.loop}
					trackIndex={0}
					animationName={props.symbolInfo.animationName}
					timeScale={stateBetDerived.timeScale()}
					listener={props.listener}
				/>
				<!-- Always looped flame animation for S symbol -->
				{#if props.symbolInfo.animationName === 'sword_expanding'}
					<SpineTrack
						loop={true}
						trackIndex={1}
						animationName="flame_loop"
						timeScale={stateBetDerived.timeScale()}
					/>
				{/if}
			</SpineProvider>
		</Container>
	{:else}
		<SpineProvider
			x={props.x}
			y={props.y}
			key={props.symbolInfo.assetKey}
			anchor={0.5}
			width={props.symbolInfo.sizeRatios?.width ? props.symbolInfo.sizeRatios.width : SYMBOL_SIZE}
			height={props.symbolInfo.sizeRatios?.height ? props.symbolInfo.sizeRatios.height : SYMBOL_SIZE}
		>
			<SpineTrack
				loop={props.loop}
				trackIndex={0}
				animationName={props.symbolInfo.animationName}
				timeScale={stateBetDerived.timeScale()}
				listener={props.listener}
			/>
		</SpineProvider>
	{/if}
{/if}
