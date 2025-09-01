<script lang="ts">
	import LoaderBase from './LoaderBase.svelte';

	type Props = {
		src: string;
	};

	const props: Props = $props();

</script>

<LoaderBase
	maxWidth={200}
	backgroundColor={'#000000'}
	timeout={5000}
	src={props.src}
/>

