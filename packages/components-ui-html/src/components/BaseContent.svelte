<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		maxWidth?: '100%' | '500px' | string;
		width?: string;
		height?: string;
		children: Snippet;
	};

	const props: Props = $props();
</script>

<div 
	class="ui-popup-standard-content-wrap" 
	style="--maxWidth: {props.maxWidth || '100%'}; --width: {props.width || 'auto'}; --height: {props.height || 'auto'}; --zIndex: {100}"
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
		gap: 1rem;
		background-color: #141417;
		opacity: 0.95;
		border-radius: 12px;
		padding: 2rem;
		box-sizing: border-box;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}
</style>
