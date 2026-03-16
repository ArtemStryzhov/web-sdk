export default {
	soundOn: {
		type: 'sprite',
		src: new URL('../../assets/sprites/sound-on.png', import.meta.url).href,
		preload: true,
	},
	soundOff: {
		type: 'sprite',
		src: new URL('../../assets/sprites/sound-off.png', import.meta.url).href,
		preload: true,
	},
	'sound-on-big': {
		type: 'sprite',
		src: new URL('../../assets/sprites/sound-on-big.png', import.meta.url).href,
		preload: true,
	},
	'sound-off-big': {
		type: 'sprite',
		src: new URL('../../assets/sprites/sound-off-big.png', import.meta.url).href,
		preload: true,
	},
	playButton: {
		type: 'sprite',
		src: new URL('../../assets/sprites/play.png', import.meta.url).href,
		preload: true,
	},
	stopButton: {
		type: 'sprite',
		src: new URL('../../assets/sprites/stop.png', import.meta.url).href,
		preload: true,
	},
	bgback: {
		type: 'sprite',
		src: new URL('../../assets/sprites/bgback.png', import.meta.url).href,
		preload: true,
	},
	plusEnabled: {
		type: 'sprite',
		src: new URL('../../assets/sprites/plus_enabled.png', import.meta.url).href,
		preload: true,
	},
	plusDisabled: {
		type: 'sprite',
		src: new URL('../../assets/sprites/plus_disabled.png', import.meta.url).href,
		preload: true,
	},
	minusEnabled: {
		type: 'sprite',
		src: new URL('../../assets/sprites/minus_enabled.png', import.meta.url).href,
		preload: true,
	},
	minusDisabled: {
		type: 'sprite',
		src: new URL('../../assets/sprites/minus_disabled.png', import.meta.url).href,
		preload: true,
	},
	info: {
		type: 'sprite',
		src: new URL('../../assets/sprites/info.png', import.meta.url).href,
		preload: true,
	},
	vector: {
		type: 'sprite',
		src: new URL('../../assets/sprites/vector.png', import.meta.url).href,
		preload: true,
	},
	'vector-gray': {
		type: 'sprite',
		src: new URL('../../assets/sprites/vector-gray.png', import.meta.url).href,
		preload: true,
	},
	// Common spritesheet sprites
	common: {
		type: 'sprites',
		src: new URL('../../assets/sprites/common/spritesheet.json', import.meta.url).href,
		preload: true,
	},
	stones: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/stones/stones.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/stones/stones.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	H1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h1.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	H2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h2.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	H3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h3.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	H4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/h4.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	L1: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l1.json', import.meta.url).href,
			scale: 2,
		},
	},
	L2: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l2.json', import.meta.url).href,
			scale: 2,
		},
	},
	L3: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l3.json', import.meta.url).href,
			scale: 2,
		},
	},
	L4: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l4.json', import.meta.url).href,
			scale: 2,
		},
	},
	L5: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/l5.json', import.meta.url).href,
			scale: 2,
		},
	},
	S: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols2/symbols2.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols2/S.json', import.meta.url).href,
			scale: 2,
		},
	},
	W: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/symbols/symbols.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/symbols/W.json', import.meta.url).href,
			scale: 2,
		},
	},
	B_animation: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/B_animation/symbols3.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/B_animation/B_animation.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	reelsFrame: {
		type: 'sprites',
		src: new URL('../../assets/sprites/reelsFrame/reels_frame.json', import.meta.url).href,
	},
	payFrame: {
		type: 'sprite',
		src: new URL('../../assets/sprites/payFrame/payFrame.png', import.meta.url).href,
	},
	anticipation: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/anticipation/anticipation.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/anticipation/anticipation.json', import.meta.url).href,
			scale: 2,
		},
	},
	goldFont: {
		type: 'font',
		src: new URL('../../assets/fonts/goldFont/mm_gold.xml', import.meta.url).href,
	},
	goldBlur: {
		type: 'font',
		src: new URL('../../assets/fonts/goldBlur/miningfont_gold_blur.xml', import.meta.url).href,
	},
	silverFont: {
		type: 'font',
		src: new URL('../../assets/fonts/silverFont/mm_silver.xml', import.meta.url).href,
	},
	purpleFont: {
		type: 'font',
		src: new URL('../../assets/fonts/purpleFont/mm_purple.xml', import.meta.url).href,
	},
	bigwin: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/bigwin/big_wins.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/bigwin/mm_bigwin.json', import.meta.url).href,
			scale: 2,
		},
	},
	// Static backgrounds for responsive layouts
	backgroundDesktop: {
		type: 'sprite',
		src: new URL('../../assets/spines/foregroundAnimation/background/desktop/background_desktop.jpg', import.meta.url).href,
		preload: true,
	},
	backgroundPortrait: {
		type: 'sprite',
		src: new URL('../../assets/spines/foregroundAnimation/background/portrait/background_portrait.png', import.meta.url).href,
		preload: true,
	},
	backgroundFeatureDesktop: {
		type: 'sprite', 
		src: new URL('../../assets/spines/foregroundFeatureAnimation/background/desktop/background_desktop.jpg', import.meta.url).href,
		preload: true,
	},
	backgroundFeaturePortrait: {
		type: 'sprite', 
		src: new URL('../../assets/spines/foregroundFeatureAnimation/background/portrait/background_portrait.png', import.meta.url).href,
		preload: true,
	},
	
	// Animated overlays (updated paths)
	foregroundAnimation: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/foregroundAnimation/animated/mm_bg_animated.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/foregroundAnimation/animated/mm_bg_animated.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	foregroundFeatureAnimation: {
		type: 'spine',
		src: {
			atlas: new URL('../../assets/spines/foregroundFeatureAnimation/animated/mm_bg_feature_animated.atlas', import.meta.url).href,
			skeleton: new URL('../../assets/spines/foregroundFeatureAnimation/animated/mm_bg_feature_animated.json', import.meta.url).href,
			scale: 2,
		},
		preload: true,
	},
	progressBar: {
		type: 'sprites',
		src: new URL('../../assets/sprites/progressBar/progressBar.json', import.meta.url).href,
		preload: true,
	},
	freeSpins: {
		type: 'sprites',
		src: new URL('../../assets/sprites/freeSpins/freeSpins.json', import.meta.url).href,
	},
	winSmall: {
		type: 'sprites',
		src: new URL('../../assets/sprites/winSmall/MM_Localisation_winsmall.json', import.meta.url).href,
	},
	symbolsStatic: {
		type: 'sprites',
		src: new URL('../../assets/sprites/symbolsStatic/symbolsStatic.json', import.meta.url).href,
	},
	coins: {
		type: 'spriteSheet',
		src: new URL('../../assets/sprites/coin/SD2_Coin.json', import.meta.url).href,
	},
	sound: {
		type: 'audio',
		src: new URL('../../assets/audio/sounds.json', import.meta.url).href,
		preload: true,
	},
	autospin_mob_default: {
		type: 'sprite',
		src: new URL('../../assets/sprites/autospin_mob_default.png', import.meta.url).href,
		preload: true,
	},
	autospin_mob_inactive: {
		type: 'sprite',
		src: new URL('../../assets/sprites/autospin_mob_inactive.png', import.meta.url).href,
		preload: true,
	},
	line_0: {
		type: 'sprite',
		src: new URL('../../assets/line_0.png', import.meta.url).href,
		preload: true,
	},
	line_45: {
		type: 'sprite',
		src: new URL('../../assets/line_45.png', import.meta.url).href,
		preload: true,
	},
	line_zigzag: {
		type: 'sprite',
		src: new URL('../../assets/line_zigzag.png', import.meta.url).href,
		preload: true,
	},
} as const;
