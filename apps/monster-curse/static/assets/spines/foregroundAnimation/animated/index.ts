import { createAsset } from 'pixi-svelte';

import img from './runes.png';
import rawAtlas from './mm_bg_animated.atlas?raw';
import spine from './mm_bg_animated.json';

export default createAsset({ 
  img, 
  rawAtlas, 
  spine, 
  preload: true 
});
