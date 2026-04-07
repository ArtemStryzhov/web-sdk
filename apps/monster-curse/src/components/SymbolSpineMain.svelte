<script lang="ts">
	import { SpineProvider, SpineTrack, Graphics, Container, type SpineTrackProps } from 'pixi-svelte';
	import * as PIXI from 'pixi.js';
	import { stateBetDerived } from 'state-shared';
	import { untrack } from 'svelte';

	import { getSymbolInfo } from '../game/utils';
	import { sound } from '../game/sound';
	import type { RawSymbol } from '../game/types';
	import { SYMBOL_SIZE } from '../game/constants';

	const S_EXPAND_ANIMATION_END_MAP: Record<string, number> = {
		sword_expanding_pos0: 0,
		sword_expanding_pos1: 0.6,
		sword_expanding_pos2: 0.8,
		sword_expanding_pos3: 0.8,
		sword_expanding_pos4: 0.85,
	};

	type Props = {
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		rawSymbol: RawSymbol;
		x?: number;
		y?: number;
		listener: SpineTrackProps['listener'];
		loop?: boolean;
	};

	let spineProvider = $state<SpineProvider>();
	let revealProgress = $state(0);
	let hasAnimated = $state(false);
	let lastExplicitExpandAnimation = $state<string | undefined>(undefined);
	let crystalScale = $state(1.0);

	const props: Props = $props();
	const hasExplicitExpand = $derived(!!props.rawSymbol.expandAnimation);
	const shouldFreezeExpandPose = $derived(
		props.symbolInfo?.assetKey === 'S' &&
		props.symbolInfo.animationName?.startsWith('sword_expanding') &&
		!hasExplicitExpand,
	);
	const frozenExpandAnimationEnd = $derived(
		props.symbolInfo?.animationName
			? S_EXPAND_ANIMATION_END_MAP[props.symbolInfo.animationName] ?? 0
			: 0,
	);

	$effect(() => {
		const explicitExpandAnimation = props.rawSymbol.expandAnimation;

		if (explicitExpandAnimation && explicitExpandAnimation !== lastExplicitExpandAnimation) {
			hasAnimated = false;
			revealProgress = 0;
		}

		lastExplicitExpandAnimation = explicitExpandAnimation;
	});

	// Mask drawing function for S symbol
	function drawMask(graphics: PIXI.Graphics) {
		const spineHeight = 770;
		const initialVisibleHeight = 200;
		
		if (props.symbolInfo?.assetKey === 'S' && props.symbolInfo.animationName?.startsWith('sword_expanding')) {
			const reelPosition = props.rawSymbol.reelPosition ?? 4; // Default to bottom position
			
			// Base expansion fractions with adjustments
			const expansionFractions = [0.1423, 0.3560, 0.5662, 0.777, 0.988];
			const expansionFraction = expansionFractions[reelPosition];
			
			// Calculate target height: base + (expansion space * fraction)
			const expansionSpace = spineHeight - initialVisibleHeight; // 570px available for expansion
			const targetHeight = initialVisibleHeight + (expansionSpace * expansionFraction);
			
			// Position 0: Show final height immediately (no animation)
			// Other positions: Animate from initial to target height
			let currentVisibleHeight;
			if (reelPosition === 0) {
				currentVisibleHeight = targetHeight; // Final height immediately
			} else {
				currentVisibleHeight = initialVisibleHeight + (targetHeight - initialVisibleHeight) * revealProgress;
			}
			
			const maskBottom = spineHeight / 2;
			const maskTop = maskBottom - currentVisibleHeight;
			
			graphics.rect(-150, maskTop, 300, currentVisibleHeight);
			graphics.fill(0xffffff);
		}
	}

	// Animate reveal for S symbol
	$effect(() => {
		let animationFrameId: number | null = null;
		
		// Capture dependencies at effect creation - use untrack for values that should not restart
		// a currently running S animation when sticky state mutates rawSymbol.
		const assetKey = props.symbolInfo?.assetKey;
		const animationName = props.symbolInfo?.animationName;
		const animated = untrack(() => hasAnimated);
		const currentRevealProgress = untrack(() => revealProgress);
		const explicitExpand = !!untrack(() => props.rawSymbol.expandAnimation);
		const isSwordExpand = assetKey === 'S' && animationName?.startsWith('sword_expanding');
		const shouldAnimate = isSwordExpand && explicitExpand && !animated;
		const shouldSnapToExpandedPose = isSwordExpand && !explicitExpand && currentRevealProgress < 1;

		if (shouldSnapToExpandedPose) {
			hasAnimated = true;
			revealProgress = 1;
			return;
		}
		
		if (shouldAnimate) {
			hasAnimated = true;
			sound.players?.once.play({ name: 'sfx_wild_explode', forcePlay: true });
			
			const reelPosition = props.rawSymbol.reelPosition ?? 4;
			
			// Position 0: No animation needed, already at final height
			if (reelPosition === 0) {
				revealProgress = 1; // Set to final state immediately
				return;
			}

			// Other positions: Animate the reveal
			const startTime = Date.now();
			const duration = 800;

			const animate = () => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);
				
				// Use untrack to prevent revealProgress updates from re-triggering effect
				untrack(() => {
					revealProgress = progress;
				});

				if (progress < 1) {
					animationFrameId = requestAnimationFrame(animate);
				}
			};

			animationFrameId = requestAnimationFrame(animate);
		}
		
		return () => {
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	});

	// Reset animation flag when leaving win state
	$effect(() => {
		if (!props.symbolInfo?.animationName?.startsWith('sword_expanding')) {
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
					trackTime={shouldFreezeExpandPose ? frozenExpandAnimationEnd : undefined}
					animationLast={shouldFreezeExpandPose ? frozenExpandAnimationEnd : undefined}
					animationEnd={shouldFreezeExpandPose ? frozenExpandAnimationEnd : undefined}
					timeScale={shouldFreezeExpandPose ? 0 : stateBetDerived.timeScale()}
					listener={props.listener}
				/>
				<!-- Always looped flame animation for S symbol -->
				{#if props.symbolInfo.animationName?.startsWith('sword_expanding')}
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
