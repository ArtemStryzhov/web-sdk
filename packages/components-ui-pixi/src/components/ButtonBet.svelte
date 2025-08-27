<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBet, stateBetDerived } from 'state-shared';
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import ButtonBetAutoSpinsCounter from './ButtonBetAutoSpinsCounter.svelte';
	import { UI_BASE_SIZE } from '../constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };

	const degreesToRads = (degrees: number) => (degrees * Math.PI) / 180.0;
	
	// Rotation animation: 0 to 720 degrees (2 full rotations)
	const rotationTween = new Tween(0, {
		duration: 600, // 600ms animation
		easing: cubicInOut,
	});

	let isSpinning = $state(false);
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey hotkey="Space" disabled={!stateBetDerived.isBetCostAvailable() || isSpinning} {onpress} />
		<Button 
			{...props} 
			{sizes} 
			onpress={async () => {
				if (isSpinning) return;
				
				// Start spin animation first
				isSpinning = true;
				const spinPromise = rotationTween.set(degreesToRads(720));
				
				// Wait for animation to complete
				await spinPromise;
				
				// Reset rotation instantly
				await rotationTween.set(0, { duration: 0 });
				
				// Now call the original onpress to trigger the bet
				onpress();
				
				// Reset spinning state
				isSpinning = false;
			}} 
			disabled={!stateBetDerived.isBetCostAvailable() || isSpinning}
		>
			{#snippet children({ center, hovered, pressed })}
				<Sprite
					{...center}
					anchor={0.5}
					key={['spin_default', 'spin_disabled'].includes(key) ? 'playButton' : 'stopButton'}
					width={240}
					height={240}
					rotation={rotationTween.current}
				/>
				<ButtonBetAutoSpinsCounter x={center.x} y={center.y} />
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>
