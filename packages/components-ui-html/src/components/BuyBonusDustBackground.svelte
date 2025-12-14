<script lang="ts">
	/**
	 * Dust animation background for Buy Bonus modal
	 * Uses only the dust region from mm_bg_feature_animated.atlas
	 * Atlas info: dust at xy: 290, 0, size: 1175x1223 from 1464x1234 total image
	 */

	const base = (import.meta as any).env?.BASE_URL ?? '/';
	const assetBase = base.endsWith('/') ? base.slice(0, -1) : base;
	const runesUrl = `${assetBase}/assets/spines/foregroundFeatureAnimation/animated/runes.png`;
</script>

<div class="dust-background">
	<div class="dust-container" style={`--runes-url: url(${runesUrl});`}></div>
</div>

<style lang="scss">
	.dust-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 5; // Above background but under buttons
		overflow: hidden;
	}

	.dust-container {
		position: absolute;
		top: 50%;
		left: 50%;
		// Scale reduced to 0.75x (half of previous 1.5x)
		transform: translate(-50%, -50%) scale(0.75);
		width: 1175px; // Actual dust region width from atlas
		height: 1223px; // Actual dust region height from atlas
		background-image: var(--runes-url);
		// Atlas shows dust at xy: 290, 0 with size 1175x1223 from 1464x1234 image
		// Use pixel-based positioning to crop to dust region only
		background-position: -290px 0px; // Offset to show only dust (starts at x:290 in atlas)
		background-size: 1464px 1234px; // Original image dimensions
		background-repeat: no-repeat;
		// No opacity, no blur - full visibility for dust
	}
</style>

