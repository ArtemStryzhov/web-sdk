<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import { devicePixelRatio } from 'svelte/reactivity/window';

	import { getContextApp } from '../context.svelte';
	import { preloadFont } from '../utils.svelte';

	type Props = { children: Snippet };

	const props: Props = $props();
	const context = getContextApp();

	let wrap: HTMLDivElement;
	let initialised = $state(false);

	const initialiseApplication = async () => {
		PIXI.Assets.reset();

		// Start font loading in background (completely non-blocking)
		preloadFont(); // Don't await - let it happen in background
		
		try {
			context.stateApp.pixiApplication = new PIXI.Application<PIXI.Renderer<HTMLCanvasElement>>();
			
			await context.stateApp.pixiApplication.init({
				autoDensity: true,
				backgroundAlpha: 0,
				hello: true,
				multiView: false,
				antialias: true,
				clearBeforeRender: true,
				preference: 'webgpu',
				powerPreference: 'high-performance',
				resolution: devicePixelRatio.current,
				resizeTo: window,
			});
		} catch (webgpuError) {
			console.warn('WebGPU failed, falling back to WebGL:', webgpuError);
			
			try {
				context.stateApp.pixiApplication = new PIXI.Application<PIXI.Renderer<HTMLCanvasElement>>();
				
				await context.stateApp.pixiApplication.init({
					autoDensity: true,
					backgroundAlpha: 0,
					hello: true,
					multiView: false,
					antialias: true,
					clearBeforeRender: true,
					preference: 'webgl',
					powerPreference: 'high-performance',
					resolution: devicePixelRatio.current,
					resizeTo: window,
				});
			} catch (webglError) {
				console.warn('WebGL failed, trying basic WebGL:', webglError);
				
				try {
					context.stateApp.pixiApplication = new PIXI.Application<PIXI.Renderer<HTMLCanvasElement>>();
					
					await context.stateApp.pixiApplication.init({
						autoDensity: true,
						backgroundAlpha: 0,
						resolution: devicePixelRatio.current,
						resizeTo: window,
					});
				} catch (basicError) {
					console.warn('Basic WebGL failed, trying legacy constructor:', basicError);
					
					try {
						// Try the legacy constructor approach
						context.stateApp.pixiApplication = new PIXI.Application({
							autoDensity: true,
							backgroundAlpha: 0,
							resolution: devicePixelRatio.current,
							resizeTo: window,
						});
					} catch (legacyError) {
						console.error('All PIXI initialization attempts failed:', {
							webgpuError: webgpuError instanceof Error ? webgpuError.message : String(webgpuError),
							webglError: webglError instanceof Error ? webglError.message : String(webglError),
							basicError: basicError instanceof Error ? basicError.message : String(basicError),
							legacyError: legacyError instanceof Error ? legacyError.message : String(legacyError),
							devicePixelRatio: devicePixelRatio.current,
							windowSize: { width: window.innerWidth, height: window.innerHeight }
						});
						throw legacyError;
					}
				}
			}
		}

		// Ensure pixiApplication was created and initialized successfully
		if (!context.stateApp.pixiApplication) {
			throw new Error('Failed to create PIXI Application with all fallback options');
		}

		// Ensure canvas exists before appending
		if (context.stateApp.pixiApplication && context.stateApp.pixiApplication.canvas) {
			wrap.appendChild(context.stateApp.pixiApplication.canvas);
		}

		// to prevent that you can't scroll the page with touch on the canvas. https://github.com/pixijs/pixijs/issues/4824
		if (context.stateApp.pixiApplication && context.stateApp.pixiApplication.renderer) {
			context.stateApp.pixiApplication.renderer.events.autoPreventDefault = false;
			if (context.stateApp.pixiApplication.renderer.canvas) {
				context.stateApp.pixiApplication.renderer.canvas.style.touchAction = 'auto';
			}
		}
	};

	onMount(async () => {
		try {
			if (!initialised) await initialiseApplication();
			initialised = true;
		} catch (error) {
			console.error('PIXI Application initialization failed:', error);
		}
	});

	onDestroy(() => {
		if (context.stateApp.pixiApplication) {
			context.stateApp.pixiApplication.destroy();
		}
	});
</script>

<div bind:this={wrap}>
	{#if initialised}
		{@render props.children()}
	{/if}
</div>
