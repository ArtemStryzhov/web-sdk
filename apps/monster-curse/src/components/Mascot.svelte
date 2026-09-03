<script lang="ts" module>
	import * as PIXI from 'pixi.js';

	/**
	 * The mascot is a pre-rendered PNG frame sequence exported from After Effects,
	 * not a Spine skeleton (despite living under `assets/spines/`).
	 *
	 * Both variants are 30 fps re-renders; filenames are zero padded to 5 digits
	 * (img_00000.png ... img_00150.png). If the sequences are re-exported again,
	 * `frames` and `fps` here are the only values that need updating.
	 */
	const VARIANTS = {
		1: { dir: '1', frames: 151, fps: 30, width: 500, height: 550, loop: true, scale: 1 },
		2: { dir: '2/images', frames: 109, fps: 30, width: 500, height: 450, loop: false, scale: 1.68 },
	} as const;

	type VariantKey = keyof typeof VARIANTS;

	const FRAME_DIGITS = 5;
	const DECODE_CONCURRENCY = 8;

	// Decoded frames are cached at module level: the portrait and desktop mascots are
	// separate component instances behind an {#if}, so rotating the device remounts
	// this component and would otherwise re-download and re-decode the whole sequence.
	//
	// Decoded frames are expensive — a 500x550 RGBA bitmap is 1.1MB, so variant 1
	// alone is ~166MB resident. Variant 1 is the idle loop and stays; variant 2 is
	// released once the big win is over (see releaseFrames).
	const frameCache = new Map<VariantKey, Promise<ImageBitmap[]>>();
	const warmed = new Set<VariantKey>();

	const frameUrl = (version: VariantKey, index: number) => {
		const base = (import.meta as any).env?.BASE_URL ?? '/';
		const assetBase = base.endsWith('/') ? base.slice(0, -1) : base;
		const name = `img_${String(index).padStart(FRAME_DIGITS, '0')}.png`;
		return `${assetBase}/assets/spines/mascot/${VARIANTS[version].dir}/${name}`;
	};

	// A fixed pool rather than one Promise.all over every frame: 151 simultaneous
	// requests on an HTTP/2 origin starve the rest of the game's asset loading.
	const eachFrame = (version: VariantKey, handle: (index: number) => Promise<void>) => {
		const { frames } = VARIANTS[version];
		let next = 0;
		const worker = async () => {
			while (next < frames) await handle(next++);
		};
		return Promise.all(Array.from({ length: Math.min(DECODE_CONCURRENCY, frames) }, worker));
	};

	const fetchFrame = async (version: VariantKey, index: number) => {
		const response = await fetch(frameUrl(version, index));
		if (!response.ok) {
			throw Error(`[Mascot] variant ${version} frame ${index}: HTTP ${response.status}`);
		}
		return response;
	};

	const loadFrames = (version: VariantKey) => {
		const cached = frameCache.get(version);
		if (cached) return cached;

		const bitmaps = new Array<ImageBitmap>(VARIANTS[version].frames);
		const promise = eachFrame(version, async (index) => {
			bitmaps[index] = await createImageBitmap(await (await fetchFrame(version, index)).blob());
		})
			.then(() => bitmaps)
			.catch((error) => {
				frameCache.delete(version); // let a later mount retry instead of caching the failure
				throw error;
			});

		frameCache.set(version, promise);
		return promise;
	};

	/**
	 * Pull a sequence into the HTTP cache without decoding it. Variant 2 only gets a
	 * 2s head start before the win screen (see bookEventHandlerMap `setWin`), which is
	 * not enough to fetch 12MB on a slow connection — but it is ample to decode 109
	 * already-cached frames. Warming bytes instead of bitmaps buys that head start for
	 * ~0 resident memory.
	 */
	const warmFrames = async (version: VariantKey) => {
		if (warmed.has(version) || frameCache.has(version)) return;
		warmed.add(version);
		try {
			await eachFrame(version, async (index) => {
				await (await fetchFrame(version, index)).arrayBuffer();
			});
		} catch {
			warmed.delete(version);
		}
	};

	const releaseFrames = async (version: VariantKey) => {
		const pending = frameCache.get(version);
		if (!pending) return;
		frameCache.delete(version);
		try {
			(await pending).forEach((bitmap) => bitmap.close());
		} catch {
			// load already failed and removed itself from the cache
		}
	};
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, BaseSprite, getContextApp } from 'pixi-svelte';

	import { sound } from '../game/sound';

	type Props = {
		x?: number;
		y?: number;
		width?: number;
		height?: number;
		anchor?: { x: number; y: number };
		zIndex?: number;
		loop?: boolean;
		autoplay?: boolean;
		scale?: number;
		version?: number;
	};

	const props: Props = $props();

	const x = $derived(props.x ?? 0);
	const y = $derived(props.y ?? 0);
	const width = $derived(props.width ?? 500);
	const height = $derived(props.height ?? 550);
	const anchor = $derived(props.anchor ?? { x: 0.5, y: 0.5 });
	const zIndex = $derived(props.zIndex ?? 100);
	const loop = $derived(props.loop ?? true);
	const autoplay = $derived(props.autoplay ?? true);
	const scale = $derived(props.scale ?? 1);
	const version = $derived((props.version ?? 1) as VariantKey);

	const context = getContextApp();

	type Surface = {
		canvas: HTMLCanvasElement;
		ctx: CanvasRenderingContext2D;
		texture: PIXI.Texture;
	};

	// One canvas + one GPU texture per variant, each created once. Frames are blitted
	// into the canvas at native size and the sprite does the scaling, so there is no
	// per-frame CPU resample and no per-frame texture allocation.
	const surfaces = new Map<VariantKey, Surface>();

	let frames: ImageBitmap[] = [];
	let elapsed = 0;
	let drawnFrame = -1;
	let requestedVersion: VariantKey | null = null;

	let activeVersion = $state<VariantKey | null>(null);
	let texture = $state<PIXI.Texture | null>(null);

	// Sizing follows the variant actually on screen, not the requested one, so the
	// outgoing animation keeps its own scale while the incoming one is still decoding.
	//
	// Expressed as a sprite scale rather than width/height because the two variants
	// have different native heights (550 vs 450): width/height are resolved against
	// whichever texture the sprite currently holds, so a swap would mis-size for a
	// frame. The target box is unchanged from the previous implementation — both
	// variants are still drawn into `width x height` scaled by the variant factor,
	// which stretches variant 2's 450px-tall art the same way Lottie did.
	const spriteScale = $derived.by(() => {
		if (!activeVersion) return { x: 1, y: 1 };
		const variant = VARIANTS[activeVersion];
		return {
			x: (width * scale * variant.scale) / variant.width,
			y: (height * scale * variant.scale) / variant.height,
		};
	});

	const getSurface = (variantKey: VariantKey) => {
		const existing = surfaces.get(variantKey);
		if (existing) return existing;

		const variant = VARIANTS[variantKey];
		const canvas = document.createElement('canvas');
		canvas.width = variant.width;
		canvas.height = variant.height;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw Error('[Mascot] could not acquire a 2d context');

		// Built directly rather than via PIXI.Texture.from(), which would put the
		// canvas in the global texture cache and hand back a destroyed texture if
		// this component is ever remounted after teardown.
		const surface = {
			canvas,
			ctx,
			texture: new PIXI.Texture({ source: new PIXI.CanvasSource({ resource: canvas }) }),
		};
		surfaces.set(variantKey, surface);
		return surface;
	};

	const drawFrame = (surface: Surface, index: number) => {
		surface.ctx.clearRect(0, 0, surface.canvas.width, surface.canvas.height);
		surface.ctx.drawImage(frames[index], 0, 0);
		surface.texture.source.update();
		drawnFrame = index;
	};

	const tick = (pixiTicker: PIXI.Ticker) => {
		const currentVersion = activeVersion;
		if (!currentVersion || !autoplay || frames.length === 0) return;

		const variant = VARIANTS[currentVersion];
		const shouldLoop = variant.loop && loop;
		const duration = (variant.frames * 1000) / variant.fps;

		elapsed += pixiTicker.deltaMS;
		if (shouldLoop) elapsed %= duration; // keep the accumulator from drifting into float noise

		const raw = Math.floor(elapsed / (1000 / variant.fps));
		const index = shouldLoop ? raw % variant.frames : Math.min(raw, variant.frames - 1);

		// Only touch the GPU when the frame really changes: at 30 fps on a 60 Hz
		// display that halves the upload traffic, and the old pipeline did a full
		// texture re-upload every single rAF regardless.
		if (index === drawnFrame) return;
		drawFrame(getSurface(currentVersion), index);
	};

	const showVariant = async (nextVersion: VariantKey) => {
		const bitmaps = await loadFrames(nextVersion);
		if (requestedVersion !== nextVersion) return; // superseded while decoding

		const surface = getSurface(nextVersion);
		frames = bitmaps;
		elapsed = 0;
		drawnFrame = -1;

		// Paint frame 0 before handing the texture to the sprite so the swap never
		// shows a blank or stale frame.
		drawFrame(surface, 0);
		texture = surface.texture;
		activeVersion = nextVersion;
	};

	$effect(() => {
		const nextVersion = version;
		if (nextVersion === requestedVersion) return;

		const previousVersion = requestedVersion;
		requestedVersion = nextVersion;

		if (previousVersion === 1 && nextVersion === 2) {
			sound.players?.once.play({ name: 'sfx_mascot_win_move', forcePlay: true });
		}

		showVariant(nextVersion)
			.then(() => {
				if (nextVersion !== 1) return;
				// Back on the idle loop: hand back variant 2's ~98MB of bitmaps, and
				// pull its bytes into the HTTP cache so the next big win is instant.
				void releaseFrames(2);
				const warm = () => void warmFrames(2);
				if (typeof requestIdleCallback === 'function') requestIdleCallback(warm);
				else setTimeout(warm, 2000);
			})
			.catch((error) => console.error('[Mascot] failed to load frames', error));
	});

	$effect(() => {
		const application = context.stateApp.pixiApplication;
		if (!application) return;

		const applicationTicker = application.ticker;
		applicationTicker.add(tick);
		return () => applicationTicker.remove(tick);
	});

	onDestroy(() => {
		// Canvases and GPU textures are per-instance and must go — layout changes
		// remount this component, so leaking them would accumulate. The decoded
		// bitmaps behind `frameCache` are shared with the next mount and are kept.
		surfaces.forEach((surface) => surface.texture.destroy(true));
		surfaces.clear();
		frames = [];
	});
</script>

<Container {x} {y} {zIndex} eventMode="none">
	{#if texture}
		<BaseSprite {texture} scale={spriteScale} {anchor} />
	{/if}
</Container>
