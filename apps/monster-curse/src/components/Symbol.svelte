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
{#if (() => {
		// For S symbols: if collectedMultiplier exists, hide initial multiplier and show only collectedMultiplier
		if (props.rawSymbol.name === 'S' && props.rawSymbol.collectedMultiplier) {
			return true; // Show collectedMultiplier, hide initial multiplier
		}
		// For other symbols or S without collectedMultiplier: show multiplier if it exists
		return (props.rawSymbol.multiplier || props.rawSymbol.collectedMultiplier) && !props.rawSymbol.isCollected;
	})()}
	{@const displayMultiplier = (() => {
		// For S symbols: prioritize collectedMultiplier (hides initial multiplier)
		if (props.rawSymbol.name === 'S' && props.rawSymbol.collectedMultiplier) {
			return props.rawSymbol.collectedMultiplier;
		}
		// For other symbols: use collectedMultiplier if available, otherwise multiplier
		return props.rawSymbol.collectedMultiplier || props.rawSymbol.multiplier;
	})()}
	<Container x={props.x} y={(props.y ?? 0) + (props.rawSymbol.name === 'S' && props.state === 'expand' ? 20 : 0)} zIndex={props.rawSymbol.name === 'S' ? 100 : 50}>
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
