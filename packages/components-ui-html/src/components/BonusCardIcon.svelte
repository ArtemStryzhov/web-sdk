<script lang="ts">
	type Props = {
		index: number;
	};

	const props: Props = $props();
</script>

{#if props.index === 0}
	<div class="icon-sprite icon-3icons"></div>
{:else if props.index === 1}
	<div class="icon-sprite icon-4icons"></div>
{/if}

<style lang="scss">
	.icon-sprite {
		background-image: var(--spritesheet-url);
		background-size: 2884px 2027px;
		background-repeat: no-repeat;
		pointer-events: none;
	}

	.icon-3icons {
		margin-top: 35px;
		width: 156px;
		height: 156px;
		background-position: -1px -1px;
	}

	.icon-4icons {
		margin-top: 35px;
		width: 176px;
		height: 156px;
		background-position: -159px -1px;
	}
</style>
