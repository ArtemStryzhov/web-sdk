import { createAsset } from 'pixi-svelte';

import img from './symbolsAnimated.png';
import rawAtlas from './symbolsAnimated.atlas?raw';
import symbolsAnimated from './symbolsAnimated.json';

export default createAsset({
	img,
	rawAtlas,
	spines: {
		symbolsAnimated,
	},
});