<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: Snippet;
		description: Snippet;
		price: Snippet;
		button: Snippet;
	icon?: Snippet;
	};

	const props: Props = $props();
</script>

<div class="bonus-card-wrap">
	<div class="frame">
		{#if props.icon}
			<div class="icon-slot">
				{@render props.icon()}
			</div>
		{/if}
		<div class="frame-content">
			<div class="info">
				{@render props.title()}
				{@render props.description()}
				{@render props.price()}
			</div>
			<div class="cta">
				{@render props.button()}
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.bonus-card-wrap {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 360px;
		aspect-ratio: 846 / 993;
		position: relative;
	}

	.frame {
		--frame-scale: 0.425; /* 360 / 846 */
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		background-image: url('/assets/sprites/common/spritesheet.png');
		background-size: calc(2884px * var(--frame-scale)) calc(2027px * var(--frame-scale));
		background-position: calc(-1827px * var(--frame-scale)) calc(-1033px * var(--frame-scale));
		background-repeat: no-repeat;
	}

	.frame-content {
		position: relative;
		width: 100%;
		height: 100%;
		padding: 48px 36px 42px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.45));
		transform: translateY(-20px);
	}

	.icon-slot {
		position: absolute;
		top: 32px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		text-align: center;
		flex: 1;
		justify-content: flex-end;
		align-items: center;
	}

	.cta {
		width: 100%;
		display: flex;
		justify-content: center;
	}

	@media (max-width: 480px) {
		.bonus-card-wrap {
			width: 280px;
		}
		.frame {
			padding: 36px 28px 32px;
		}
	}
</style>
