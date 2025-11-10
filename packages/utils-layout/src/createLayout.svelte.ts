import { innerWidth, innerHeight } from 'svelte/reactivity/window';

type Sizes = { width: number; height: number };

const CANVAS_RATIO_TYPE_BREAK_POINTS = {
	wideSquare: 1.3, // Min ratio of long width canvas, used for position FS UI elements
	narrowSquare: 0.8, // GALAXY FOLD EXPAND RATIO IS 1.400390625
};

const CANVAS_SIZE_TYPE_BREAK_POINTS = {
	smallMobile: 375, // Max size of small mobile layouts e.g. iPhone SE
	mobile: 480, // Max size of common mobile layouts e.g. iPhone XR
	tablet: 820, // Max size of tablets layouts, e.g. iPad Air
	largeTablet: 1024, // Max size of large tablets layouts, e.g. iPad Pro
};

const getRatio = (value: Sizes) => value.width / (value.height || 1);

const STANDARD_MAIN_SIZES_MAP = {
	desktop: { width: 1920, height: 1080 },
	tablet: { width: 1920, height: 1920 },
	landscape: { width: 1920, height: 1080 },
	portrait: { width: 1080, height: 1920 },
};

type MainSizesMap = typeof STANDARD_MAIN_SIZES_MAP;

export const createLayout = (layoutOptions: {
	backgroundRatio: {
		normal: number;
		portrait: number;
	};
	mainSizesMap: MainSizesMap;
}) => {
	const canvasSizes = () => ({ width: innerWidth.current ?? 1, height: innerHeight.current ?? 1 }); // because of resizeTo: window
	const canvasRatio = () => getRatio(canvasSizes());
	const canvasRatioType = () => {
		const ratio = canvasRatio();
		const sizes = canvasSizes();
		// console.log('🎮 [DEBUG] Screen Analysis:');
		// console.log(`   📐 Dimensions: ${sizes.width}x${sizes.height}px`);
		// console.log(`   📏 Aspect Ratio: ${ratio.toFixed(3)}`);

		if (ratio >= CANVAS_RATIO_TYPE_BREAK_POINTS.wideSquare) {
			// console.log(`   📱 Ratio Type: longWidth (≥${CANVAS_RATIO_TYPE_BREAK_POINTS.wideSquare})`);
			return 'longWidth' as const;
		}
		if (ratio <= CANVAS_RATIO_TYPE_BREAK_POINTS.narrowSquare) {
			// console.log(`   📱 Ratio Type: longHeight (≤${CANVAS_RATIO_TYPE_BREAK_POINTS.narrowSquare})`);
			return 'longHeight' as const;
		}
		// console.log(`   📱 Ratio Type: almostSquare (${CANVAS_RATIO_TYPE_BREAK_POINTS.narrowSquare} < ratio < ${CANVAS_RATIO_TYPE_BREAK_POINTS.wideSquare})`);
		return 'almostSquare' as const;
	};
	const canvasSizeType = () => {
		const deviceWidth = Math.min(canvasSizes().width, canvasSizes().height);
		// console.log(`   📏 Smaller dimension: ${deviceWidth}px`);

		if (deviceWidth <= CANVAS_SIZE_TYPE_BREAK_POINTS.smallMobile) {
			// console.log(`   📱 Size Type: smallMobile (≤${CANVAS_SIZE_TYPE_BREAK_POINTS.smallMobile}px)`);
			return 'smallMobile' as const;
		}
		if (deviceWidth <= CANVAS_SIZE_TYPE_BREAK_POINTS.mobile) {
			// console.log(`   📱 Size Type: mobile (≤${CANVAS_SIZE_TYPE_BREAK_POINTS.mobile}px)`);
			return 'mobile' as const;
		}
		if (deviceWidth <= CANVAS_SIZE_TYPE_BREAK_POINTS.tablet) {
			// console.log(`   📱 Size Type: tablet (${CANVAS_SIZE_TYPE_BREAK_POINTS.mobile + 1}px - ${CANVAS_SIZE_TYPE_BREAK_POINTS.tablet}px)`);
			return 'tablet' as const;
		}
		if (deviceWidth <= CANVAS_SIZE_TYPE_BREAK_POINTS.largeTablet) {
			// console.log(`   📱 Size Type: largeTablet (≤${CANVAS_SIZE_TYPE_BREAK_POINTS.largeTablet}px)`);
			return 'largeTablet' as const;
		}
		// console.log(`   📱 Size Type: desktop (>${CANVAS_SIZE_TYPE_BREAK_POINTS.largeTablet}px)`);
		return 'desktop' as const;
	};
	const layoutType = () => {
		const ratioType = canvasRatioType();
		const sizeType = canvasSizeType();

		let layout: 'tablet' | 'portrait' | 'landscape' | 'desktop';

		if (ratioType === 'almostSquare') {
			layout = 'tablet';
			// console.log('   🎮 Final Layout: TABLET (almostSquare ratio)');
		} else if (ratioType === 'longHeight') {
			layout = 'portrait';
			// console.log('   🎮 Final Layout: PORTRAIT (longHeight ratio)');
		} else if (sizeType === 'mobile' || sizeType === 'smallMobile') {
			layout = 'landscape';
			// console.log('   🎮 Final Layout: LANDSCAPE (mobile/smallMobile size)');
		} else {
			layout = 'desktop';
			// console.log('   🎮 Final Layout: DESKTOP (default)');
		}

		// console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		return layout as const;
	};
	const isStacked = () => ['portrait', 'almostSquare'].includes(layoutType());

	const createMainLayout = (mainSizesMap: MainSizesMap) => () => {
		const x = canvasSizes().width * 0.5;
		const y = canvasSizes().height * 0.5;
		const mainSizes = mainSizesMap[layoutType()];
		const widthScale = canvasSizes().width / mainSizes.width;
		const heightScale = canvasSizes().height / mainSizes.height;
		const scale = Math.min(widthScale, heightScale);

		return {
			x,
			y,
			scale,
			width: mainSizes.width,
			height: mainSizes.height,
			anchor: 0.5,
		};
	};

	const mainLayout = createMainLayout(layoutOptions.mainSizesMap);

	const mainLayoutStandard = createMainLayout(STANDARD_MAIN_SIZES_MAP);

	const createBackgroundLayout = ({ scale, ratio }: { scale: number; ratio: number }) => {
		const canvasRatio = getRatio(canvasSizes());

		if (canvasRatio < ratio) {
			return {
				x: canvasSizes().width / 2,
				y: canvasSizes().height / 2,
				height: canvasSizes().height * scale,
			};
		}

		return {
			x: canvasSizes().width / 2,
			y: canvasSizes().height / 2,
			width: canvasSizes().width * scale,
		};
	};

	const normalBackgroundLayout = ({ scale }: { scale: number }) =>
		createBackgroundLayout({ scale, ratio: layoutOptions.backgroundRatio.normal });
	const portraitBackgroundLayout = ({ scale }: { scale: number }) =>
		createBackgroundLayout({ scale, ratio: layoutOptions.backgroundRatio.portrait });

	const stateLayout = $state({
		showLoadingScreen: true,
	});

	const stateLayoutDerived = {
		canvasSizes,
		canvasRatio,
		canvasRatioType,
		canvasSizeType,
		layoutType,
		isStacked,
		mainLayout,
		mainLayoutStandard,
		normalBackgroundLayout,
		portraitBackgroundLayout,
	};

	return {
		stateLayout,
		stateLayoutDerived,
	};
};
