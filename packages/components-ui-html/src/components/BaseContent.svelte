<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		maxWidth?: '100%' | '500px' | string;
		width?: string;
		height?: string;
		children: Snippet;
	};

	const props: Props = $props();

	// Calculate responsive dimensions based on viewport size
	const getResponsiveDimensions = () => {
		if (typeof window === 'undefined') return { width: props.width || 'auto', height: props.height || 'auto' };
		
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		
		// For very small screens (mobile portrait)
		if (vw <= 480) {
			return {
				width: '95vw',
				height: 'auto',
				maxHeight: '90vh'
			};
		}
		// For small screens (mobile landscape, small tablets)
		else if (vw <= 768) {
			return {
				width: '90vw',
				height: 'auto',
				maxHeight: '85vh'
			};
		}
		// For medium screens (tablets)
		else if (vw <= 1024) {
			return {
				width: '80vw',
				height: 'auto',
				maxHeight: '80vh'
			};
		}
		// For large screens (desktop) - use original dimensions or fallback
		else {
			return {
				width: props.width || '720px',
				height: props.height || '420px',
				maxHeight: '90vh'
			};
		}
	};

	let dimensions = $state(getResponsiveDimensions());

	// Update dimensions on window resize
	if (typeof window !== 'undefined') {
		window.addEventListener('resize', () => {
			dimensions = getResponsiveDimensions();
		});
	}
</script>

<div 
	class="ui-popup-standard-content-wrap" 
	style="--maxWidth: {props.maxWidth || '100%'}; --width: {dimensions.width}; --height: {dimensions.height}; --maxHeight: {dimensions.maxHeight}; --zIndex: {100}"
>
	{@render props.children()}
</div>

<style lang="scss">
	.ui-popup-standard-content-wrap {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		z-index: var(--zIndex);
		max-width: var(--maxWidth);
		width: var(--width);
		height: var(--height);
		max-height: var(--maxHeight);
		gap: 1rem;
		background-color: #141417;
		opacity: 0.95;
		border-radius: 12px;
		padding: 2rem;
		box-sizing: border-box;
		overflow-y: auto;
		overflow-x: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

		// Mobile responsive adjustments
		@media (max-width: 480px) {
			padding: 1rem;
			gap: 0.75rem;
			border-radius: 8px;
		}

		@media (max-width: 768px) {
			padding: 1.5rem;
			gap: 0.875rem;
		}

		@media (max-height: 600px) {
			padding: 1rem;
			gap: 0.5rem;
		}
	}
</style>
