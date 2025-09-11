/**
 * Generic Animation System
 * 
 * Handles all symbol animations based on configuration
 */

import type { AnimationConfig } from '../config/symbolConfig';

export interface AnimationState {
	[layerKey: string]: {
		scale: number;
		alpha: number;
		visible: boolean;
	};
}

export interface EasingFunction {
	(t: number): number;
}

/**
 * Easing functions
 */
export const EASING_FUNCTIONS: Record<string, EasingFunction> = {
	linear: (t: number) => t,
	easeInOut: (t: number) => {
		if (t < 0.5) {
			return 4 * t * t * t;
		} else {
			const f = ((2 * t) - 2);
			return 0.5 * f * f * f + 1;
		}
	},
	easeIn: (t: number) => t * t * t,
	easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
};

export class AnimationSystem {
	private animationId: number | null = null;
	private currentAnimations: Map<string, AnimationConfig> = new Map();
	private animationStates: Map<string, any> = new Map();

	constructor(
		private updateCallback: (layerKey: string, state: any) => void
	) {}

	/**
	 * Start an animation
	 */
	public startAnimation(animationConfig: AnimationConfig, layerStates: AnimationState): void {
		// Stop any existing animation of the same type
		this.stopAnimation(animationConfig.type);

		const startTime = Date.now();
		const easingFn = EASING_FUNCTIONS[animationConfig.easing || 'linear'];

		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / animationConfig.duration, 1);
			const easedProgress = easingFn(progress);


			// Apply animation to affected layers with per-layer timing
			animationConfig.affectedLayers.forEach(layerKey => {
				const currentState = layerStates[layerKey];
				if (!currentState) {
					return;
				}

				// Get layer-specific duration or use default
				const layerDuration = animationConfig.layerDurations?.[layerKey] || animationConfig.duration;
				const layerProgress = Math.min(elapsed / layerDuration, 1);
				const layerEasedProgress = easingFn(layerProgress);

				let newState = { ...currentState };

				// Apply scale animation (bidirectional: scale up then back down)
				if (animationConfig.properties.scale) {
					const { from, to, layers } = animationConfig.properties.scale;
					if (!layers || layers.includes(layerKey)) {
						let scaleValue;
						if (layerEasedProgress <= 0.5) {
							// First half: scale up
							const halfProgress = layerEasedProgress * 2;
							scaleValue = from + (to - from) * halfProgress;
						} else {
							// Second half: scale back down
							const halfProgress = (layerEasedProgress - 0.5) * 2;
							scaleValue = to - (to - from) * halfProgress;
						}
						newState.scale = scaleValue;
					}
				}

				// Apply fade animation with special sequenced timing for h1_bg4
				if (animationConfig.properties.fade) {
					const { from, to, layers } = animationConfig.properties.fade;
					if (!layers || layers.includes(layerKey)) {
						let alphaValue;
						
						if (layerKey === 'h1_bg4.png') {
							// Special sequenced timing for h1_bg4:
							// - Fade in first 500ms (0-500ms)
							// - Stay visible during middle 2000ms (500-2500ms)
							// - Fade out last 500ms (2500-3000ms)
							if (elapsed < 500) {
								// Fade in phase
								const fadeInProgress = elapsed / 500;
								alphaValue = from + (to - from) * easingFn(fadeInProgress);
							} else if (elapsed < 2500) {
								// Stay visible phase
								alphaValue = to;
							} else {
								// Fade out phase
								const fadeOutProgress = (elapsed - 2500) / 500;
								alphaValue = to - (to - from) * easingFn(fadeOutProgress);
							}
						} else {
							// Standard bidirectional fade for other layers (h1_bg3, etc.)
							if (layerEasedProgress <= 0.5) {
								// First half: fade in
								const halfProgress = layerEasedProgress * 2;
								alphaValue = from + (to - from) * halfProgress;
							} else {
								// Second half: fade out
								const halfProgress = (layerEasedProgress - 0.5) * 2;
								alphaValue = to - (to - from) * halfProgress;
							}
						}
						
						newState.alpha = Math.max(0, Math.min(1, alphaValue));
						newState.visible = newState.alpha > 0.01; // Small threshold to avoid flickering
					}
				}

				// Update the layer state
				layerStates[layerKey] = newState;
				this.updateCallback(layerKey, newState);
			});

			if (progress < 1) {
				this.animationId = requestAnimationFrame(animate);
			} else {
				// Animation completed
				this.onAnimationComplete(animationConfig, layerStates);
			}
		};

		this.currentAnimations.set(animationConfig.type, animationConfig);
		this.animationId = requestAnimationFrame(animate);
	}

	/**
	 * Stop a specific animation
	 */
	public stopAnimation(animationType: string): void {
		if (this.animationId && this.currentAnimations.has(animationType)) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
			this.currentAnimations.delete(animationType);
		}
	}

	/**
	 * Stop all animations
	 */
	public stopAllAnimations(): void {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
		this.currentAnimations.clear();
	}

	/**
	 * Handle animation completion
	 */
	private onAnimationComplete(animationConfig: AnimationConfig, layerStates: AnimationState): void {
		// Reset to initial state or handle looping
		if (animationConfig.loop) {
			// Restart the animation
			setTimeout(() => {
				this.startAnimation(animationConfig, layerStates);
			}, 500); // Small delay before restarting
		} else {
			// Reset affected layers to their default state
			animationConfig.affectedLayers.forEach(layerKey => {
				const currentState = layerStates[layerKey];
				if (currentState) {
					layerStates[layerKey] = {
						...currentState,
						scale: 1,
						alpha: currentState.visible ? 1 : 0,
					};
					this.updateCallback(layerKey, layerStates[layerKey]);
				}
			});
		}

		this.currentAnimations.delete(animationConfig.type);
	}

	/**
	 * Check if any animations are currently running
	 */
	public isAnimating(): boolean {
		return this.animationId !== null;
	}

	/**
	 * Get currently running animations
	 */
	public getCurrentAnimations(): string[] {
		return Array.from(this.currentAnimations.keys());
	}

	/**
	 * Destroy the animation system
	 */
	public destroy(): void {
		this.stopAllAnimations();
		this.animationStates.clear();
	}
}
