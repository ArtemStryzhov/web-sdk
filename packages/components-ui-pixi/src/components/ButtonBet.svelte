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
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const buttonSize = Math.round(UI_BASE_SIZE * 0.857375);
	const sizes = { width: buttonSize, height: buttonSize };

	// Check if assets are available
	const hasBgbackAsset = $derived(context.stateApp.assets?.bgback);
	const hasPlayButton = $derived(context.stateApp.assets?.playButton);
	const hasStopButton = $derived(context.stateApp.assets?.stopButton);

	const playButtonSize = Math.round(240 * 0.857375); // 205.77px -> 206px
	const stopButtonSize = Math.round((240 * 0.857375) / 3); // Reduced by 3 times: ~69px
	const backgroundSpriteSize = Math.round(210 * 0.857375); // 180.05px -> 180px

	// Get the appropriate sprite key based on button state and asset availability
	const getSpriteKey = (key: string): string => {
		if (['spin_default', 'spin_disabled'].includes(key)) {
			return hasPlayButton ? 'playButton' : '';
		} else {
			return hasStopButton ? 'stopButton' : '';
		}
	};

	// Get the appropriate sprite size based on button state
	const getSpriteSize = (key: string): number => {
		if (['spin_default', 'spin_disabled'].includes(key)) {
			return playButtonSize;
		} else {
			return stopButtonSize;
		}
	};


	const degreesToRads = (degrees: number) => (degrees * Math.PI) / 180.0;
	
	// Rotation animation: 0 to 720 degrees (2 full rotations)
	const rotationTween = new Tween(0, {
		duration: 600, // 600ms animation
		easing: cubicInOut,
	});

	// Idle animation system
	const idleRotationTween = new Tween(0, {
		duration: 400, // Swing animation duration
		easing: cubicInOut,
	});

	let isSpinning = $state(false);
	let isIdleAnimating = $state(false);
	let idleTimeoutId: number | null = null;
	let lastActivityTime = $state(Date.now());

	// Reset idle timer on any activity
	const resetIdleTimer = () => {
		lastActivityTime = Date.now();
		if (idleTimeoutId) {
			clearTimeout(idleTimeoutId);
		}
		if (isIdleAnimating) {
			isIdleAnimating = false;
			idleRotationTween.set(0, { duration: 200 }); // Quick reset to 0
		}
	};

	// Start idle animation sequence
	const startIdleAnimation = async () => {
		if (isSpinning || !context.stateXstateDerived.isIdle()) return;
		
		isIdleAnimating = true;
		
		try {
			// Repeat the pattern continuously
			while (isIdleAnimating && context.stateXstateDerived.isIdle()) {
				// 4 swing cycles (left-right-left-right)
				for (let i = 0; i < 4 && isIdleAnimating; i++) {
					await idleRotationTween.set(degreesToRads(-15)); // Swing left
					if (!isIdleAnimating) break;
					await idleRotationTween.set(degreesToRads(15));  // Swing right
					if (!isIdleAnimating) break;
				}
				
				if (!isIdleAnimating) break;
				
				// Full rotation (360 degrees)
				await idleRotationTween.set(degreesToRads(360), { duration: 800 });
				if (!isIdleAnimating) break;
				
				// Reset to 0 for next cycle
				await idleRotationTween.set(0, { duration: 0 });
				
				// Small pause before next cycle
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		} catch (error) {
			// Animation was interrupted
		} finally {
			if (isIdleAnimating) {
				isIdleAnimating = false;
				idleRotationTween.set(0, { duration: 200 });
			}
		}
	};

	// Monitor for idle state
	$effect(() => {
		const checkIdle = () => {
			if (Date.now() - lastActivityTime >= 10000 && !isSpinning && !isIdleAnimating && context.stateXstateDerived.isIdle()) {
				startIdleAnimation();
			}
		};

		const interval = setInterval(checkIdle, 1000);
		return () => clearInterval(interval);
	});

	// Global activity listeners to reset idle timer
	$effect(() => {
		if (typeof window !== 'undefined') {
			const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
			
			const handleActivity = () => {
				resetIdleTimer();
			};

			events.forEach(event => {
				window.addEventListener(event, handleActivity, { passive: true });
			});

			return () => {
				events.forEach(event => {
					window.removeEventListener(event, handleActivity);
				});
			};
		}
	});
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey hotkey="Space" disabled={!stateBetDerived.isBetCostAvailable() || isSpinning} {onpress} />
		<Button 
			{...props} 
			{sizes} 
			onpress={async () => {
				if (isSpinning) return;
				
				// Reset idle timer on button press
				resetIdleTimer();
				
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
				
				// Reset idle timer after spinning
				resetIdleTimer();
			}} 
			disabled={!stateBetDerived.isBetCostAvailable() || isSpinning}
		>
			{#snippet children({ center, hovered, pressed })}
				<!-- Background image (only if asset exists) -->
				{#if hasBgbackAsset}
					<Sprite
						{...center}
						anchor={0.5}
						key="bgback"
						width={backgroundSpriteSize}
						height={backgroundSpriteSize}
					/>
				{/if}
				<!-- Main button sprite (only if asset exists) -->
				{@const spriteKey = getSpriteKey(key)}
				{@const spriteSize = getSpriteSize(key)}
				{#if spriteKey && spriteKey !== ''}
					<Sprite
						{...center}
						anchor={0.5}
						key={spriteKey}
						width={spriteSize}
						height={spriteSize}
						rotation={['spin_default', 'spin_disabled'].includes(key) ? 
							(isIdleAnimating ? idleRotationTween.current : rotationTween.current) : 0}
					/>
				{/if}
				<ButtonBetAutoSpinsCounter x={center.x} y={center.y} />
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>
