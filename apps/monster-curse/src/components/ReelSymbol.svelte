<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import type { ReelSymbol } from '../game/stateGame.svelte';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const symbolInfo = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: props.reelSymbol.symbolState }),
	);

	// Calculate z-index for S symbols in expand state to render above all other symbols
	const symbolZIndex = $derived(
		props.reelSymbol.rawSymbol.name === 'S' && props.reelSymbol.symbolState === 'expand' 
			? 10001 
			: 0
	);

	// Force reactivity when symbol state changes
	$effect(() => {
		const currentState = props.reelSymbol.symbolState;
		// Force the symbol to complete after a delay if it doesn't complete normally
		// This prevents infinite hangs for both 'win' and 'expand' states
		if ((currentState === 'win' || currentState === 'expand') && props.reelSymbol.oncomplete) {
			// Give normal completion 3 seconds to work, then force complete
			const timeoutId = setTimeout(() => {
				if ((props.reelSymbol.symbolState === 'win' || props.reelSymbol.symbolState === 'expand') && props.reelSymbol.oncomplete) {
					props.reelSymbol.oncomplete();
				}
			}, 3000);
			
			// Cleanup timeout if component unmounts or state changes
			return () => clearTimeout(timeoutId);
		}
	});
</script>

<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.reelSymbol.symbolY()}
	symbolIndex={props.reelSymbol.symbolIndex}
	zIndex={symbolZIndex}
	animating={symbolInfo?.type === 'spine' &&
		(props.reelSymbol.symbolState === 'land' || props.reelSymbol.symbolState === 'win')}
>
	<Symbol
		key={`${props.reelSymbol.rawSymbol.name}-${props.reelSymbol.symbolState}`}
		state={props.reelSymbol.symbolState}
		rawSymbol={props.reelSymbol.rawSymbol}
		loop={props.reelSymbol.symbolState === 'expand' && props.reelSymbol.rawSymbol.name === 'S' ? false : undefined}
		oncomplete={() => {
			// Always call oncomplete if it exists, since the promise was set up to wait for completion
			props.reelSymbol.oncomplete?.();
			if (props.reelSymbol.symbolState === 'land') props.reelSymbol.symbolState = 'static';
		}}
	/>
</SymbolWrap>
