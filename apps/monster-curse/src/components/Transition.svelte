<script lang="ts" module>
	export type EmitterEventTransition = { type: 'transition' };
</script>

<script lang="ts">
	import { getContext } from '../game/context';

	const context = getContext();

	context.eventEmitter.subscribeOnMount({
		transition: async () => {
			// No transition animation - complete immediately
		},
	});
</script>
