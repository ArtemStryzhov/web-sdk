<script lang="ts">
	import { MainContainer, OnPressFullScreen, CanvasSizeRectangle } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { Sprite, Text, Container, Graphics, Rectangle } from 'pixi-svelte';
	import { UI_BASE_FONT_SIZE } from 'components-ui-pixi/src/constants';
	import * as PIXI from 'pixi.js';
	import { onMount } from 'svelte';
	import { getContextApp } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type Props = {
		onpress: () => void;
	};

	const props: Props = $props();
	const context = getContext();
	const pixiContext = getContextApp();

	// Track if we've already shown the welcome frames (only show once on initial load)
	let hasShownWelcomeFrames = $state(false);
	
	// Only show welcome frames during initial loading screen, not during gameplay
	// Show only once when loaded and not in freegame, then hide forever after first press
	const shouldShowWelcomeFrames = $derived(
		!hasShownWelcomeFrames &&
		context.stateLayout.showLoadingScreen && 
		context.stateApp.loaded && 
		context.stateGame.gameType !== 'freegame'
	);

	// Font loading state
	let fontLoaded = $state(false);
	let resizeTick = $state(0);

	const debounce = (func: () => void, delay: number) => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			timeoutId = setTimeout(() => {
				func();
			}, delay);
		};
	};

	const refreshViewport = () => {
		resizeTick++;
	};

	// Helper function to convert screen coordinates to PIXI world coordinates
	const screenToWorldX = (clientX: number): number => {
		const app = pixiContext.stateApp.pixiApplication;
		if (!app || !app.canvas || !app.renderer) return clientX;

		const canvas = app.canvas;
		const rect = canvas.getBoundingClientRect();
		
		// Calculate relative position on canvas (0 to 1)
		const relativeX = (clientX - rect.left) / rect.width;
		// Convert to world coordinates
		// PIXI world coordinates are centered at 0, so we need to map:
		// 0 (left edge) -> -canvasSizes.width/2
		// 1 (right edge) -> +canvasSizes.width/2
		const canvasSizes = context.stateLayoutDerived.canvasSizes();
		// Use the actual canvas rect width for conversion to ensure accuracy
		// The canvasSizes.width is the logical width, but we need to account for device pixel ratio
		const worldWidth = canvasSizes.width;
		return (relativeX - 0.5) * worldWidth;
	};

	onMount(() => {
		// Wait for fonts to be loaded before rendering text
		(async () => {
			if (typeof document !== 'undefined' && 'fonts' in document) {
				try {
					// Wait for all fonts to be ready
					await document.fonts.ready;
					// Small delay to ensure PIXI can access the font
					setTimeout(() => {
						fontLoaded = true;
					}, 50);
				} catch (error) {
					// Fallback: proceed after a short delay
					setTimeout(() => {
						fontLoaded = true;
					}, 500);
				}
			} else {
				// Fallback for browsers without Font Loading API
				setTimeout(() => {
					fontLoaded = true;
				}, 300);
			}
		})();

		// Set touch-action on canvas to prevent scroll gestures during drag
		const app = pixiContext.stateApp.pixiApplication;
		if (app?.canvas) {
			app.canvas.style.touchAction = 'none';
		}

		// Add global pointer event listeners for slider dragging
		// Using global handlers since PIXI events aren't working reliably
		if (typeof window !== 'undefined') {
			const handleGlobalPointerDown = (e: PointerEvent) => {
				// Only handle if in slider mode and not already dragging
				if (isSliderMode && !isDragging) {
					// Check if click is in the slider area (roughly center of screen)
					const app = pixiContext.stateApp.pixiApplication;
					if (!app || !app.canvas) return;
					
					const canvas = app.canvas;
					const rect = canvas.getBoundingClientRect();
					const relativeY = (e.clientY - rect.top) / rect.height;
					
					// Slider is roughly in the middle 60% of screen height
					if (relativeY > 0.2 && relativeY < 0.8) {
						// Prevent default to avoid pointer cancellation
						e.preventDefault();
						// Pass raw event data directly
						handlePointerDown({
							clientX: e.clientX,
							pointerId: e.pointerId,
							stopPropagation: () => e.stopPropagation(),
						});
					}
				}
			};

			const handleGlobalPointerMove = (e: PointerEvent) => {
				// Only process if we're dragging - access reactive state directly
				if (isDragging && isSliderMode) {
					// Always prevent default to prevent pointer cancellation
					e.preventDefault();
					// Don't check pointer ID - just process all move events when dragging
					// This ensures we capture all movement
					// Pass raw event data directly
					handlePointerMove({
						clientX: e.clientX,
						pointerId: e.pointerId,
						stopPropagation: () => e.stopPropagation(),
					});
				}
			};

			const handleGlobalPointerUp = (e: PointerEvent) => {
				// Only process if we're dragging - access reactive state directly
				if (isDragging && isSliderMode) {
					// Don't check pointer ID - just process all up events when dragging
					// Pass raw event data directly
					handlePointerUp({
						clientX: e.clientX,
						pointerId: e.pointerId,
						stopPropagation: () => e.stopPropagation(),
					});
				}
			};

			const handleGlobalPointerCancel = (e: PointerEvent) => {
				// Treat cancel like pointerup - complete the drag gesture
				if (isDragging && (activePointerId === null || e.pointerId === activePointerId)) {
					// Process it like a pointer up event so the drag completes properly
					handlePointerUp({
						clientX: e.clientX,
						pointerId: e.pointerId,
						stopPropagation: () => e.stopPropagation(),
					});
				}
			};

			window.addEventListener('pointerdown', handleGlobalPointerDown, { passive: false });
			window.addEventListener('pointermove', handleGlobalPointerMove, { passive: false });
			window.addEventListener('pointerup', handleGlobalPointerUp, { passive: false });
			window.addEventListener('pointercancel', handleGlobalPointerCancel, { passive: false });

			const debouncedResize = debounce(() => {
				refreshViewport();
			}, 300);
			const onResizeImmediate = () => {
				refreshViewport();
				debouncedResize();
			};
			window.addEventListener('resize', onResizeImmediate);
			window.addEventListener('orientationchange', onResizeImmediate);
			window.visualViewport?.addEventListener('resize', onResizeImmediate);

			return () => {
				window.removeEventListener('pointerdown', handleGlobalPointerDown);
				window.removeEventListener('pointermove', handleGlobalPointerMove);
				window.removeEventListener('pointerup', handleGlobalPointerUp);
				window.removeEventListener('pointercancel', handleGlobalPointerCancel);
				window.removeEventListener('resize', onResizeImmediate);
				window.removeEventListener('orientationchange', onResizeImmediate);
				window.visualViewport?.removeEventListener('resize', onResizeImmediate);
			};
		}
	});

	const buttonWidth = 436;
	const buttonHeight = 106;
	const buttonScale = 0.75;

	let isHovered = $state(false);

	const mainLayout = $derived(context.stateLayoutDerived.mainLayout());
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const isPortrait = $derived(layoutType === 'portrait');
	const isTablet = $derived(layoutType === 'tablet');
	const isLandscape = $derived(layoutType === 'landscape');
	const isDesktop = $derived(layoutType === 'desktop');
	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());
	const isSmallDesktop = $derived(isDesktop && canvasSizes.width < 1600 && canvasSizes.height < 800);
	const isNarrowDesktop = $derived(isDesktop && canvasSizes.width <= 1024);
	const isNarrowDesktop1200 = $derived(isDesktop && canvasSizes.width < 1200);
	const firstBlockLargeDesktopScale = $derived.by(() => {
		if (canvasSizes.width > 2900) {
			return 0.74;
		}

		if (canvasSizes.width > 2500) {
			return 0.85;
		}

		if (canvasSizes.width > 2250) {
			return 0.9;
		}

		return 1;
	});
	const isWidth1050OrLess = $derived(canvasSizes.width <= 1050);
	const isWidth1124OrLess = $derived(canvasSizes.width <= 1124);
	const widthBasedTextScale = $derived(
		isWidth1050OrLess ? 0.85 : isWidth1124OrLess ? 0.9 : 1
	);
	const isViewport800x450Like = $derived.by(() => {
		const similarity = Math.min(canvasSizes.width / 800, canvasSizes.height / 450);
		return similarity >= 0.95 && similarity <= 1.05;
	});
	const isViewport425x812Like = $derived.by(() => {
		const similarity = Math.min(canvasSizes.width / 425, canvasSizes.height / 812);
		return similarity >= 0.95 && similarity <= 1.05;
	});
	const isViewport375x667Like = $derived.by(() => {
		const similarity = Math.min(canvasSizes.width / 375, canvasSizes.height / 667);
		return similarity >= 0.95 && similarity <= 1.05;
	});
	const isViewport1200x675Like = $derived.by(() => {
		resizeTick;

		if (!isDesktop) {
			return false;
		}

		const similarity = Math.min(canvasSizes.width / 1200, canvasSizes.height / 675);
		return similarity >= 0.97 && similarity <= 1.03;
	});
	const isViewport1024x576Like = $derived.by(() => {
		resizeTick;

		if (!isDesktop) {
			return false;
		}

		const similarity = Math.min(canvasSizes.width / 1024, canvasSizes.height / 576);
		return similarity >= 0.97 && similarity <= 1.03;
	});
	const viewport425x812TextScale = $derived(isViewport425x812Like ? 1.15 : 1);
	const viewport375x667BlockScale = $derived(isViewport375x667Like ? 1.15 : 1);
	const firstBlockResolutionTextScale = $derived.by(() => {
		if (isViewport1024x576Like) {
			// Keep the first block at exactly 20% smaller on this viewport (10% more than before).
			return 0.8 / widthBasedTextScale;
		}

		return 1;
	});
	const buttonYOffset1200x675 = $derived(isViewport1200x675Like ? 40 : 0);
	const firstBlockExtraLeftPadding = $derived(isViewport800x450Like ? 20 : 0);
	const firstBlockLargeDesktopTopPadding = $derived(canvasSizes.width > 2250 ? 10 : 0);
	const firstBlockExtraTopPadding = $derived(
		(isViewport800x450Like ? 30 : 0) +
		(isViewport425x812Like ? 15 : 0) +
		(isViewport1200x675Like ? 10 : 0) +
		firstBlockLargeDesktopTopPadding
	);
	const isMidDesktopViewport = $derived.by(() => {
		if (!isDesktop) {
			return false;
		}

		const similarity = Math.min(canvasSizes.width / 1200, canvasSizes.height / 675);
		return similarity >= 0.9 && similarity <= 1.2;
	});
	const isUltraNarrow = $derived(canvasSizes.width < 500);
	const isLandscapeLayout = $derived(isLandscape);
	const portraitTextScale = $derived(isPortrait ? 1.48 : 1); // Reduced by 20% for portrait (1.85 * 0.8 = 1.48)
	const tabletTextScale = $derived(isTablet ? 1.02 : 1); // Reduced by 40% then additional 15% for tablets (2 * 0.6 * 0.85 = 1.02)
	const portraitNarrowTextScale = $derived(isPortrait && canvasSizes.width < 500 ? 1.15 : 1); // Increase by 15% for portrait screens with width < 500
	const ultraNarrowTextScale = $derived(canvasSizes.width < 500 ? 1.15 : 1); // Increase by 15% for all screens with width < 500
	// Use slider mode for all portrait and tablet screen sizes
	const isSliderMode = $derived(isPortrait || isTablet);
	const isSmallScreen = $derived(canvasSizes.width < 380);

	const buttonX = $derived(mainLayout.width * 0.5);

	const buttonSpriteKey = $derived(isHovered ? 'button_grey.png' : 'button_inactive.png');

	// Welcome frame layout calculations
	const frameOriginalWidth = 846;
	const frameOriginalHeight = 993;
	const numFrames = 3;
	const frameGap = 90; // Gap between frames
	const horizontalPadding = 80; // Padding on left and right sides

	// Calculate scale to fit available width, then reduce by 2x, then increase by 15%
	// On portrait, multiply by 3 to make blocks 3 times larger
	// For desktop/landscape: use fixed scale that matches 1967px exactly
	const availableWidth = $derived(mainLayout.width - horizontalPadding * 2);
	const totalFramesWidth = $derived(frameOriginalWidth * numFrames);
	const totalGapsWidth = $derived(frameGap * (numFrames - 1));
	const totalWidthNeeded = $derived(totalFramesWidth + totalGapsWidth);
	
	// Fixed reference final scale from the exact 1967px layout visual size.
	// At 1967px: baseFrameScale ≈ 0.312 and mainLayout.scale ≈ 1.203 → final ≈ 0.375
	// Keep final visual size constant by: frameScale = referenceFinalScale / mainLayout.scale
	const referenceFinalScale = 0.375;
	const shouldUseReferenceScale = $derived(
		isDesktop || isLandscape || isTablet
	);
	
	const baseFrameScale = $derived(
		// For desktop / landscape / tablet, keep final size constant using the reference final scale
		// For portrait, calculate dynamically
		shouldUseReferenceScale
			? (isDesktop ? (referenceFinalScale * 1.1) : referenceFinalScale) / mainLayout.scale // desktop +10%
			: Math.min(1, availableWidth / totalWidthNeeded) * 0.5 * 1.15
	);
	
	// Apply layout-specific multipliers.
	// For desktop/landscape/tablet we use the fixed reference scale (no extra multiplier).
	// For portrait we keep the original sizing logic.
	const frameScale = $derived(
		(() => {
			const base = isPortrait
				? baseFrameScale * 3 // 3 times larger on portrait
				: baseFrameScale; // desktop / landscape / tablet uses the fixed reference base

			// Extra scaling only for portrait small screens
			const extraScale =
				shouldUseReferenceScale
					? 1 // no extra bump on desktop/landscape/tablet to stay consistent
					: (isSmallScreen ? 0.7 : 1) * 1.15; // original behavior

			// Small desktop: shrink frames by 15% when below 1600x800
			const smallDesktopScale = isSmallDesktop ? 0.85 : 1;
			// Narrow desktop: shrink frames by 30% when width <= 1024
			const narrowDesktopScale = isNarrowDesktop ? 0.7 : 1;
			// Landscape: shrink frames by 30%
			const landscapeScale = isLandscapeLayout ? 0.7 : 1;

			return base * extraScale * smallDesktopScale * narrowDesktopScale * landscapeScale;
		})()
	);

	// Calculate scaled dimensions
	const frameWidth = $derived(frameOriginalWidth * frameScale);
	const frameHeight = $derived(frameOriginalHeight * frameScale);

	// Slider state for drag/swipe functionality
	let sliderDragOffset = $state(0); // Drag offset relative to current slide (in world coordinates)
	let currentSlideIndex = $state(0); // Start at first slide (index 0) to show frame 1 centered
	let isDragging = $state(false);
	let dragStartX = $state(0); // Start position in world coordinates
	let dragStartClientX = $state(0); // Start position in screen coordinates (for reliable tracking)
	let dragStartSlideIndex = $state(0); // Track which slide we started dragging from
	let activePointerId = $state<number | null>(null); // Track the active pointer ID for multi-touch

	const frameSpacing = $derived(frameWidth + frameGap);
	const sliderFrameOffsets = $derived(
		Array.from({ length: numFrames }, (_, i) => i * frameSpacing)
	);
	// Position slider group so current frame is centered
	// Shift right by 10% of mainLayout width, but adjust for portrait screens >375px
	const rightShift = $derived.by(() => {
		const baseShift = mainLayout.width * 0.1;
		// On portrait screens >375px, shift 19% to the left (reduce right shift)
		if (isPortrait && canvasSizes.width > 375) {
			return baseShift - (mainLayout.width * 0.19);
		}
		return baseShift;
	});
	const sliderGroupX = $derived(
		isSliderMode ? -currentSlideIndex * frameSpacing + sliderDragOffset + rightShift : 0
	);
	

	// Normal mode positions (non-slider)
	const normalFramePositions = $derived(
		(() => {
			const framesGroupWidth = frameWidth * numFrames + frameGap * (numFrames - 1);
			const framesGroupStartX = (mainLayout.width - framesGroupWidth) * 0.5;
			// Shift right by 10% of mainLayout width, but adjust for different layouts
			let rightShift = mainLayout.width * 0.1;
			if (isLandscape) {
				rightShift = 0;
			} else if (isDesktop) {
				// On desktop, shift 12% to the left (reduce right shift by 12%)
				rightShift = mainLayout.width * 0.1 - (mainLayout.width * 0.10);
			}
			return Array.from(
				{ length: numFrames },
				(_, i) => framesGroupStartX + i * (frameWidth + frameGap) + frameWidth * 0.5 + rightShift
			);
		})()
	);

	// Reset slider state when leaving slider mode
	// IMPORTANT: Don't reset if we're currently dragging
	$effect(() => {
		if (!isSliderMode && !isDragging) {
			currentSlideIndex = 0;
			sliderDragOffset = 0;
			isDragging = false;
			activePointerId = null;
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
		}
	});

	// Slider drag handlers - using PIXI event coordinates
	const handlePointerDown = (e: any) => {
		if (!isSliderMode) {
			return;
		}
		// Cancel any ongoing animation
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		
		isDragging = true;
		activePointerId = e.pointerId ?? null;
		dragStartSlideIndex = currentSlideIndex;
		
		// Reset drag offset FIRST, before calculating dragStartX
		sliderDragOffset = 0;
		
		// Store both screen and world coordinates for reliable tracking
		if (e.clientX !== undefined) {
			dragStartClientX = e.clientX;
			dragStartX = screenToWorldX(e.clientX);
		} else if (e.globalX !== undefined) {
			dragStartX = e.globalX;
			// Try to get clientX from the event if available
			dragStartClientX = e.clientX ?? 0;
		} else {
			dragStartX = 0;
			dragStartClientX = 0;
		}
		e.stopPropagation();
	};

	const handlePointerMove = (e: any) => {
		if (!isDragging || !isSliderMode) {
			return;
		}
		
		// Use clientX for tracking - it's the most reliable
		if (e.clientX === undefined) {
			return;
		}
		
		const currentClientX = e.clientX;
		
		// Calculate delta in screen pixels
		const deltaClientX = currentClientX - dragStartClientX;
		
		// Get the current canvas dimensions for scaling
		const app = pixiContext.stateApp.pixiApplication;
		if (!app || !app.canvas) {
			return;
		}
		
		const canvas = app.canvas;
		const rect = canvas.getBoundingClientRect();
		const canvasSizes = context.stateLayoutDerived.canvasSizes();
		
		// Convert screen pixel delta to world coordinate delta
		// The correct conversion: world coordinates use canvasSizes.width as the full width
		// Screen coordinates use rect.width as the full width
		// So: 1 screen pixel = (canvasSizes.width / rect.width) world units
		const worldToScreenRatio = canvasSizes.width / rect.width;
		const deltaWorldX = deltaClientX * worldToScreenRatio;
		
		// Update the drag offset - this allows free bidirectional movement
		// No clamping or limits - user can drag as far as they want
		sliderDragOffset = deltaWorldX;
		
		if (e.stopPropagation) {
			e.stopPropagation();
		}
	};

	// Store animation frame ID to cancel ongoing animations
	let animationFrameId = $state<number | null>(null);

	const handlePointerUp = (e: any) => {
		if (!isDragging || !isSliderMode) return;
		
		isDragging = false;
		activePointerId = null;
		
		// Cancel any ongoing animation
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		
		const swipeThreshold = frameSpacing * 0.2; // 20% of frame spacing to trigger slide change
		// Also allow slide change based on absolute pixel movement (more forgiving for small screens)
		const minSwipePixels = 50; // Minimum 50px movement to trigger slide change
		
		// Determine if we should change slides based on current drag offset
		// Use the current drag offset (which is relative to dragStartX)
		// Negative offset means dragged left (next slide), positive means dragged right (previous slide)
		let newSlideIndex = currentSlideIndex;
		const absOffset = Math.abs(sliderDragOffset);
		
		// Check both threshold-based and pixel-based swipe detection
		if (sliderDragOffset < -swipeThreshold && currentSlideIndex < numFrames - 1) {
			newSlideIndex = currentSlideIndex + 1;
		} else if (sliderDragOffset > swipeThreshold && currentSlideIndex > 0) {
			newSlideIndex = currentSlideIndex - 1;
		} else if (absOffset >= minSwipePixels) {
			// Also check absolute pixel movement as fallback
			if (sliderDragOffset < 0 && currentSlideIndex < numFrames - 1) {
				newSlideIndex = currentSlideIndex + 1;
			} else if (sliderDragOffset > 0 && currentSlideIndex > 0) {
				newSlideIndex = currentSlideIndex - 1;
			}
		}
		
		// Calculate the offset we need to animate from
		// When we change slides, we need to account for the slide change
		const slideChange = newSlideIndex - currentSlideIndex;
		const remainingOffset = sliderDragOffset - (slideChange * frameSpacing);
		
		// Update slide index
		currentSlideIndex = newSlideIndex;
		
		// Animate the remaining offset back to 0
		const startOffset = remainingOffset;
		sliderDragOffset = startOffset;
		const duration = 250;
		const startTime = performance.now();

		const animate = () => {
			const elapsed = performance.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			sliderDragOffset = startOffset * (1 - eased);

			if (progress < 1) {
				animationFrameId = requestAnimationFrame(animate);
			} else {
				sliderDragOffset = 0;
				animationFrameId = null;
			}
		};

		animationFrameId = requestAnimationFrame(animate);

		e.stopPropagation?.();
	};

	// Calculate vertical position (centered, then moved 40px down)
	// On small landscape screens, move blocks down 10px more
	const framesY = $derived(
		mainLayout.height * 0.5 + 40 + (isLandscape && canvasSizes.width <= 450 ? 10 : 0)
	);

	// Position button above the bottom of the blocks (accounting for button center anchor)
	// Margin reduced by 60%: 30px * 0.4 = 12px
	const buttonY = $derived(framesY + frameHeight * 0.5 + 12 + (buttonHeight * buttonScale * 0.5) + (isSmallScreen ? 40 : 0));
	const buttonYWithViewportOffset = $derived(buttonY + buttonYOffset1200x675);

	// Frame text content
	const frameTexts = [
		'Silver Sword symbols may carry variable multiplier values and expand vertically to occupy the entire reel.',
		'Elixir Flask symbols interact with expanding Silver Sword symbols, applying an extra multiplier effect.',
		'Maximum payout: 20,000× bet',
	];

	// Text style for frame content
	const frameTextStyle = $derived({
		fontFamily: 'Chelsea Market, Arial, sans-serif',
		fontSize:
			UI_BASE_FONT_SIZE *
			0.45 *
			(isLandscape ? 1.10 : 0.7) *
			(isSmallDesktop ? 1.2 : 1) *
			(isNarrowDesktop ? 1.2 : 1) *
			(isLandscapeLayout ? 1.2 : 1) *
			(isNarrowDesktop1200 ? 1.15 : 1) *
			(isUltraNarrow ? 0.8 : 1) *
			(isSmallScreen ? 0.8 : 1) * // 20% smaller on screens < 380px wide
			portraitTextScale *
			tabletTextScale *
			1.15 * // Increase by 15%
			(isMidDesktopViewport ? 1.15 : 1) * // Increase by 15% on 1200x675-like desktop screens
			portraitNarrowTextScale * // Additional 15% for portrait screens with width < 500
			ultraNarrowTextScale * // Additional 15% for all screens with width < 500
			1.07 * // Additional 7% increase for welcome box text
			viewport425x812TextScale * // 15% larger on 425x812-like screens
			widthBasedTextScale, // Width-based reduction tier for 1124 and 1050 breakpoints
		fontWeight: 400 as any,
		fill: 0xFFFFFF,
		align: 'center' as const,
		wordWrap: true,
		wordWrapWidth: frameWidth * 0.8, // 80% of frame width for padding
	});

	// Text style for first block (with extra left padding)
	const frameTextStyleFirst = $derived({
		fontFamily: 'Chelsea Market, Arial, sans-serif',
		fontSize:
			UI_BASE_FONT_SIZE *
			0.45 *
			(isLandscape ? 1.10 : 0.7) *
			(isSmallDesktop ? 1.2 : 1) *
			(isNarrowDesktop ? 1.2 : 1) *
			(isLandscapeLayout ? 1.2 : 1) *
			(isNarrowDesktop1200 ? 1.15 : 1) *
			(isUltraNarrow ? 0.8 : 1) *
			firstBlockLargeDesktopScale * // Width-based large-screen reduction for first block text
			(isSmallScreen ? 0.8 * 0.9 : 1) * // 20% + extra 10% smaller on screens < 380px wide
			portraitTextScale *
			tabletTextScale *
			1.25 * // Increase by 15%
			(isMidDesktopViewport ? 1.15 : 1) * // Increase by 15% on 1200x675-like desktop screens
			portraitNarrowTextScale * // Additional 15% for portrait screens with width < 500
			ultraNarrowTextScale * // Additional 15% for all screens with width < 500
			1.07 * // Additional 7% increase for welcome box text
			viewport425x812TextScale * // 15% larger on 425x812-like screens
			widthBasedTextScale * // Width-based reduction tier for 1124 and 1050 breakpoints
			firstBlockResolutionTextScale, // Viewport-specific first-block adjustments
		fontWeight: 400 as any,
		fill: 0xFFFFFF,
		align: 'center' as const,
		wordWrap: true,
		wordWrapWidth: frameWidth * 0.8 - 40 - firstBlockExtraLeftPadding, // Extra left padding on 800x450-like screens
	});

	const frameTextXFirst = $derived((40 + firstBlockExtraLeftPadding) * 0.5); // Shift right by half of the padding to maintain visual balance

	// Image dimensions from spritesheet (original sizes)
	const imageSizes = {
		sword: { width: 193, height: 470 },
		'50x': { width: 171, height: 171 },
		elicsir: { width: 181, height: 181 },
		sens2000: { width: 373, height: 350 },
	};

	// Calculate image scales to fit within frames (with some padding), then double the size
	const imageScale = $derived((frameWidth * 0.3 / Math.max(imageSizes.sword.width, imageSizes['50x'].width)) * 2); // Scale based on frame width, doubled
	const imageScaleSens = $derived((frameWidth * 0.4 / imageSizes.sens2000.width) * 2 * 1.2); // Slightly larger for sens2000, doubled, then increased by 20%

	// Calculate image positions
	// Frame boundaries: left = -frameWidth/2, right = frameWidth/2, top = -frameHeight/2, bottom = frameHeight/2
	// First block: sword.png near left border, 50x.png centered horizontally, top aligned
	const swordX = $derived(-frameWidth * 0.45 - 50); // Near left border (with padding from edge), moved 50px left
	const swordY = $derived(-frameHeight * 0.4 + 80); // Positioned in upper area, moved 50px down
	const multiplierX = $derived(0); // Centered horizontally
	const multiplierY = $derived(-frameHeight * 0.4 + 20); // Top aligned

	// Second block: elicsir.png centered horizontally, top aligned
	const elicsirX = $derived(0); // Centered horizontally
	const elicsirY = $derived(-frameHeight * 0.4 +35); // Top aligned

	// Third block: sens2000.png centered horizontally, top aligned
	const sens2000X = $derived(0); // Centered horizontally
	const sens2000Y = $derived(-frameHeight * 0.4 + 40); // Top aligned, moved 40px down

	// Calculate text Y position below images to avoid overlap
	// Images are anchored at center, so bottom edge = imageY + (imageHeight / 2)
	const frameTextY = $derived.by(() => {
		// Calculate bottom edge of each image
		const block0ImageBottom = multiplierY + (imageSizes['50x'].height * imageScale / 2);
		const block1ImageBottom = elicsirY + (imageSizes.elicsir.height * imageScale / 2);
		const block2ImageBottom = sens2000Y + (imageSizes.sens2000.height * imageScaleSens / 2);
		
		// Find the maximum bottom edge (lowest image)
		const maxImageBottom = Math.max(block0ImageBottom, block1ImageBottom, block2ImageBottom);
		
		// Position text below the lowest image with 20px padding
		return maxImageBottom + 20;
	});

	// Text Y position for first two blocks (raised by additional 60% from current position)
	const frameTextYFirstTwo = $derived(frameTextY * 0.1 -20);
	// Text Y position for first block only - positioned much higher, near the top of the frame, lowered by 15%
	// On tall desktop screens (height > 1300px, e.g. 3008x1384) move the text up by 50px to compensate
	// for the smaller frameHeight caused by larger mainLayout.scale on taller viewports
	const frameTextYFirst = $derived(
		-frameHeight * 0.5 + 145 + (isDesktop && canvasSizes.height > 1300 ? -50 : 0) + (isSmallScreen ? -15 : 0) + firstBlockExtraTopPadding
	);

const textStyle = $derived({
	fontFamily: 'Kanit, Arial, sans-serif',
	// Increase CTA button label by an additional 15% and center vertically
	fontSize: UI_BASE_FONT_SIZE * 0.3 * 1.15 * 1.2 * 1.15,
	fontWeight: 600 as any,
	fill: 0x61E5FF,
	align: 'center' as const,
});

	const handlePress = () => {
		// Mark that we've shown the welcome frames, so they won't appear again
		hasShownWelcomeFrames = true;
		props.onpress();
	};
</script>

{#if shouldShowWelcomeFrames}
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.2} zIndex={9998} eventMode="none" />

	<!-- Welcome frame blocks -->
	<MainContainer zIndex={9999}>
		{#if isSliderMode}
			<!-- Slider mode: Slider with drag/swipe functionality -->
			<!-- Content container -->
			<Container
				x={0}
				y={framesY}
				eventMode="none"
			>
				<!-- Mask graphics - wide enough to show all frames when sliding -->
				<Graphics
					draw={(graphics) => {
						graphics.clear();
						// Make mask wide enough to show all 3 frames plus sliding space
						const totalFramesWidth = frameWidth * numFrames + frameGap * (numFrames - 1);
						const maxSlideDistance = (numFrames - 1) * frameSpacing;
						const maskWidth = Math.max(mainLayout.width, totalFramesWidth + maxSlideDistance);
						graphics.rect(-maskWidth * 0.5, -mainLayout.height * 0.5, maskWidth, mainLayout.height);
						graphics.fill({ color: 0xffffff, alpha: 1 });
					}}
					eventMode="none"
					isMask={true}
				/>
				<Container x={sliderGroupX} y={0} eventMode="none">
					{#each sliderFrameOffsets as offset, index}
						<Container
							x={offset}
							y={0}
							scale={viewport375x667BlockScale}
							eventMode="none"
						>
							<!-- Inner background (behind frame) -->
							<Graphics
								draw={(graphics) => {
									graphics.clear();
									graphics.rect(-frameWidth * 0.5, -frameHeight * 0.5, frameWidth, frameHeight);
									graphics.fill({ color: 0x000000, alpha: 0.6 });
								}}
								eventMode="none"
							/>

							<Sprite
								key="welcome_frame.png"
								width={frameWidth}
								height={frameHeight}
								anchor={{ x: 0.5, y: 0.5 }}
								x={0}
								y={0}
								eventMode="none"
							/>

							<!-- First block: sword.png and 50x.png -->
							{#if index === 0}
								<Sprite
									key="sword.png"
									width={imageSizes.sword.width * imageScale}
									height={imageSizes.sword.height * imageScale}
									anchor={{ x: 0.5, y: 0.5 }}
									x={swordX}
									y={swordY}
									eventMode="none"
								/>
								<Sprite
									key="50x.png"
									width={imageSizes['50x'].width * imageScale}
									height={imageSizes['50x'].height * imageScale}
									anchor={{ x: 0.5, y: 0.5 }}
									x={multiplierX}
									y={multiplierY}
									eventMode="none"
								/>
							{/if}

							<!-- Second block: elicsir.png -->
							{#if index === 1}
								<Sprite
									key="elicsir.png"
									width={imageSizes.elicsir.width * imageScale}
									height={imageSizes.elicsir.height * imageScale}
									anchor={{ x: 0.5, y: 0.5 }}
									x={elicsirX}
									y={elicsirY}
									eventMode="none"
								/>
							{/if}

							<!-- Third block: sens2000.png -->
							{#if index === 2}
								<Sprite
									key="sens2000.png"
									width={imageSizes.sens2000.width * imageScaleSens}
									height={imageSizes.sens2000.height * imageScaleSens}
									anchor={{ x: 0.5, y: 0.5 }}
									x={sens2000X}
									y={sens2000Y}
									eventMode="none"
								/>
							{/if}

							{#if fontLoaded}
								{#if index === 0}
									<Text
										text={frameTexts[index]}
										style={frameTextStyleFirst}
										anchor={{ x: 0.5, y: 0 }}
										x={frameTextXFirst}
										y={frameTextYFirst}
										eventMode="none"
									/>
								{:else if index === 1}
									<Text
										text={frameTexts[index]}
										style={frameTextStyle}
										anchor={{ x: 0.5, y: 0 }}
										x={0}
										y={frameTextYFirstTwo}
										eventMode="none"
									/>
								{:else}
									<Text
										text={frameTexts[index]}
										style={frameTextStyle}
										anchor={{ x: 0.5, y: 0 }}
										x={0}
										y={frameTextY}
										eventMode="none"
									/>
								{/if}
							{/if}
						</Container>
					{/each}
				</Container>
			</Container>
		{:else}
			<!-- Non-slider: Normal centered layout -->
			{#each normalFramePositions as frameX, index}
				<Container
					x={frameX}
					y={framesY}
					scale={viewport375x667BlockScale}
					eventMode="none"
				>
					<!-- Inner background (behind frame) -->
					<Graphics
						draw={(graphics) => {
							graphics.clear();
							graphics.rect(-frameWidth * 0.5, -frameHeight * 0.5, frameWidth, frameHeight);
							graphics.fill({ color: 0x000000, alpha: 0.6 });
						}}
						eventMode="none"
					/>

					<Sprite
						key="welcome_frame.png"
						width={frameWidth}
						height={frameHeight}
						anchor={{ x: 0.5, y: 0.5 }}
						x={0}
						y={0}
						eventMode="none"
					/>

					<!-- First block: sword.png and 50x.png -->
					{#if index === 0}
						<Sprite
							key="sword.png"
							width={imageSizes.sword.width * imageScale}
							height={imageSizes.sword.height * imageScale}
							anchor={{ x: 0.5, y: 0.5 }}
							x={swordX}
							y={swordY}
							eventMode="none"
						/>
						<Sprite
							key="50x.png"
							width={imageSizes['50x'].width * imageScale}
							height={imageSizes['50x'].height * imageScale}
							anchor={{ x: 0.5, y: 0.5 }}
							x={multiplierX}
							y={multiplierY}
							eventMode="none"
						/>
					{/if}

					<!-- Second block: elicsir.png -->
					{#if index === 1}
						<Sprite
							key="elicsir.png"
							width={imageSizes.elicsir.width * imageScale}
							height={imageSizes.elicsir.height * imageScale}
							anchor={{ x: 0.5, y: 0.5 }}
							x={elicsirX}
							y={elicsirY}
							eventMode="none"
						/>
					{/if}

					<!-- Third block: sens2000.png -->
					{#if index === 2}
						<Sprite
							key="sens2000.png"
							width={imageSizes.sens2000.width * imageScaleSens}
							height={imageSizes.sens2000.height * imageScaleSens}
							anchor={{ x: 0.5, y: 0.5 }}
							x={sens2000X}
							y={sens2000Y}
							eventMode="none"
						/>
					{/if}

					{#if fontLoaded}
						{#if index === 0}
							<Text
								text={frameTexts[index]}
								style={frameTextStyleFirst}
								anchor={{ x: 0.5, y: 0 }}
								x={frameTextXFirst}
								y={frameTextYFirst}
								eventMode="none"
							/>
						{:else if index === 1}
							<Text
								text={frameTexts[index]}
								style={frameTextStyle}
								anchor={{ x: 0.5, y: 0 }}
								x={0}
								y={frameTextYFirstTwo}
								eventMode="none"
							/>
						{:else}
							<Text
								text={frameTexts[index]}
								style={frameTextStyle}
								anchor={{ x: 0.5, y: 0 }}
								x={0}
								y={frameTextY}
								eventMode="none"
							/>
						{/if}
					{/if}
				</Container>
			{/each}
		{/if}
	</MainContainer>

	<MainContainer alignVertical="bottom" zIndex={10000}>
		<Container
			x={buttonX}
			y={buttonYWithViewportOffset}
			eventMode="static"
			cursor="pointer"
			interactive={true}
			hitArea={new PIXI.Rectangle(
				0,
				0,
				buttonWidth * buttonScale,
				buttonHeight * buttonScale
			)}
			onpointerover={(e) => {
				e.stopPropagation();
				isHovered = true;
			}}
			onpointerout={(e) => {
				e.stopPropagation();
				isHovered = false;
			}}
			onpointerup={(e) => {
				e.stopPropagation();
				handlePress();
			}}
		>
			<Sprite
				key={buttonSpriteKey}
				width={buttonWidth * buttonScale}
				height={buttonHeight * buttonScale}
				anchor={{ x: 0.5, y: 0.5 }}
				x={0}
				y={0}
				eventMode="none"
			/>

			<Text
				text="CLICK TO CONTINUE"
				style={textStyle}
				anchor={{ x: 0.5, y: 0.5 }}
				x={0}
				y={5}
				eventMode="none"
			/>
		</Container>
	</MainContainer>
{/if}
<OnHotkey hotkey="Space" onpress={handlePress} />
<OnPressFullScreen onpress={handlePress} />
