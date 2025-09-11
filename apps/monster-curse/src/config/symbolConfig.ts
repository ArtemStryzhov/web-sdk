/**
 * Symbol Configuration System
 * 
 * This file defines the configuration for all symbols including:
 * - Background layers and their properties
 * - Animation configurations
 * - Layer ordering and sizing
 */

export interface LayerConfig {
	/** The sprite key for this layer */
	key: string;
	/** Size multiplier relative to SYMBOL_SIZE */
	sizeMultiplier: number;
	/** Whether this layer is always visible */
	alwaysVisible: boolean;
	/** States where this layer should be visible (if not alwaysVisible) */
	visibleInStates?: string[];
	/** Z-index for layer ordering (lower = behind) */
	zIndex: number;
	/** Optional alpha value (0-1) */
	alpha?: number;
}

export interface AnimationConfig {
	/** Animation type identifier */
	type: string;
	/** Duration in milliseconds */
	duration: number;
	/** States that trigger this animation */
	triggerStates: string[];
	/** Layers affected by this animation */
	affectedLayers: string[];
	/** Animation properties */
	properties: {
		/** Scale animation from/to values */
		scale?: {
			from: number;
			to: number;
			/** Layers to apply scaling to */
			layers?: string[];
			/** Custom duration for scale animation */
			duration?: number;
		};
		/** Alpha/fade animation */
		fade?: {
			from: number;
			to: number;
			/** Layers to apply fade to */
			layers?: string[];
			/** Custom duration for fade animation */
			duration?: number;
		};
	};
	/** Custom durations per layer (overrides default duration) */
	layerDurations?: Record<string, number>;
	/** Whether animation should loop */
	loop?: boolean;
	/** Easing function type */
	easing?: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
}

export interface SymbolConfig {
	/** Symbol identifier (e.g., 'h1', 'h2', etc.) */
	symbolId: string;
	/** Base sprite key for the main symbol */
	baseSprite: string;
	/** Background layers configuration */
	backgroundLayers: LayerConfig[];
	/** Animation configurations */
	animations: AnimationConfig[];
	/** Whether this symbol supports scatter mode */
	supportsScatter?: boolean;
}

/**
 * Configuration for all symbols
 */
export const SYMBOL_CONFIGS: Record<string, SymbolConfig> = {
	h1: {
		symbolId: 'h1',
		baseSprite: 'h1.png',
		backgroundLayers: [
			{
				key: 'BG.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
			{
				key: 'h1_bg2.png',// pink cloud
				sizeMultiplier: 1,
				alwaysVisible: true,
				zIndex: 2,
			},
			{
				key: 'h1_bg3.png', //ring
				sizeMultiplier: 1.0,
				alwaysVisible: false,
				visibleInStates: ['win'],
				zIndex: 4,
				alpha: 0,
			},
			{
				key: 'h1_bg4.png', //square
				sizeMultiplier: 1.5,
				alwaysVisible: false,
				visibleInStates: ['win'],
				zIndex: 5,
				alpha: 0,
			},
		],
		animations: [
			{
				type: 'h1_win_animation',
				duration: 3000, // Total animation duration
				triggerStates: ['win'],
				affectedLayers: ['h1_bg2.png', 'h1_bg3.png', 'h1_bg4.png'],
				properties: {
					scale: {
						from: 1.0,
						to: 1.5,
						layers: ['h1_bg2.png'],
						duration: 2000, // h1_bg2 scaling takes 2 seconds
					},
					fade: {
						from: 0.0,
						to: 1.0,
						layers: ['h1_bg3.png', 'h1_bg4.png'],
					},
				},
				layerDurations: {
					'h1_bg2.png': 2300, // 2 second duration for scaling
					'h1_bg3.png': 2400, // 2 second duration for fade
					'h1_bg4.png': 3000, // 3 second duration for extended fade
				},
				easing: 'easeInOut',
				loop: true,
			},
		],
		supportsScatter: false,
	},
	h2: {
		symbolId: 'h2',
		baseSprite: 'h2.png',
		backgroundLayers: [
			{
				key: 'BG.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		animations: [],
		supportsScatter: false,
	},
	h3: {
		symbolId: 'h3',
		baseSprite: 'h3.png',
		backgroundLayers: [
			{
				key: 'BG.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		animations: [],
		supportsScatter: false,
	},
	h4: {
		symbolId: 'h4',
		baseSprite: 'h4.png',
		backgroundLayers: [
			{
				key: 'BG.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		animations: [],
		supportsScatter: false,
	},
	h5: {
		symbolId: 'h5',
		baseSprite: 'h5.png',
		backgroundLayers: [
			{
				key: 'BG.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		animations: [],
		supportsScatter: false,
	},
	l1: {
		symbolId: 'l1',
		baseSprite: 'l1.png',
		backgroundLayers: [
			{
				key: 'BG.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		animations: [],
		supportsScatter: false,
	},
	l2: {
		symbolId: 'l2',
		baseSprite: 'l2.png',
		backgroundLayers: [
			{
				key: 'BG.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		animations: [],
		supportsScatter: false,
	},
	l3: {
		symbolId: 'l3',
		baseSprite: 'l3.png',
		backgroundLayers: [
			{
				key: 'BG.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		animations: [],
		supportsScatter: false,
	},
	l4: {
		symbolId: 'l4',
		baseSprite: 'l4.png',
		backgroundLayers: [
			{
				key: 'BG.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		animations: [],
		supportsScatter: false,
	},
};

/**
 * Get symbol configuration by symbol name
 */
export function getSymbolConfig(symbolName: string): SymbolConfig | null {
	const symbolId = symbolName.toLowerCase();
	return SYMBOL_CONFIGS[symbolId] || null;
}

/**
 * Get all layers for a symbol sorted by z-index
 */
export function getSymbolLayers(symbolName: string, currentState: string): LayerConfig[] {
	const config = getSymbolConfig(symbolName);
	if (!config) return [];

	return config.backgroundLayers
		.filter(layer => {
			if (layer.alwaysVisible) return true;
			if (layer.visibleInStates) {
				return layer.visibleInStates.includes(currentState);
			}
			return false;
		})
		.sort((a, b) => a.zIndex - b.zIndex);
}

/**
 * Get animations that should trigger for a given state
 */
export function getActiveAnimations(symbolName: string, currentState: string): AnimationConfig[] {
	const config = getSymbolConfig(symbolName);
	if (!config) return [];

	return config.animations.filter(animation =>
		animation.triggerStates.includes(currentState)
	);
}
