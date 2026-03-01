/**
 * Memory leak debugging utilities for Monster Curse game
 * 
 * Usage:
 * - Call trackComponent() in onMount/onDestroy to track component lifecycle
 * - Call trackAnimation() when creating animations
 * - Call logMemorySnapshot() periodically (e.g., every 10 spins)
 * - Call getMemoryReport() to see current state
 */

interface ComponentTracker {
	name: string;
	mounted: number;
	unmounted: number;
	instances: Set<string>;
}

interface AnimationTracker {
	component: string;
	active: number;
	total: number;
}

class MemoryDebugger {
	private components = new Map<string, ComponentTracker>();
	private animations = new Map<string, AnimationTracker>();
	private spinCount = 0;
	private textureCount = 0;
	private enabled = false;

	constructor() {
		// Disabled by default - can be enabled via console: window.memoryDebugger.enable()
		// or via URL parameter: ?debugMemory=true
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			this.enabled = params.get('debugMemory') === 'true';
		}
	}

	isEnabled(): boolean {
		return this.enabled;
	}

	enable(): void {
		this.enabled = true;
		console.log('[MemoryDebug] Memory debugging enabled');
	}

	disable(): void {
		this.enabled = false;
	}

	/**
	 * Track component mount/unmount lifecycle
	 */
	trackComponent(componentName: string, instanceId: string, action: 'mount' | 'unmount'): void {
		if (!this.enabled) return;

		if (!this.components.has(componentName)) {
			this.components.set(componentName, {
				name: componentName,
				mounted: 0,
				unmounted: 0,
				instances: new Set(),
			});
		}

		const tracker = this.components.get(componentName)!;

		if (action === 'mount') {
			tracker.mounted++;
			tracker.instances.add(instanceId);
			console.log(`[MemoryDebug] 📦 ${componentName} mounted (${instanceId}). Active: ${tracker.instances.size}, Total mounted: ${tracker.mounted}`);
		} else {
			tracker.unmounted++;
			tracker.instances.delete(instanceId);
			console.log(`[MemoryDebug] 📦 ${componentName} unmounted (${instanceId}). Active: ${tracker.instances.size}, Total unmounted: ${tracker.unmounted}`);
		}
	}

	/**
	 * Track animation frame creation/cleanup
	 */
	trackAnimation(componentName: string, action: 'create' | 'cleanup'): void {
		if (!this.enabled) return;

		if (!this.animations.has(componentName)) {
			this.animations.set(componentName, {
				component: componentName,
				active: 0,
				total: 0,
			});
		}

		const tracker = this.animations.get(componentName)!;

		if (action === 'create') {
			tracker.active++;
			tracker.total++;
			console.log(`[MemoryDebug] 🎬 ${componentName} animation started. Active: ${tracker.active}, Total: ${tracker.total}`);
		} else {
			tracker.active--;
			console.log(`[MemoryDebug] 🎬 ${componentName} animation cleaned up. Active: ${tracker.active}`);
			
			if (tracker.active < 0) {
				console.warn(`[MemoryDebug] ⚠️ ${componentName} has negative active animations! This indicates a cleanup issue.`);
			}
		}
	}

	/**
	 * Track texture creation
	 */
	trackTexture(componentName: string, action: 'create' | 'destroy'): void {
		if (!this.enabled) return;

		if (action === 'create') {
			this.textureCount++;
			console.log(`[MemoryDebug] 🖼️ ${componentName} texture created. Total textures: ${this.textureCount}`);
		} else {
			this.textureCount--;
			console.log(`[MemoryDebug] 🖼️ ${componentName} texture destroyed. Total textures: ${this.textureCount}`);
		}
	}

	/**
	 * Increment spin counter and log memory snapshot every N spins
	 */
	incrementSpin(interval: number = 10): void {
		if (!this.enabled) return;

		this.spinCount++;

		if (this.spinCount % interval === 0) {
			this.logMemorySnapshot();
		}
	}

	/**
	 * Log current memory snapshot
	 */
	logMemorySnapshot(): void {
		if (!this.enabled) return;

		console.group(`[MemoryDebug] 📊 Memory Snapshot - Spin ${this.spinCount}`);
		
		// Log browser memory if available
		if (typeof performance !== 'undefined' && (performance as any).memory) {
			const memory = (performance as any).memory;
			console.log('Browser Memory:', {
				usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
				totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
				jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
				usage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)}%`,
			});
		}

		// Log component statistics
		console.log('\nComponent Lifecycle:');
		console.table(
			Array.from(this.components.values()).map((c) => ({
				Component: c.name,
				Active: c.instances.size,
				Mounted: c.mounted,
				Unmounted: c.unmounted,
				Leaked: c.mounted - c.unmounted - c.instances.size,
			})),
		);

		// Log animation statistics
		if (this.animations.size > 0) {
			console.log('\nAnimation Frames:');
			console.table(
				Array.from(this.animations.values()).map((a) => ({
					Component: a.component,
					Active: a.active,
					Total: a.total,
				})),
			);

			// Check for leaked animations
			const leakedAnimations = Array.from(this.animations.values()).filter((a) => a.active > 0);
			if (leakedAnimations.length > 0) {
				console.warn('⚠️ Potentially leaked animations:', leakedAnimations);
			}
		}

		// Log texture count
		console.log(`\nTotal Textures: ${this.textureCount}`);

		console.groupEnd();
	}

	/**
	 * Get detailed memory report
	 */
	getMemoryReport(): {
		spinCount: number;
		textureCount: number;
		components: ComponentTracker[];
		animations: AnimationTracker[];
	} {
		return {
			spinCount: this.spinCount,
			textureCount: this.textureCount,
			components: Array.from(this.components.values()),
			animations: Array.from(this.animations.values()),
		};
	}

	/**
	 * Reset all tracking data
	 */
	reset(): void {
		this.components.clear();
		this.animations.clear();
		this.spinCount = 0;
		this.textureCount = 0;
		console.log('[MemoryDebug] Memory tracking data reset');
	}
}

// Export singleton instance
export const memoryDebugger = new MemoryDebugger();

// Make it accessible from browser console for manual debugging
if (typeof window !== 'undefined') {
	(window as any).memoryDebugger = memoryDebugger;
}
