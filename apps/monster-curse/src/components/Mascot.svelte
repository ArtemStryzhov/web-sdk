<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Container, Sprite, Graphics } from 'pixi-svelte';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import * as PIXI from 'pixi.js';
	import lottie, { type AnimationItem } from 'lottie-web';
	import { getContext } from '../game/context';
	import MascotSprite from './MascotSprite.svelte';

	type Props = {
		x?: number;
		y?: number;
		width?: number;
		height?: number;
		anchor?: { x: number; y: number };
		zIndex?: number;
		format?: 'lottie' | 'video' | 'images';
		loop?: boolean;
		autoplay?: boolean;
		scale?: number;
		version?: number;
	};

	const props: Props = $props();

	// Default values
	const x = $derived(props.x ?? 0);
	const y = $derived(props.y ?? 0);
	const width = $derived(props.width ?? 500);
	const height = $derived(props.height ?? 550);
	const anchor = $derived(props.anchor ?? { x: 0.5, y: 0.5 });
	const zIndex = $derived(props.zIndex ?? 100);
	const format = $derived(props.format ?? 'lottie');
	const loop = $derived(props.loop ?? true);
	const autoplay = $derived(props.autoplay ?? true);
	const scale = $derived(props.scale ?? 1);
	const version = $derived(props.version ?? 1);

	const context = getContext();
	const pixiContext = getContextApp();
	const parentContext = getContextParent();
	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const isPortrait = $derived(layoutType === 'portrait');

	// Animation state
	let animationItem: AnimationItem | null = $state(null);
	let videoElement: HTMLVideoElement | null = $state(null);
	let imageSequenceIndex = $state(0);
	let texture: PIXI.Texture | null = $state(null);
	let sprite: PIXI.Sprite | null = $state(null);
	let canvas: HTMLCanvasElement | null = $state(null);
	let animationFrameId: number | null = $state(null);
	let lottieContainer: HTMLDivElement | null = $state(null);
	let containerRef: any = $state(null);
	let animationCompleted = $state(false);

	// Calculate actual dimensions with scale
	// Version 2 (win screen mascot) should be 25% larger
	const versionScale = $derived(version === 2 ? 1.35 : 1);
	const actualWidth = $derived(width * scale * versionScale);
	const actualHeight = $derived(height * scale * versionScale);

	// Lottie animation setup
	const setupLottie = () => {
		if (!pixiContext) return;

		// Create container for Lottie (it will create its own canvas)
		lottieContainer = document.createElement('div');
		lottieContainer.style.width = `${actualWidth}px`;
		lottieContainer.style.height = `${actualHeight}px`;
		lottieContainer.style.position = 'absolute';
		lottieContainer.style.left = '-9999px';
		lottieContainer.style.top = '-9999px';
		document.body.appendChild(lottieContainer);

		// Load Lottie animation - use absolute path for static assets
		const lottiePath = `/assets/spines/mascot/${version}/${version}.json`;
		// Set assetsPath so Lottie knows where to find the images
		// Version 1 has images directly in the folder, version 2 has them in a subfolder
		const assetsPath = version === 2 
			? `/assets/spines/mascot/${version}/images/`
			: `/assets/spines/mascot/${version}/`;

		// For version 2 (win screen mascot), don't loop - play once and hold last frame
		const shouldLoop = version === 2 ? false : loop;

		animationItem = lottie.loadAnimation({
			container: lottieContainer,
			renderer: 'canvas',
			loop: shouldLoop,
			autoplay: autoplay,
			path: lottiePath,
			assetsPath: assetsPath,
		});

		// Ensure animation plays
		if (autoplay && animationItem) {
			animationItem.play();
		}

		if (animationItem) {
			animationItem.addEventListener('data_failed', (err) => {
				console.error('[Mascot] Lottie data failed to load:', err);
			});
		}

		// Wait for Lottie to create its canvas
		const waitForLottieCanvas = () => {
			if (!lottieContainer) return;
			const lottieCanvas = lottieContainer.querySelector('canvas') as HTMLCanvasElement;
			if (!lottieCanvas) {
				// Retry after a short delay
				setTimeout(waitForLottieCanvas, 50);
				return;
			}
			setupLottieCanvas(lottieCanvas);
		};

		const setupLottieCanvas = (lottieCanvas: HTMLCanvasElement) => {

			// Create our own canvas for texture updates
			canvas = document.createElement('canvas');
			canvas.width = actualWidth;
			canvas.height = actualHeight;
			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			// Create PIXI texture from canvas
			const updateTexture = () => {
				if (canvas && lottieCanvas && ctx && pixiContext) {
					// Copy Lottie canvas to our canvas
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(lottieCanvas, 0, 0, actualWidth, actualHeight);

					// Always create/update texture - even if empty, it will update when Lottie renders
					if (texture) {
						texture.destroy();
					}
					texture = PIXI.Texture.from(canvas);
				}
			};

			// Update texture on each frame
			const animate = () => {
				if (animationItem && animationItem.isLoaded && !animationCompleted) {
					updateTexture();
				} else if (animationCompleted && lottieCanvas && ctx && pixiContext) {
					// Keep updating texture from last frame when animation is completed
					updateTexture();
				}
				animationFrameId = requestAnimationFrame(animate);
			};

			if (animationItem) {
				// For version 2, listen for complete event to hold last frame
				if (version === 2) {
					animationItem.addEventListener('complete', () => {
						animationCompleted = true;
						// Keep the last frame visible by continuing to update texture
						if (animationFrameId === null) {
							animate();
						}
					});
				}

				// Wait for DOMLoaded to ensure Lottie is fully ready
				animationItem.addEventListener('DOMLoaded', () => {
					// Create initial texture and start animation
					updateTexture();
					if (autoplay) {
						animate();
					}
				});

				animationItem.addEventListener('loaded_images', () => {
					// Update texture when images load
					updateTexture();
				});

				// Listen for enterFrame to update texture as animation plays
				animationItem.addEventListener('enterFrame', () => {
					if (!animationCompleted) {
						updateTexture();
					}
				});

				// Also listen for config_ready in case DOMLoaded doesn't fire
				animationItem.addEventListener('config_ready', () => {
					setTimeout(() => {
						updateTexture();
						if (autoplay && !animationFrameId) {
							animate();
						}
					}, 100);
				});
			}
		};

		// Start waiting for canvas
		waitForLottieCanvas();
	};

	// Video animation setup
	const setupVideo = () => {
		if (!canvas || !pixiContext) return;

		videoElement = document.createElement('video');
		videoElement.src = `/assets/spines/mascot/${version}.mov`;
		videoElement.loop = loop;
		videoElement.autoplay = autoplay;
		videoElement.muted = true; // Required for autoplay
		videoElement.playsInline = true;

		canvas.width = actualWidth;
		canvas.height = actualHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		if (!videoElement) return;
		
		videoElement.addEventListener('loadedmetadata', () => {
			if (!videoElement) return;
			// Scale video to fit canvas
			const videoAspect = videoElement.videoWidth / videoElement.videoHeight;
			const canvasAspect = actualWidth / actualHeight;

			let drawWidth = actualWidth;
			let drawHeight = actualHeight;
			let drawX = 0;
			let drawY = 0;

			if (videoAspect > canvasAspect) {
				// Video is wider
				drawHeight = actualWidth / videoAspect;
				drawY = (actualHeight - drawHeight) / 2;
			} else {
				// Video is taller
				drawWidth = actualHeight * videoAspect;
				drawX = (actualWidth - drawWidth) / 2;
			}

			const updateTexture = () => {
				if (canvas && videoElement && ctx) {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(videoElement, drawX, drawY, drawWidth, drawHeight);

					if (texture) {
						texture.destroy();
					}
					texture = PIXI.Texture.from(canvas);
				}
			};

			const animate = () => {
				if (videoElement && !videoElement.paused) {
					updateTexture();
				}
				animationFrameId = requestAnimationFrame(animate);
			};

			if (videoElement) {
				videoElement.addEventListener('play', () => {
					animate();
				});

				videoElement.play().catch((err) => {
					console.error('Video autoplay failed:', err);
				});
			}
		});
	};

	// Image sequence animation setup
	const setupImageSequence = () => {
		if (!canvas || !pixiContext) return;

		canvas.width = actualWidth;
		canvas.height = actualHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const numFrames = 76; // Based on the JSON, there are 76 frames
		const fps = 15; // From the JSON: "fr":15
		const frameDelay = 1000 / fps;

		let lastFrameTime = Date.now();

		const loadImage = (index: number): Promise<HTMLImageElement> => {
			return new Promise((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve(img);
				img.onerror = reject;
				const imagePath = version === 2
					? `/assets/spines/mascot/${version}/images/img_${index}.png`
					: `/assets/spines/mascot/${version}/img_${index}.png`;
				img.src = imagePath;
			});
		};

		const updateTexture = (img: HTMLImageElement) => {
			if (canvas && ctx) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0, actualWidth, actualHeight);

				if (texture) {
					texture.destroy();
				}
				texture = PIXI.Texture.from(canvas);
			}
		};

		const animate = async () => {
			const now = Date.now();
			if (now - lastFrameTime >= frameDelay) {
				lastFrameTime = now;

				try {
					const img = await loadImage(imageSequenceIndex);
					updateTexture(img);

					imageSequenceIndex++;
					if (imageSequenceIndex >= numFrames) {
						if (loop) {
							imageSequenceIndex = 0;
						} else {
							return; // Stop animation
						}
					}
				} catch (err) {
					console.error('Failed to load image frame:', err);
				}
			}

			animationFrameId = requestAnimationFrame(animate);
		};

		// Load first frame
		loadImage(0)
			.then((img) => {
				updateTexture(img);
				if (autoplay) {
					animate();
				}
			})
			.catch((err) => {
				console.error('Failed to load first frame:', err);
			});
	};



	// Track previous version to detect changes
	let previousVersion = $state<number | null>(null);

	// Cleanup function
	const cleanup = () => {
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		if (animationItem) {
			animationItem.destroy();
			animationItem = null;
		}
		if (lottieContainer && lottieContainer.parentNode) {
			lottieContainer.parentNode.removeChild(lottieContainer);
			lottieContainer = null;
		}
		if (videoElement) {
			videoElement.pause();
			videoElement.src = '';
			videoElement = null;
		}
		if (texture) {
			texture.destroy();
			texture = null;
		}
		canvas = null;
		animationCompleted = false;
	};

	// Setup animation based on format and version
	const setupAnimation = () => {
		cleanup();
		animationCompleted = false;
		
		// Setup based on format
		if (format === 'lottie') {
			setupLottie();
		} else if (format === 'video') {
			// Create canvas for video
			canvas = document.createElement('canvas');
			setupVideo();
		} else if (format === 'images') {
			// Create canvas for image sequence
			canvas = document.createElement('canvas');
			setupImageSequence();
		}
	};

	// Watch for version changes and reinitialize only when version actually changes
	$effect(() => {
		const currentVersion = version;
		if (previousVersion === null || currentVersion !== previousVersion) {
			previousVersion = currentVersion;
			setupAnimation();
		}
	});

	onMount(() => {
		setupAnimation();
	});

	onDestroy(() => {
		cleanup();
	});
</script>

<Container x={x} y={y} zIndex={zIndex} eventMode="none">
	{#if texture}
		<MascotSprite {texture} {anchor} width={actualWidth} height={actualHeight} />
	{/if}
</Container>

