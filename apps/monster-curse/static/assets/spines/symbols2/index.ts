import { createAsset } from 'pixi-svelte';

import img from './symbols2.png';
import rawAtlas from './symbols2.atlas?raw';
import S from './S.json';

export default createAsset({
	img,
	rawAtlas,
	spines: {
		S,
	},
});
