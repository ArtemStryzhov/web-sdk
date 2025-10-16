import { createLayout } from 'utils-layout';

export const { stateLayout, stateLayoutDerived } = createLayout({
	backgroundRatio: {
		normal: 2039 / 1000,
		portrait: 1242 / 2208,
	},
	mainSizesMap: {
		desktop: { width: 1422 * 1.15, height: 800 * 1.15 },
		tablet: { width: 1000, height: 1000 },
		landscape: { width: 1600 * 1.15, height: 900 * 1.15 },
		portrait: { width: 800, height: 1422 },
	},
});
