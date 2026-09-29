<script lang="ts">
	type Props = {
		text?: string;
	};

	const props: Props = $props();
</script>

{#if props.text}
	<div class="description">
		{props.text}
	</div>
{/if}

<style lang="scss">
	.description {
		font-family: 'Chelsea Market', 'Arial', sans-serif;
		font-size: 1.16rem; /* 20% smaller */
		text-align: center;
		min-height: 4.5rem;
		white-space: pre-line;
		display: inline-flex;
		align-items: center;
		color: #ffffff;
	}
</style>
