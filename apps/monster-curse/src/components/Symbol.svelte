<script lang="ts">
	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolComposite from './SymbolComposite.svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';
	import { getSymbolConfig } from '../config/symbolConfig';
	import { BitmapText, Text, Graphics, Container } from 'pixi-svelte';
	import '../utils/fontLoader';


type Props = {
	x?: number;
	y?: number;
	state: SymbolState;
	rawSymbol: RawSymbol;
	oncomplete?: () => void;
	loop?: boolean;
	key?: string;
};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo?.type === 'sprite');
	const isComposite = $derived((symbolInfo as any)?.composite === true);

	// Check if symbol has configuration (meaning it should use SymbolComposite)
	const hasSymbolConfig = $derived(getSymbolConfig(props.rawSymbol.name) !== null);

	// Force reactivity when state changes
	$effect(() => {
		props.state;
		props.key;
	});
	
	// Text dimensions for manual centering (to account for padding affecting anchor)
	let textWidth = $state(0);
	let textHeight = $state(0);
	
	// Multiplier scale animation state for land and win animations
	let multiplierScale = $state(1.0);
	
	// Multiplier animation on land and win for W and S symbols
	$effect(() => {
		// Trigger animation when symbol lands or wins and has a multiplier
		if ((props.state === 'land' || props.state === 'win') && 
			(props.rawSymbol.name === 'W' || props.rawSymbol.name === 'S') &&
			(props.rawSymbol.multiplier || props.rawSymbol.collectedMultiplier)) {
			
			// Reset scale to 1.0 at start
			multiplierScale = 1.0;
			
			// Create scaling animation matching W's win animation timing
			const startScale = 1.0;
			const maxScale = 1.25; // 25% increase
			const endScale = 1.0;
			const duration = 1900; // 1.9 seconds
			const peakTime = 1200; // 1.2 seconds
			
			const startTime = Date.now();
			
			const animate = () => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);
				
				let scale;
				if (progress <= peakTime / duration) {
					// Scale up to peak
					const peakProgress = progress / (peakTime / duration);
					scale = startScale + (maxScale - startScale) * peakProgress;
				} else {
					// Scale down from peak
					const downProgress = (progress - peakTime / duration) / (1 - peakTime / duration);
					scale = maxScale + (endScale - maxScale) * downProgress;
				}
				
				// Update reactive state
				multiplierScale = scale;
				
				if (progress < 1) {
					requestAnimationFrame(animate);
				} else {
					// Ensure we end at exactly 1.0
					multiplierScale = 1.0;
				}
			};
			
			requestAnimationFrame(animate);
		} else if (props.state !== 'land' && props.state !== 'win') {
			// Reset scale when not in land or win state
			multiplierScale = 1.0;
		}
	});
</script>

		{#if isSprite && (isComposite || hasSymbolConfig)}
	<SymbolComposite {symbolInfo} rawSymbol={props.rawSymbol} x={props.x} y={props.y} state={props.state} loop={props.loop} oncomplete={props.oncomplete} />
{:else if isSprite}
	<SymbolSprite {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete} />
{:else}
	<Container x={0} y={0} zIndex={props.state === 'win' ? 1000 : 0}>
		<SymbolSpine
			loop={props.loop}
			{symbolInfo}
			rawSymbol={props.rawSymbol}
			x={props.x}
			y={(props.y ?? 0) + (props.rawSymbol.name === 'S' && props.state === 'expand' ? 20 : 0)}
			showWinFrame={props.state === 'win' && !['S'].includes(props.rawSymbol.name)}
			listener={{
				complete: props.oncomplete,
				event: (_, event) => {
					if (event.data?.name === 'wildExplode') {
						context.eventEmitter?.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
					}
				},
			}}
		/>
	</Container>
{/if}
{#if (props.rawSymbol.multiplier || props.rawSymbol.collectedMultiplier) && !props.rawSymbol.isCollected}
	{@const displayMultiplier = (() => {
		// For S symbols: prioritize collectedMultiplier (hides initial multiplier)
		if (props.rawSymbol.name === 'S' && props.rawSymbol.collectedMultiplier) {
			return props.rawSymbol.collectedMultiplier;
		}
		// For other symbols: use collectedMultiplier if available, otherwise multiplier
		// Default to 2 for W/S symbols if no multiplier specified (backend always sends 2-50)
		const defaultMultiplier = (props.rawSymbol.name === 'W' || props.rawSymbol.name === 'S') ? 2 : 0;
		return props.rawSymbol.collectedMultiplier || props.rawSymbol.multiplier || defaultMultiplier;
	})()}
	{@const shouldShowMultiplier = (() => {
		// For S symbols: always show multiplier when in win states (expand, win, postWinStatic)
		if (props.rawSymbol.name === 'S' && (props.state === 'expand' || props.state === 'win' || props.state === 'postWinStatic')) {
			return true;
		}
		// For all symbols: hide 1x multipliers
		return displayMultiplier > 1;
	})()}
	{#if shouldShowMultiplier}
	<Container 
		x={props.x} 
		y={(props.y ?? 0) + (props.rawSymbol.name === 'S' && props.state === 'expand' ? 20 : 0)} 
		zIndex={2000}
		scale={{ x: multiplierScale, y: multiplierScale }}
	>
		<!-- Gradient border background -->
		<Graphics
			x={0}
			y={0}
			draw={(g) => {
				g.clear();
				// Create gradient border effect
				const width = 80;
				const height = 60;
				
				// Outer border with gradient colors
				g.lineStyle(5, 0xFF70EA, 1);
				g.drawRoundedRect(-width/2, -height/2, width, height, 8);
				
			}}
		/>
		
		<!-- Wrap text in container -->
		<!-- Center text horizontally and align to bottom of the 80px wide border -->
		<!-- Border spans from -40 to +40 horizontally, -30 to +30 vertically (60px tall) -->
		<!-- Move text 2% more to bottom: currently at y=66, move another 2% of 60px = 1.2px more -->
		<!-- So container at y=66+1.2≈67 to position text further down -->
		<Container x={0} y={67}>
			<!-- Drop shadow - behind main text, offset by (3, 6) -->
			<Text
				anchor={{ x: 0, y: 1 }}
				x={3 + (-textWidth / 2)}
				y={6}
				text={`${displayMultiplier}x`}
				style={{
					fontFamily: 'Crom, Arial, sans-serif',
					fontWeight: 'bold',
					fill: 0xBF00B5,
					fontSize: 45, // Reduced by 10% (50 * 0.9 = 45)
					align: 'center',
					padding: 15, // Match padding to keep alignment
				}}
				onresize={(size) => {
					// Use main text width for centering (shadow has same content)
					if (size.width > 0 && textWidth === 0) textWidth = size.width;
					if (size.height > 0 && textHeight === 0) textHeight = size.height;
				}}
			/>
			
			<!-- Main text - center horizontally, align to bottom -->
			<!-- anchor y=1 means bottom of texture (including bottom padding) aligns with y position -->
			<!-- Position at y=0 so bottom edge aligns with container y=42 (20% down from border center) -->
			<Text
				anchor={{ x: 0, y: 1 }}
				x={-textWidth / 2}
				y={0}
				text={`${displayMultiplier}x`}
				style={{
					fontFamily: 'Crom, Arial, sans-serif',
					fontWeight: 'bold',
					fill: 0x61E5FF,
					fontSize: 45, // Reduced by 10% (50 * 0.9 = 45)
					stroke: { color: 0x7B15FF, width: 3 },
					align: 'center',
					padding: 15, // Add padding to texture bounds to prevent clipping from stroke/shadow/tall characters
				}}
				onresize={(size) => {
					// Update text dimensions for centering
					if (size.width > 0) textWidth = size.width;
					if (size.height > 0) textHeight = size.height;
				}}
			/>
		</Container>
	</Container>
	{/if}
{/if}
