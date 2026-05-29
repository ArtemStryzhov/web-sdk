<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { memoryDebugger } from '../game/debugMemory';
	import { getContext } from '../game/context';

	const context = getContext();

	let stats = $state({
		spinCount: 0,
		activeAnimations: 0,
		activeComponents: 0,
		textureCount: 0,
		memoryMB: 0,
		heapUsagePct: 0,
		gpuTextures: 0,
		gpuSceneObjects: 0,
	});

	let updateInterval: number;

	onMount(() => {
		// Update stats every 2 seconds
		updateInterval = setInterval(() => {
			if (!memoryDebugger.isEnabled()) return;

			const report = memoryDebugger.getMemoryReport();
			
			// Calculate total active animations
			const totalAnimations = report.animations.reduce((sum, anim) => sum + anim.active, 0);
			
			// Calculate total active components
			const totalComponents = report.components.reduce((sum, comp) => sum + comp.instances.size, 0);
			
			// Get browser memory if available
			let memory = 0;
			if (typeof performance !== 'undefined' && (performance as any).memory) {
				memory = (performance as any).memory.usedJSHeapSize / 1048576; // Convert to MB
			}

			// Count GPU-managed textures via PixiJS renderer (tracks VRAM pressure)
			let gpuTextures = 0;
			let gpuSceneObjects = 0;
			try {
				const renderer = context.stateApp.pixiApplication?.renderer as any;
				if (renderer) {
					// PixiJS v8: renderer.texture tracks all GPU-uploaded textures
					gpuTextures = renderer.texture?.managedTextures?.length ?? 0;
					// Count total display objects in the scene graph
					const countObjects = (container: any): number => {
						let n = 1;
						if (container.children) for (const c of container.children) n += countObjects(c);
						return n;
					};
					gpuSceneObjects = countObjects(context.stateApp.pixiApplication?.stage);
				}
			} catch (_) { /* renderer internals not always available */ }

			stats = {
				spinCount: report.spinCount,
				activeAnimations: totalAnimations,
				activeComponents: totalComponents,
				textureCount: report.textureCount,
				memoryMB: memory,
				heapUsagePct: report.heapUsagePct,
				gpuTextures,
				gpuSceneObjects,
			};
		}, 2000);
	});

	onDestroy(() => {
		if (updateInterval) {
			clearInterval(updateInterval);
		}
	});
</script>

{#if memoryDebugger.isEnabled()}
	<div class="memory-debug-overlay">
		<div class="debug-title">🔍 Memory Debug</div>
		<div class="debug-stat">
			<span class="label">Spins:</span>
			<span class="value">{stats.spinCount}</span>
		</div>
		<div class="debug-stat">
			<span class="label">Animations:</span>
			<span class="value" class:warning={stats.activeAnimations > 10}>
				{stats.activeAnimations}
			</span>
		</div>
		<div class="debug-stat">
			<span class="label">Components:</span>
			<span class="value">{stats.activeComponents}</span>
		</div>
		<div class="debug-stat">
			<span class="label">Textures:</span>
			<span class="value" class:warning={stats.textureCount > 5}>
				{stats.textureCount}
			</span>
		</div>
		{#if stats.memoryMB > 0}
			<div class="debug-stat">
				<span class="label">Heap:</span>
				<span class="value" class:warning={stats.memoryMB > 200}>
					{stats.memoryMB.toFixed(1)} MB
				</span>
			</div>
		{/if}
		{#if stats.heapUsagePct > 0}
			<div class="debug-stat">
				<span class="label">Heap %:</span>
				<span class="value" class:warning={stats.heapUsagePct > 60} class:critical={stats.heapUsagePct > 80}>
					{stats.heapUsagePct.toFixed(1)}%
				</span>
			</div>
		{/if}
		<div class="debug-stat">
			<span class="label">GPU tex:</span>
			<span class="value" class:warning={stats.gpuTextures > 80} class:critical={stats.gpuTextures > 150}>
				{stats.gpuTextures}
			</span>
		</div>
		<div class="debug-stat">
			<span class="label">Scene obj:</span>
			<span class="value" class:warning={stats.gpuSceneObjects > 500} class:critical={stats.gpuSceneObjects > 1000}>
				{stats.gpuSceneObjects}
			</span>
		</div>
		<div class="debug-footer">
			Press F12 for details
		</div>
	</div>
{/if}

<style>
	.memory-debug-overlay {
		position: fixed;
		top: 10px;
		left: 10px;
		background: rgba(0, 0, 0, 0.85);
		color: #00ff00;
		padding: 12px 16px;
		border-radius: 8px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		z-index: 999999;
		min-width: 180px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(0, 255, 0, 0.3);
	}

	.debug-title {
		font-weight: bold;
		font-size: 14px;
		margin-bottom: 8px;
		border-bottom: 1px solid rgba(0, 255, 0, 0.3);
		padding-bottom: 6px;
		text-align: center;
	}

	.debug-stat {
		display: flex;
		justify-content: space-between;
		margin: 4px 0;
		padding: 2px 0;
	}

	.label {
		color: #888;
		margin-right: 8px;
	}

	.value {
		font-weight: bold;
		color: #00ff00;
		text-align: right;
	}

	.value.warning {
		color: #ff9900;
		animation: pulse 1s ease-in-out infinite;
	}

	.value.critical {
		color: #ff3333;
		animation: pulse 0.5s ease-in-out infinite;
	}

	.debug-footer {
		margin-top: 8px;
		padding-top: 6px;
		border-top: 1px solid rgba(0, 255, 0, 0.3);
		font-size: 10px;
		color: #666;
		text-align: center;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}
</style>
