<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider } from 'components-pixi';
	import { createInterruptible } from 'utils-shared/interruptible';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { OnHotkey, OnMount } from 'components-shared';
	import { SECOND } from 'constants-shared/time';
	import { bookEventAmountToNormalisedAmount } from 'utils-shared/amount';

	import WinCoins from './WinCoins.svelte';
	import WinCounter, { winCounterFontSize } from './WinCounter.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import { getContext } from '../game/context';
	import { winLevelMap } from '../game/winLevelMap';
	import { WIN_POPUP_Z, getWinImageY } from '../game/winPopupLayout';

	const context = getContext();

	let show = $state(false);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});
	let currentScreenIndex = $state(0);
	let currentScreenLevel = $state<number>(6);
	const bigWinScreenInterruptible = createInterruptible();

	const clearBigWinScreenInterruptible = () => {
		bigWinScreenInterruptible.interrupt();
		bigWinScreenInterruptible.clear();
	};

	const waitForSkippableBigWinTimeout = async (duration: number) => {
		const { interrupted } = await bigWinScreenInterruptible.add(() => waitForTimeout(duration));
		bigWinScreenInterruptible.clear();

		return interrupted;
	};

	const skipCurrentBigWinLevel = () => {
		if (!show || winLevelData?.type !== 'big' || currentScreenLevel === 10) {
			return;
		}

		bigWinScreenInterruptible.interrupt();
	};

	// Ensure Dokdo font is loaded before rendering Pixi text to avoid fallback fonts.
	const dokdoFontReady =
		typeof document !== 'undefined'
			? document.fonts.load('400 96px "Dokdo"')
			: Promise.resolve();
	// Trigger load early
	$effect(() => {
		dokdoFontReady;
	});

	// Get sprite key, size and vertical position for each win level
	const getWinLevelSprite = (
		level: number | undefined,
	): { key: string; width: number; height: number; y: number } | null => {
		if (!level) return null;
		
		const layoutType = context.stateLayoutDerived.layoutType();
		let scale = 1.0; // Default (landscape)
		
		if (layoutType === 'desktop') {
			scale = 1.35; 
		} else if (layoutType === 'tablet') {
			scale = 1; 
		} else if (layoutType === 'portrait') {
			scale = 0.85; 
		}
		// landscape: scale = 1.0 (default)
		
		let baseSprite: { key: string; width: number; height: number } | null = null;
		
		switch (level) {
			case 6:
				baseSprite = { key: 'big.png', width: 412.5, height: 126 }; // 825x252 / 2
				break;
			case 7:
				baseSprite = { key: 'mega.png', width: 412.5, height: 183.5 }; // 825x367 / 2
				break;
			case 8:
				baseSprite = { key: 'super.png', width: 436.5, height: 244.5 }; // 873x489 / 2
				break;
			case 9:
			case 10:
				baseSprite = { key: 'sens.png', width: 498.5, height: 244.5 }; // 997x489 / 2
				break;
			default:
				return null;
		}
		
		const width = baseSprite.width * scale;
		const height = baseSprite.height * scale;

		return {
			key: baseSprite.key,
			width,
			height,
			// Sit right above the win amount instead of at a fixed offset from the board centre.
			y: getWinImageY({
				spriteHeight: height,
				amountFontSize: winCounterFontSize(layoutType),
			}),
		};
	};

	// Calculate which win levels to show sequentially
	const calculateBigWinLevels = (currentLevel: number): number[] => {
		// Get all "big" type win levels from 6 to current level
		const allBigLevels = [6, 7, 8, 9, 10];
		return allBigLevels.filter(level => level >= 6 && level <= currentLevel);
	};

	context.eventEmitter.subscribeOnMount({
		winShow: () => (show = true),
		winHide: () => {
			clearBigWinScreenInterruptible();
			show = false;
			currentScreenIndex = 0;
			currentScreenLevel = 6;
		},
		winUpdate: async (emitterEvent) => {
			clearBigWinScreenInterruptible();
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			currentScreenIndex = 0;
			currentScreenLevel = 6;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
	});
</script>

<FadeContainer {show} zIndex={10004}>
	{#if winLevelData}
		{@const isBigWin = winLevelData.type === 'big'}
		{@const bigWinLevels = isBigWin ? calculateBigWinLevels(winLevelData.level) : [winLevelData.level]}
		{@const duration = isBigWin
			? winLevelData.presentDuration <= 1 * SECOND
				? Math.max(winLevelData.presentDuration, 1.8 * SECOND)
				: Math.max(winLevelData.presentDuration, 2.2 * SECOND)
			: 0}
		{@const perScreenDuration = bigWinLevels.length > 0 ? duration / bigWinLevels.length : duration}
		{@const normalisedAmount = bookEventAmountToNormalisedAmount(amount)}
		{@const shouldShowCoins = winLevelData?.type === 'big'}
		
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				{#if isBigWin}
					<OnHotkey hotkey="Space" disabled={currentScreenLevel === 10} onpress={() => skipCurrentBigWinLevel()} />
				{/if}

				<!-- Background with opacity only for win levels >= 6 -->
				{#if winLevelData && winLevelData.level >= 6}
					<CanvasSizeRectangle
						backgroundColor={0x000000}
						backgroundAlpha={0.7}
						zIndex={WIN_POPUP_Z.background}
					/>
				{/if}

				<OnMount
					onmount={async () => {
						await dokdoFontReady;
						
						// Start the counter animation
						startCountUp();
						
						if (isBigWin && bigWinLevels.length > 0) {
							// Sequential screen display for big wins
							for (let i = 0; i < bigWinLevels.length; i++) {
								currentScreenIndex = i;
								currentScreenLevel = bigWinLevels[i];

								// Play the BGM for this specific win level screen
								const screenLevelData = winLevelMap[bigWinLevels[i] as keyof typeof winLevelMap];
								if (screenLevelData?.sound?.bgm) {
									context.eventEmitter.broadcast({ type: 'soundMusic', name: screenLevelData.sound.bgm });
								}

								const isLastScreen = i === bigWinLevels.length - 1;
								const isLevel10 = bigWinLevels[i] === 10;

								// Wait for screen duration
								const screenSkipped = await waitForSkippableBigWinTimeout(perScreenDuration);

								// If it's level 10, wait for user interaction
								if (isLevel10) {
									// Wait for user to press continue
									await waitForResolve((resolve) => {
										oncomplete = resolve;
									});
									break;
								} else if (!isLastScreen) {
									// Add fade transition delay between screens (auto-advance)
									if (!screenSkipped) {
										await waitForSkippableBigWinTimeout(300);
									}
								} else {
									// Last screen but not level 10: auto-advance
									if (!screenSkipped) {
										await waitForSkippableBigWinTimeout(300);
									}
									oncomplete();
									break;
								}
							}
						} else {
							// Non-big win: original behavior
							await waitForTimeout(300);
							oncomplete();
						}
					}}
				/>

				<!-- Show win amount only for big wins -->
				{#if isBigWin}
					<Container zIndex={WIN_POPUP_Z.amount}>
						<WinCounter {countUpAmount} />
					</Container>
				{/if}

				<!-- Sequential win level screens -->
				{#if isBigWin && bigWinLevels.length > 0}
					{#if shouldShowCoins}
						{@const currentLevelData = winLevelMap[currentScreenLevel as keyof typeof winLevelMap]}
						<Container zIndex={WIN_POPUP_Z.coins}>
							<WinCoins emit={!countUpCompleted} levelAlias={currentLevelData?.alias} />
						</Container>
					{/if}

					{#each bigWinLevels as level, index}
						{@const isCurrentScreen = index === currentScreenIndex}
						{@const spriteData = getWinLevelSprite(level)}
						
						<FadeContainer show={isCurrentScreen} zIndex={WIN_POPUP_Z.image}>
							<MainContainer cullable={false}>
								<Container
									x={context.stateGameDerived.boardLayout().x}
									y={context.stateGameDerived.boardLayout().y}
									zIndex={1000}
									cullable={false}
								>
									{@const mainLayout = context.stateLayoutDerived.mainLayout()}
									{@const boardLayout = context.stateGameDerived.boardLayout()}
									
									{#if spriteData}
										<!-- Win level sprite right above the win amount -->
										<Container
											x={mainLayout.width * 0.5 - boardLayout.x}
											y={spriteData.y}
											zIndex={1001}
										>
											<Sprite
												key={spriteData.key}
												anchor={0.5}
												width={spriteData.width}
												height={spriteData.height}
											/>
										</Container>
									{/if}
								</Container>
							</MainContainer>
						</FadeContainer>

						<!-- Show PressToContinue only on level 10 -->
						{#if level === 10}
							<FadeContainer show={isCurrentScreen} zIndex={WIN_POPUP_Z.pressToContinue}>
								<PressToContinue onpress={() => {
									if (!countUpCompleted) {
										finishCountUp();
									}

									oncomplete();
								}} />
							</FadeContainer>
						{/if}
					{/each}
				{:else}
					<!-- Non-big win: original single screen display -->
					{@const spriteData = getWinLevelSprite(winLevelData?.level)}
					
					{#if shouldShowCoins}
						<Container zIndex={WIN_POPUP_Z.coins}>
							<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />
						</Container>
					{/if}

					<Container zIndex={WIN_POPUP_Z.image}>
						<MainContainer cullable={false}>
							<Container
								x={context.stateGameDerived.boardLayout().x}
								y={context.stateGameDerived.boardLayout().y}
								zIndex={1000}
								cullable={false}
							>
								{@const mainLayout = context.stateLayoutDerived.mainLayout()}
								{@const boardLayout = context.stateGameDerived.boardLayout()}
								
								{#if spriteData}
									<!-- Win level sprite right above the win amount -->
									<Container
										x={mainLayout.width * 0.5 - boardLayout.x}
										y={spriteData.y}
										zIndex={1001}
									>
										<Sprite
											key={spriteData.key}
											anchor={0.5}
											width={spriteData.width}
											height={spriteData.height}
										/>
									</Container>
								{/if}
							</Container>
						</MainContainer>
					</Container>

					<Container zIndex={WIN_POPUP_Z.pressToContinue}>
						<PressToContinue onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())} />
					</Container>
				{/if}
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
