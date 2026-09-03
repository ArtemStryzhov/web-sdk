<script lang="ts">
	import { Container, Rectangle, Sprite, Text, Graphics } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import config from '../game/config';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	const BOARD_WIDTH = SYMBOL_SIZE * BOARD_DIMENSIONS.x; // 600
	const REVEAL_DURATION = 500; // ms
	const TEXT_POPUP_DURATION = 250; // ms – scale pop-in
	const PHASE2_DELAY = 600; // ms – delay before showing total win
	// x ≈ centre of reel 1 (left side of the second reel)
	const TEXT_X = SYMBOL_SIZE * 1.5; // 180 px

	// ── line_zigzag.png geometry ─────────────────────────────────────
	// The artwork isn't drawn to the board grid: measured on the source image
	// (882x273) its apexes sit at these normalised positions.
	const ZIGZAG_U_BOT_L = 0.2664; // x of the left bottom apex   (reel 2 centre)
	const ZIGZAG_U_BOT_R = 0.7415; // x of the right bottom apex  (reel 4 centre)
	const ZIGZAG_V_TOP = 0.1224;   // y of the middle top apex    (upper row centre)
	const ZIGZAG_V_BOT = 0.8990;   // y of the two bottom apexes  (lower row centre)

	// Draw rect that maps those apexes onto the reel/row centres — i.e. the sprite is
	// scaled down about the zigzag's own centre so the line runs through the symbols
	// instead of over their tops.
	const ZIGZAG_W = (SYMBOL_SIZE * 2) / (ZIGZAG_U_BOT_R - ZIGZAG_U_BOT_L);
	const ZIGZAG_X = SYMBOL_SIZE * 1.5 - ZIGZAG_U_BOT_L * ZIGZAG_W;
	const ZIGZAG_H = SYMBOL_SIZE / (ZIGZAG_V_BOT - ZIGZAG_V_TOP);
	const ZIGZAG_Y = SYMBOL_SIZE * 0.5 - ZIGZAG_V_TOP * ZIGZAG_H;

	const LABEL_W = 150; // border width  (wider than Symbol.svelte's 80 to fit "0.50x2")
	const LABEL_H = 60;  // border height (same as Symbol.svelte)
	const FONT_SIZE = 40;

	// Exact styles from Symbol.svelte multiplier text
	const shadowStyle = {
		fontFamily: 'Crom, Arial, sans-serif',
		fontWeight: 'bold' as const,
		fill: 0xBF00B5,
		fontSize: FONT_SIZE,
		align: 'center' as const,
		padding: 15,
	};
	const mainStyle = {
		fontFamily: 'Crom, Arial, sans-serif',
		fontWeight: 'bold' as const,
		fill: 0x61E5FF,
		fontSize: FONT_SIZE,
		stroke: { color: 0x7B15FF, width: 3 },
		align: 'center' as const,
		padding: 15,
	};

	type LineLayout = {
		spriteKey: 'line_0' | 'line_45' | 'line_zigzag';
		/** container origin in board space: top edge of the sprite, or its bottom edge when flipY */
		containerY: number;
		/** sprite draw rect inside the container; the reveal mask covers the same height */
		spriteX: number;
		spriteWidth: number;
		spriteHeight: number;
		flipY: boolean;
		/** y of win-amount label in board space (15 px above the line at reel 1) */
		textY: number;
	};

	/** Ease-out-back: smooth overshoot "pop" */
	function easeOutBack(t: number): number {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
	}

	function getLineLayout(lineIndex: number): LineLayout {
		const paylines = config.paylines as Record<string, number[]>;
		const payline = paylines[String(lineIndex)];
		const rowAtReel1 = payline ? payline[1] : 0;
		const textY = rowAtReel1 * SYMBOL_SIZE - 15;

		const full = { spriteX: 0, spriteWidth: BOARD_WIDTH };

		if (lineIndex >= 1 && lineIndex <= 5) {
			const row = lineIndex - 1;
			return { spriteKey: 'line_0', containerY: row * SYMBOL_SIZE, ...full, spriteHeight: SYMBOL_SIZE, flipY: false, textY };
		}
		if (lineIndex === 6) {
			return { spriteKey: 'line_45', containerY: BOARD_WIDTH, ...full, spriteHeight: BOARD_WIDTH, flipY: true, textY };
		}
		if (lineIndex === 7) {
			return { spriteKey: 'line_45', containerY: 0, ...full, spriteHeight: BOARD_WIDTH, flipY: false, textY };
		}
		const isInverted = lineIndex >= 12;
		const minRow = isInverted ? lineIndex - 12 : lineIndex - 8;
		// The line lives in a 2-row band; the sprite is inset by ZIGZAG_Y inside it
		// (mirrored for the inverted lines, which are drawn with scale.y = -1).
		const bandTop = minRow * SYMBOL_SIZE;
		return {
			spriteKey: 'line_zigzag',
			containerY: isInverted ? bandTop + SYMBOL_SIZE * 2 - ZIGZAG_Y : bandTop + ZIGZAG_Y,
			spriteX: ZIGZAG_X,
			spriteWidth: ZIGZAG_W,
			spriteHeight: ZIGZAG_H,
			flipY: isInverted,
			textY,
		};
	}

	function formatWin(amount: number): string {
		return bookEventAmountToCurrencyString(amount).replace('.', '•');
	}

	function animateValue(
		setter: (v: number) => void,
		from: number,
		to: number,
		duration: number,
		easing: (t: number) => number = (t) => t,
		onDone?: () => void,
	): number {
		const start = performance.now();
		let rafId: number;
		const tick = (now: number) => {
			const t = Math.min((now - start) / duration, 1);
			setter(from + (to - from) * easing(t));
			if (t < 1) rafId = requestAnimationFrame(tick);
			else onDone?.();
		};
		rafId = requestAnimationFrame(tick);
		return rafId;
	}

	const context = getContext();

	// ── Multi-line concurrent state ─────────────────────────────────────────
	type ActiveLine = {
		lineIndex: number;
		layout: LineLayout;
		adjustedTextX: number; // collision-free horizontal position for the amount label
		maskWidth: number;
		baseWinAmount: number;
		totalWinAmount: number;
		winMultiplier: number;
		showBase: boolean;
		baseScale: number;
		baseAlpha: number;
		showTotal: boolean;
		totalScale: number;
		totalAlpha: number;
	};

	// Minimum vertical distance between two lines' textY to consider them "close" (same or adjacent row)
	const CLOSE_ROW_THRESHOLD = SYMBOL_SIZE; // 120px — within one symbol height
	// Horizontal step when nudging a label to avoid overlap (label width + padding)
	const LABEL_X_STEP = LABEL_W + 20; // 170px

	/**
	 * Find an X position for the amount label that avoids overlapping with already-active
	 * lines whose win rows are close (same or adjacent row).
	 * Lines on well-separated rows get the default TEXT_X.
	 */
	function computeAdjustedTextX(textY: number): number {
		// Collect X positions already taken by lines whose textY is "close" to ours
		const occupiedX = activeLines
			.filter(l => Math.abs(l.layout.textY - textY) < CLOSE_ROW_THRESHOLD)
			.map(l => l.adjustedTextX);

		if (occupiedX.length === 0) return TEXT_X;

		// Try nudging right in steps until we find a clear spot
		const offsets = [0, LABEL_X_STEP, LABEL_X_STEP * 2, -LABEL_X_STEP];
		for (const offset of offsets) {
			const candidate = TEXT_X + offset;
			if (!occupiedX.some(x => Math.abs(x - candidate) < LABEL_X_STEP)) {
				return candidate;
			}
		}
		return TEXT_X + LABEL_X_STEP * occupiedX.length;
	}

	let activeLines = $state<ActiveLine[]>([]);

	// Non-reactive timer/RAF tracking keyed by lineIndex
	const lineRafIds = new Map<number, number>();
	const linePhase2Timers = new Map<number, ReturnType<typeof setTimeout>>();
	// Extra RAF IDs spawned by animateValue calls (text scale/alpha transitions)
	const lineAnimateValueRafIds = new Map<number, number[]>();

	function addAnimateValueRaf(lineIndex: number, rafId: number): void {
		const ids = lineAnimateValueRafIds.get(lineIndex) ?? [];
		ids.push(rafId);
		lineAnimateValueRafIds.set(lineIndex, ids);
	}

	function cancelLineTimers(lineIndex: number): void {
		const rafId = lineRafIds.get(lineIndex);
		if (rafId !== undefined) { cancelAnimationFrame(rafId); lineRafIds.delete(lineIndex); }
		const timer = linePhase2Timers.get(lineIndex);
		if (timer !== undefined) { clearTimeout(timer); linePhase2Timers.delete(lineIndex); }
		// Cancel any in-flight animateValue RAF loops for this line
		const avIds = lineAnimateValueRafIds.get(lineIndex);
		if (avIds) { avIds.forEach(id => cancelAnimationFrame(id)); lineAnimateValueRafIds.delete(lineIndex); }
	}

	function startRevealForLine(lineIndex: number): void {
		cancelLineTimers(lineIndex);
		const t0 = performance.now();
		const step = (now: number) => {
			const line = activeLines.find(l => l.lineIndex === lineIndex);
			if (!line) return;
			line.maskWidth = Math.min(((now - t0) / REVEAL_DURATION) * BOARD_WIDTH, BOARD_WIDTH);
			if (line.maskWidth < BOARD_WIDTH) {
				lineRafIds.set(lineIndex, requestAnimationFrame(step));
			} else {
				lineRafIds.delete(lineIndex);
			}
		};
		lineRafIds.set(lineIndex, requestAnimationFrame(step));
	}

	function startTextAnimationForLine(lineIndex: number, multiplier: number): void {
		const line = activeLines.find(l => l.lineIndex === lineIndex);
		if (!line) return;

		line.showBase = true; line.showTotal = false;
		line.baseScale = 0; line.baseAlpha = 1;
		line.totalScale = 0; line.totalAlpha = 0;

		// Phase 1 – pop-in
		addAnimateValueRaf(lineIndex, animateValue(
			(v) => { const l = activeLines.find(x => x.lineIndex === lineIndex); if (l) l.baseScale = v; },
			0, 1, TEXT_POPUP_DURATION, easeOutBack,
		));

		if (multiplier > 1) {
			const timer = setTimeout(() => {
				linePhase2Timers.delete(lineIndex);
				addAnimateValueRaf(lineIndex, animateValue(
					(v) => { const l = activeLines.find(x => x.lineIndex === lineIndex); if (l) l.baseAlpha = v; },
					1, 0, 150, undefined,
					() => { const l = activeLines.find(x => x.lineIndex === lineIndex); if (l) l.showBase = false; },
				));
				const l = activeLines.find(x => x.lineIndex === lineIndex);
				if (l) {
					l.showTotal = true;
					addAnimateValueRaf(lineIndex, animateValue(
						(v) => { const m = activeLines.find(x => x.lineIndex === lineIndex); if (m) m.totalScale = v; },
						0, 1, TEXT_POPUP_DURATION, easeOutBack,
					));
					addAnimateValueRaf(lineIndex, animateValue(
						(v) => { const m = activeLines.find(x => x.lineIndex === lineIndex); if (m) m.totalAlpha = v; },
						0, 1, 150,
					));
				}
			}, PHASE2_DELAY);
			linePhase2Timers.set(lineIndex, timer);
		}
	}

	context.eventEmitter.subscribeOnMount({
		winLineShow: ({ lineIndex, baseWin, totalWin, multiplier }) => {
			// Replace existing line with same index if already showing
			const existingIdx = activeLines.findIndex(l => l.lineIndex === lineIndex);
			if (existingIdx !== -1) {
				cancelLineTimers(lineIndex);
				activeLines.splice(existingIdx, 1);
			}

			const layout = getLineLayout(lineIndex);
			activeLines.push({
				lineIndex,
				layout,
				adjustedTextX: computeAdjustedTextX(layout.textY),
				maskWidth: 0,
				baseWinAmount: baseWin,
				totalWinAmount: totalWin,
				winMultiplier: multiplier,
				showBase: false,
				baseScale: 0,
				baseAlpha: 1,
				showTotal: false,
				totalScale: 0,
				totalAlpha: 0,
			});

			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_standard' });
			startRevealForLine(lineIndex);
			startTextAnimationForLine(lineIndex, multiplier);
		},
		winLineHide: ({ lineIndex }) => {
			if (lineIndex !== undefined) {
				cancelLineTimers(lineIndex);
				const idx = activeLines.findIndex(l => l.lineIndex === lineIndex);
				if (idx !== -1) activeLines.splice(idx, 1);
			} else {
				activeLines.forEach(l => cancelLineTimers(l.lineIndex));
				activeLines.splice(0, activeLines.length);
			}
		},
	});
</script>

{#each activeLines as line (line.lineIndex)}
	{@const phase1Text = line.winMultiplier > 1
		? `${formatWin(line.baseWinAmount)}x${line.winMultiplier}`
		: formatWin(line.totalWinAmount)}
	{@const phase2Text = formatWin(line.totalWinAmount)}

	<!-- ── Line sprite with animated left-to-right mask reveal ── -->
	<Container
		x={0}
		y={line.layout.containerY}
		scale={{ x: 1, y: line.layout.flipY ? -1 : 1 }}
		zIndex={60000}
		alpha={0.85}
	>
		<Rectangle isMask x={0} y={0} width={line.maskWidth} height={line.layout.spriteHeight} />
		<Sprite
			key={line.layout.spriteKey}
			x={line.layout.spriteX}
			y={0}
			width={line.layout.spriteWidth}
			height={line.layout.spriteHeight}
			anchor={{ x: 0, y: 0 }}
		/>
	</Container>

	<!-- ── Phase 1: "0.50x2" (baseWin × multiplier equation) ── -->
	{#if line.showBase}
		<Container x={line.adjustedTextX} y={line.layout.textY} zIndex={60001} scale={line.baseScale} alpha={line.baseAlpha}>
			<!-- Border matching Symbol.svelte gradient stroke -->
			<Graphics
				x={0} y={0}
				draw={(g) => {
					g.clear();
					g.lineStyle(5, 0xFF70EA, 1);
					g.drawRoundedRect(-LABEL_W / 2, -LABEL_H / 2, LABEL_W, LABEL_H, 8);
				}}
			/>
			<!-- Drop-shadow layer (offset +3, +6) -->
			<Text text={phase1Text} anchor={0.5} x={3} y={6} style={shadowStyle} />
			<!-- Main text -->
			<Text text={phase1Text} anchor={0.5} x={0} y={0} style={mainStyle} />
		</Container>
	{/if}

	<!-- ── Phase 2: total win (result of equation) ── -->
	{#if line.showTotal}
		<Container x={line.adjustedTextX} y={line.layout.textY} zIndex={60001} scale={line.totalScale} alpha={line.totalAlpha}>
			<Graphics
				x={0} y={0}
				draw={(g) => {
					g.clear();
					g.lineStyle(5, 0xFF70EA, 1);
					g.drawRoundedRect(-LABEL_W / 2, -LABEL_H / 2, LABEL_W, LABEL_H, 8);
				}}
			/>
			<Text text={phase2Text} anchor={0.5} x={3} y={6} style={shadowStyle} />
			<Text text={phase2Text} anchor={0.5} x={0} y={0} style={mainStyle} />
		</Container>
	{/if}
{/each}
