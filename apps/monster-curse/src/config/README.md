# Symbol Configuration System

This directory contains the configuration-driven system for managing symbol backgrounds, layers, and animations.

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
      key: 'BG.png',
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
  animations: [
    {
      type: 'win_glow',
      duration: 1000,
      triggerStates: ['win'],
      affectedLayers: ['myNewSymbol.png'],
      properties: {
        scale: { from: 1.0, to: 1.2 },
      },
      easing: 'easeInOut',
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

### Animation Configuration

Each animation supports:
- **type**: Unique animation identifier
- **duration**: Animation length in milliseconds
- **triggerStates**: States that start this animation
- **affectedLayers**: Layers to animate
- **properties**: Animation effects (scale, fade)
- **loop**: Whether to loop the animation
- **easing**: Easing function type

## Benefits

1. **Centralized Configuration**: All symbol definitions in one place
2. **Reusable System**: Same code handles all symbols
3. **Easy Maintenance**: Add new symbols/animations without code changes
4. **Type Safety**: Full TypeScript support
5. **Flexible Layering**: Support for complex multi-layer symbols
6. **Animation System**: Configurable animations for any symbol

## Integration

The system integrates with:
- `SymbolComposite.svelte` - Renders configured symbols
- `AnimationSystem.ts` - Handles all animations
- Symbol utilities and game logic

## Example Configurations

### Simple Symbol (Basic Background)
```typescript
h2: {
  symbolId: 'h2',
  baseSprite: 'h2.png',
  backgroundLayers: [
    { key: 'BG.png', sizeMultiplier: 1.0, alwaysVisible: true, zIndex: 1 }
  ],
  animations: [],
}
```

### Complex Symbol (Multiple Layers + Animations)
```typescript
h1: {
  symbolId: 'h1',
  baseSprite: 'h1.png',
  backgroundLayers: [
    { key: 'BG.png', sizeMultiplier: 1.0, alwaysVisible: true, zIndex: 1 },
    { key: 'h1_bg2.png', sizeMultiplier: 1.0, alwaysVisible: true, zIndex: 2 },
  ],
  animations: [
    {
      type: 'win_pulse',
      duration: 1600,
      triggerStates: ['win'],
      affectedLayers: ['h1.png', 'h1_bg2.png'],
      properties: { scale: { from: 1.0, to: 1.6 } },
      easing: 'easeInOut',
    },
  ],
}
```
