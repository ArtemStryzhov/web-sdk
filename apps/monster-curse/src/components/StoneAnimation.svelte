<script lang="ts">
	import { Container, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { CanvasSizeRectangle } from 'components-layout';

	import { getContext } from '../game/context';
	import { sound } from '../game/sound';

	type Props = {
		speed?: number; // fall speed in px/s
		coverDuration?: number; // ms the screen stays fully covered - the one knob for overall length
		coverAlpha?: number; // opacity of the veil behind the stones at full cover (0 disables it)
		coverColor?: number;
		onCover?: () => void; // fired the moment the screen is fully covered
		onComplete?: () => void;
	};

	const props: Props = $props();

	// 5265 px/s is 10% slower than the 5850 px/s the transition used to run at.
	const FALL_SPEED = props.speed ?? 5265;
	const COVER_DURATION = props.coverDuration ?? 700;
	const COVER_ALPHA = props.coverAlpha ?? 1;
	const COVER_COLOR = props.coverColor ?? 0x000000;

	const STONE_ORIGINAL_WIDTH = 1557;
	const STONE_ORIGINAL_HEIGHT = 934;
	// Below this width a single tile is stretched to the full canvas width, above it the
	// artwork keeps its designed size and is repeated across the screen.
	const TILED_THRESHOLD = 1300;
	// Safety caps so an extreme viewport cannot spawn an unbounded number of spines.
	const MAX_ROWS = 10;
	const MAX_COLS = 6;
	// Golden ratio gives every tile a different, stable horizontal offset so the repeated
	// artwork does not read as a grid.
	const JITTER_STEP = 0.6180339887;

	const context = getContext();
	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());

	const layout = $derived.by(() => {
		const { width, height } = canvasSizes;
		const scale =
			width < TILED_THRESHOLD
				? width / STONE_ORIGINAL_WIDTH
				: width < 1800
					? 0.55
					: width <= 2300
						? 0.6
						: 1;
		const tileWidth = STONE_ORIGINAL_WIDTH * scale;
		const tileHeight = STONE_ORIGINAL_HEIGHT * scale;

		return {
			scale,
			tileWidth,
			tileHeight,
			// One spare column so the per-row horizontal offset still reaches both edges,
			// one spare row so a tile can be recycled to the top before the old one leaves.
			cols: Math.min(MAX_COLS, Math.ceil(width / tileWidth) + 1),
			rows: Math.min(MAX_ROWS, Math.ceil((height + tileHeight) / tileHeight) + 2),
		};
	});

	// The curtain is a continuous band of stones falling at FALL_SPEED. Its leading (bottom)
	// edge starts at the top of the screen; new tiles keep entering from above until the
	// cover phase ends, at which point the trailing (top) edge detaches and falls out too.
	const timeline = $derived.by(() => {
		const fillDuration = (canvasSizes.height / FALL_SPEED) * 1000;
		const drainDuration = ((canvasSizes.height + layout.tileHeight) / FALL_SPEED) * 1000;
		const coverEnd = fillDuration + COVER_DURATION;

		return {
			coverStart: fillDuration,
			coverEnd,
			total: coverEnd + drainDuration,
		};
	});

	let isAnimating = $state(false);
	let elapsed = $state(0);
	let activeAnimationId: number | null = null;
	let hasStarted = false;
	let hasCovered = false;

	const edges = $derived.by(() => {
		const pxPerMs = FALL_SPEED / 1000;
		return {
			front: pxPerMs * elapsed,
			back: -layout.tileHeight + pxPerMs * Math.max(0, elapsed - timeline.coverEnd),
		};
	});

	// Tiles are recycled: tile `k` always lands in slot `k % rows`, and a slot is only
	// reused once its previous tile has dropped below the screen.
	const rowPositions = $derived.by(() => {
		const { rows, tileHeight, tileWidth } = layout;
		const { front, back } = edges;
		const canvasHeight = canvasSizes.height;
		const slots: ({ y: number; x: number } | null)[] = Array(rows).fill(null);
		// Tile 0 is the one at the very bottom of the curtain, so start from the first tile
		// that has not already dropped past the bottom of the screen instead of walking
		// the whole (unbounded) history of tiles.
		const firstTile = Math.max(0, Math.ceil((front - canvasHeight) / tileHeight) - 1);

		for (let k = firstTile; k < firstTile + rows + 2; k += 1) {
			const y = front - (k + 1) * tileHeight;
			if (y + tileHeight <= back) break; // above the trailing edge of the curtain
			if (y >= canvasHeight) continue; // has not reached the screen yet
			const slot = k % rows;
			if (slots[slot]) continue;
			slots[slot] = { y, x: -(((k * JITTER_STEP) % 1) * tileWidth) };
		}

		return slots;
	});

	// Fraction of the viewport the curtain currently spans. Reaches 1 while covering.
	const veilAlpha = $derived.by(() => {
		if (COVER_ALPHA <= 0) return 0;
		const canvasHeight = canvasSizes.height;
		const covered = Math.min(edges.front, canvasHeight) - Math.max(edges.back, 0);
		const ratio = Math.max(0, Math.min(1, covered / canvasHeight));
		// Ease in late / out early so the veil only shows once the stones are dense.
		return COVER_ALPHA * ratio ** 1.5;
	});

	const startAnimation = () => {
		if (sound.players) {
			sound.players.once.play({ name: 'sfx_transition', forcePlay: true });
		}

		isAnimating = true;
		elapsed = 0;
		hasCovered = false;
		const startTime = performance.now();

		const animate = () => {
			elapsed = performance.now() - startTime;

			if (!hasCovered && elapsed >= timeline.coverStart) {
				hasCovered = true;
				props.onCover?.();
			}

			if (elapsed >= timeline.total) {
				activeAnimationId = null;
				isAnimating = false;
				props.onComplete?.();
				return;
			}

			activeAnimationId = requestAnimationFrame(animate);
		};

		activeAnimationId = requestAnimationFrame(animate);
	};

	$effect(() => {
		if (hasStarted) return;
		hasStarted = true;
		startAnimation();
	});

	// Cancel any running RAF loop when the component is destroyed to prevent memory leaks.
	$effect(() => {
		return () => {
			if (activeAnimationId !== null) {
				cancelAnimationFrame(activeAnimationId);
				activeAnimationId = null;
			}
		};
	});
</script>

{#if isAnimating}
	<Container x={0} zIndex={10001}>
		{#if COVER_ALPHA > 0}
			<Container alpha={veilAlpha}>
				<CanvasSizeRectangle backgroundColor={COVER_COLOR} />
			</Container>
		{/if}

		{#each Array(layout.rows) as _, row}
			{@const position = rowPositions[row]}
			<Container
				visible={Boolean(position)}
				x={position?.x ?? 0}
				y={(position?.y ?? 0) + layout.tileHeight / 2}
			>
				{#each Array(layout.cols) as _, col}
					<Container x={(col + 0.5) * layout.tileWidth}>
						<SpineProvider
							key="stones"
							anchor={0}
							scale={{
								x: (row + col) % 2 === 0 ? layout.scale : -layout.scale,
								y: layout.scale,
							}}
						>
							<SpineTrack trackIndex={0} animationName="idle" loop />
						</SpineProvider>
					</Container>
				{/each}
			</Container>
		{/each}
	</Container>
{/if}
