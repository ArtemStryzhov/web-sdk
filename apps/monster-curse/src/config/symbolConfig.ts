/**
 * Symbol Configuration System
 *
 * This file defines the configuration for all symbols including:
 * - Background layers and their properties
 * - Layer ordering and sizing
 */

export interface LayerConfig {
	/** The sprite key for this layer (for static sprites) */
	key?: string;
	/** The spine asset key for animated layers */
	spineKey?: string;
	/** The spine animation name for animated layers */
	animationName?: string;
	/** Size multiplier relative to SYMBOL_SIZE */
	sizeMultiplier: number;
	/** Whether this layer is always visible */
	alwaysVisible?: boolean;
	/** States where this layer should be visible (if not alwaysVisible) */
	visibleInStates?: string[];
	/** Z-index for layer ordering (lower = behind) */
	zIndex: number;
	/** Optional alpha value (0-1) */
	alpha?: number;
	/** Whether to loop the animation */
	loop?: boolean;
}

export interface SymbolConfig {
	/** Symbol identifier (e.g., 'h1', 'h2', etc.) */
	symbolId: string;
	/** Base sprite key for the main symbol */
	baseSprite: string;
	/** Background layers configuration */
	backgroundLayers: LayerConfig[];
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
				key: 'bg_stone.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
			{
				spineKey: 'H1',
				animationName: 'tornado_pink_static',
				sizeMultiplier: 1.06,
				visibleInStates: ['static', 'spin', 'land', 'postWinStatic'],
				zIndex: 2,
			},
			{
				spineKey: 'H1',
				animationName: 'tornado_spin',
				sizeMultiplier: 0.5,
				visibleInStates: ['win'],
				zIndex: 4,
				loop: true,
			},
			{
				spineKey: 'symbolsAnimated',
				animationName: 'electric_cloud_spin',
				sizeMultiplier: 0.5,
				visibleInStates: ['win'],
				zIndex: 5,
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
				key: 'bg_stone.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
			{
				spineKey: 'H2',
				animationName: 'tornado_blue_static',
				sizeMultiplier: 1.06,
				visibleInStates: ['static', 'spin', 'land', 'postWinStatic'],
				zIndex: 2,
			},
			{
				spineKey: 'H2',
				animationName: 'tornado_spin',
				sizeMultiplier: 0.5,
				visibleInStates: ['win'],
				zIndex: 5,
				loop: true,
			},
		],
		supportsScatter: false,
	},
	h3: {
		symbolId: 'h3',
		baseSprite: 'h3.png',
		backgroundLayers: [
			{
				key: 'bg_stone.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
			{
				spineKey: 'H3',
				animationName: 'tornado_green_static',
				sizeMultiplier: 1.06,
				visibleInStates: ['static', 'spin', 'land', 'postWinStatic'],
				zIndex: 2,
			},
			{
				spineKey: 'H3',
				animationName: 'tornado_spin',
				sizeMultiplier: 0.5,
				visibleInStates: ['win'],
				zIndex: 5,
				loop: true,
			},
		],
		supportsScatter: false,
	},
	h4: {
		symbolId: 'h4',
		baseSprite: 'h4.png',
		backgroundLayers: [
			{
				key: 'bg_stone.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
			{
				spineKey: 'H4',
				animationName: 'tornado_blue_static',
				sizeMultiplier: 1.06,
				visibleInStates: ['static', 'spin', 'land', 'postWinStatic'],
				zIndex: 2,
			},
			{
				spineKey: 'H4',
				animationName: 'tornado_spin',
				sizeMultiplier: 0.5,
				visibleInStates: ['win'],
				zIndex: 5,
				loop: true,
			},
		],
		supportsScatter: false,
	},
	l1: {
		symbolId: 'l1',
		baseSprite: 'l1.png',
		backgroundLayers: [
			{
				key: 'bg_stone.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		supportsScatter: false,
	},
	l2: {
		symbolId: 'l2',
		baseSprite: 'l2.png',
		backgroundLayers: [
			{
				key: 'bg_stone.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		supportsScatter: false,
	},
	l3: {
		symbolId: 'l3',
		baseSprite: 'l3.png',
		backgroundLayers: [
			{
				key: 'bg_stone.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		supportsScatter: false,
	},
	l4: {
		symbolId: 'l4',
		baseSprite: 'l4.png',
		backgroundLayers: [
			{
				key: 'bg_stone.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		supportsScatter: false,
	},
	l5: {
		symbolId: 'l5',
		baseSprite: 'l5.png',
		backgroundLayers: [
			{
				key: 'bg_stone.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		supportsScatter: false,
	},
	w: {
		symbolId: 'w',
		baseSprite: 'w.png',
		backgroundLayers: [
			{
				key: 'bg_crystal.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
			{
				spineKey: 'symbolsAnimated',
				animationName: 'electric_cloud_pink_static',
				sizeMultiplier: 0.7,
				alwaysVisible: false,
				visibleInStates: ['static'],
				zIndex: 2,
				loop: false,
			},
			{
				spineKey: 'symbolsAnimated',
				animationName: 'electric_cloud_spin',
				sizeMultiplier: 0.7,
				visibleInStates: ['win'],
				zIndex: 5,
				loop: true,
			},
		],
		supportsScatter: false,
	},
	s: {
		symbolId: 's',
		baseSprite: 's.png',
		backgroundLayers: [
			{
				key: 'bg_crystal.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
		],
		supportsScatter: false,
	},
	b: {
		symbolId: 'b',
		baseSprite: 'b.png',
		backgroundLayers: [
			{
				key: 'bg_crystal.png',
				sizeMultiplier: 1.0,
				alwaysVisible: true,
				zIndex: 1,
			},
			{
				spineKey: 'symbolsAnimated',
				animationName: 'tornado_blue_static',
				sizeMultiplier: 0.7,
				alwaysVisible: false,
				visibleInStates: ['static'],
				zIndex: 2,
			},
			{
				spineKey: 'symbolsAnimated',
				animationName: 'tornado_blue_static',
				sizeMultiplier: 0.7,
				visibleInStates: ['win'],
				zIndex: 5,
				loop: false,
			},
		],
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

