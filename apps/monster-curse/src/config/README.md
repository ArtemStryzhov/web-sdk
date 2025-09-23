# Symbol Configuration System

This directory contains the configuration-driven system for managing symbol backgrounds and layers.

## Overview

The system provides a clean, scalable way to define:
- **Background layers** for each symbol
- **Layer ordering** and properties
- **Animation configurations** 
- **State-based visibility** rules

## Files

### `symbolConfig.ts`
Main configuration file containing:
- `SymbolConfig` interface - Complete symbol definition
- `LayerConfig` interface - Individual layer properties  
- `AnimationConfig` interface - Animation definitions
- `SYMBOL_CONFIGS` object - All symbol configurations
- Helper functions for accessing configurations

## Usage

### Adding a New Symbol

1. **Add symbol configuration** to `SYMBOL_CONFIGS`:
```typescript
myNewSymbol: {
  symbolId: 'myNewSymbol',
  baseSprite: 'myNewSymbol.png',
  backgroundLayers: [
    {
      key: 'bg_stone.png',
      sizeMultiplier: 1.0,
      alwaysVisible: true,
      zIndex: 1,
    },
    {
      key: 'myNewSymbol_bg.png',
      sizeMultiplier: 0.8,
      alwaysVisible: false,
      visibleInStates: ['win'],
      zIndex: 2,
    },
  ],
  supportsScatter: false,
}
```

### Layer Configuration

Each layer supports:
- **key**: Sprite asset key
- **sizeMultiplier**: Size relative to SYMBOL_SIZE
- **alwaysVisible**: Always show this layer
- **visibleInStates**: Show only in specific states
- **zIndex**: Layer ordering (lower = behind)
- **alpha**: Optional transparency

### Symbol Properties

#### `supportsScatter`
**Type**: `boolean` (optional)  
**Default**: `false`  
**Description**: Indicates whether this symbol supports scatter-based gameplay mechanics.

When `supportsScatter` is `true`, the symbol may participate in scatter-specific behaviors such as:
- Special rendering modes (e.g., no background layers)
- Scatter collection mechanics
- Unique animation sequences
- Alternative win conditions

**Current Usage**: All symbols currently have `supportsScatter: false`. This property is reserved for future scatter-based game features.

**Example**:
```typescript
// Regular symbol (no scatter support)
h1: {
  symbolId: 'h1',
  baseSprite: 'h1.png',
  backgroundLayers: [...],
  supportsScatter: false,  // Default - participates in normal gameplay
}

// Scatter-enabled symbol (future feature)
scatterSymbol: {
  symbolId: 'scatterSymbol',
  baseSprite: 'scatterSymbol.png',
  backgroundLayers: [...],
  supportsScatter: true,   // Enables scatter-specific behaviors
}
```

## Benefits

1. **Centralized Configuration**: All symbol definitions in one place
2. **Reusable System**: Same code handles all symbols
3. **Easy Maintenance**: Add new symbols without code changes
4. **Type Safety**: Full TypeScript support
5. **Flexible Layering**: Support for complex multi-layer symbols

## Integration

The system integrates with:
- `SymbolComposite.svelte` - Renders configured symbols with background layers
- Pixi Spine animations - Handles all symbol animations
- Symbol utilities and game logic

### Background Layer Rendering

Background layers are now **fully implemented** and rendered in `SymbolComposite.svelte`:
- Layers are sorted by `zIndex` (lower = behind)
- Only rendered for non-scatter symbols
- Support transparency with `alpha` property
- Scale with `sizeMultiplier`
- Positioned behind main symbol (zIndex < 10)

## Example Configurations

### Simple Symbol (Basic Background)
```typescript
h2: {
  symbolId: 'h2',
  baseSprite: 'h2.png',
  backgroundLayers: [
    { key: 'bg_stone.png', sizeMultiplier: 1.0, alwaysVisible: true, zIndex: 1 }
  ],
}
```

### Complex Symbol (Multiple Layers)
```typescript
h1: {
  symbolId: 'h1',
  baseSprite: 'h1.png',
  backgroundLayers: [
    { key: 'bg_stone.png', sizeMultiplier: 1.0, alwaysVisible: true, zIndex: 1 },
    { key: 'electric_cloud_pink.png', sizeMultiplier: 1.0, alwaysVisible: true, zIndex: 2 },
  ],
}
```
