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
		containerY: number;
		height: number;
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

		if (lineIndex >= 1 && lineIndex <= 5) {
			const row = lineIndex - 1;
			return { spriteKey: 'line_0', containerY: row * SYMBOL_SIZE, height: SYMBOL_SIZE, flipY: false, textY };
		}
		if (lineIndex === 6) {
			return { spriteKey: 'line_45', containerY: 0, height: BOARD_WIDTH, flipY: false, textY };
		}
		if (lineIndex === 7) {
			return { spriteKey: 'line_45', containerY: BOARD_WIDTH, height: BOARD_WIDTH, flipY: true, textY };
		}
		const isInverted = lineIndex >= 12;
		const minRow = isInverted ? lineIndex - 12 : lineIndex - 8;
		const h = SYMBOL_SIZE * 2;
		return {
			spriteKey: 'line_zigzag',
			containerY: isInverted ? minRow * SYMBOL_SIZE + h : minRow * SYMBOL_SIZE,
			height: h,
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
	) {
		const start = performance.now();
		const tick = (now: number) => {
			const t = Math.min((now - start) / duration, 1);
			setter(from + (to - from) * easing(t));
			if (t < 1) requestAnimationFrame(tick);
			else onDone?.();
		};
		requestAnimationFrame(tick);
	}

	const context = getContext();

	// ── Line reveal ───────────────────────────────────────────────────────
	let visible = $state(false);
	let layout = $state<LineLayout | null>(null);
	let maskWidth = $state(0);
	let revealRafId: number | null = null;

	// ── Win data ────────────────────────────────────────────────────────────
	let baseWinAmount = $state(0);
	let totalWinAmount = $state(0);
	let winMultiplier = $state(1);

	// ── Text phase state ─────────────────────────────────────────────────
	let showBase = $state(false);
	let baseScale = $state(0);
	let baseAlpha = $state(1);

	let showTotal = $state(false);
	let totalScale = $state(0);
	let totalAlpha = $state(0);

	let phase2Timer: ReturnType<typeof setTimeout> | null = null;

	// Phase 1 text: "0.50x2" when multiplier > 1, otherwise just the total win
	const phase1Text = $derived(
		winMultiplier > 1
			? `${formatWin(baseWinAmount)}x${winMultiplier}`
			: formatWin(totalWinAmount),
	);
	// Phase 2 text: total win after applying the multiplier
	const phase2Text = $derived(formatWin(totalWinAmount));

	function startReveal() {
		maskWidth = 0;
		if (revealRafId !== null) { cancelAnimationFrame(revealRafId); revealRafId = null; }
		const t0 = performance.now();
		const step = (now: number) => {
			if (!visible) return;
			maskWidth = Math.min(((now - t0) / REVEAL_DURATION) * BOARD_WIDTH, BOARD_WIDTH);
			revealRafId = maskWidth < BOARD_WIDTH ? requestAnimationFrame(step) : null;
		};
		revealRafId = requestAnimationFrame(step);
	}

	function startTextAnimation(multiplier: number) {
		showBase = true; showTotal = false;
		baseScale = 0; baseAlpha = 1;
		totalScale = 0; totalAlpha = 0;

		// Phase 1 – pop-in
		animateValue((v) => (baseScale = v), 0, 1, TEXT_POPUP_DURATION, easeOutBack);

		if (multiplier > 1) {
			phase2Timer = setTimeout(() => {
				animateValue((v) => (baseAlpha = v), 1, 0, 150, undefined, () => { showBase = false; });
				showTotal = true;
				animateValue((v) => (totalScale = v), 0, 1, TEXT_POPUP_DURATION, easeOutBack);
				animateValue((v) => (totalAlpha = v), 0, 1, 150);
			}, PHASE2_DELAY);
		}
	}

	function reset() {
		visible = false; layout = null; maskWidth = 0;
		showBase = false; showTotal = false;
		if (revealRafId !== null) { cancelAnimationFrame(revealRafId); revealRafId = null; }
		if (phase2Timer !== null) { clearTimeout(phase2Timer); phase2Timer = null; }
	}

	context.eventEmitter.subscribeOnMount({
		winLineShow: ({ lineIndex, baseWin, totalWin, multiplier }) => {
			layout = getLineLayout(lineIndex);
			visible = true;
			baseWinAmount = baseWin;
			totalWinAmount = totalWin;
			winMultiplier = multiplier;
			startReveal();
			startTextAnimation(multiplier);
		},
		winLineHide: reset,
	});
</script>

{#if visible && layout}
	<!-- ── Line sprite with animated left-to-right mask reveal ── -->
	<Container
		x={0}
		y={layout.containerY}
		scale={{ x: 1, y: layout.flipY ? -1 : 1 }}
		zIndex={60000}
		alpha={0.85}
	>
		<Rectangle isMask x={0} y={0} width={maskWidth} height={layout.height} />
		<Sprite
			key={layout.spriteKey}
			x={0}
			y={0}
			width={BOARD_WIDTH}
			height={layout.height}
			anchor={{ x: 0, y: 0 }}
		/>
	</Container>

	<!-- ── Phase 1: "0.50x2" (baseWin × multiplier equation) ── -->
	{#if showBase}
		<Container x={TEXT_X} y={layout.textY} zIndex={60001} scale={baseScale} alpha={baseAlpha}>
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
	{#if showTotal}
		<Container x={TEXT_X} y={layout.textY} zIndex={60001} scale={totalScale} alpha={totalAlpha}>
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
{/if}
