<script lang="ts">
	// https://lingui.dev/installation#vite
	// https://lingui.dev/tutorials/javascript
	// https://lingui.dev/ref/vite-plugin

	import { stateI18nDerived } from 'state-shared';

	import { onMount, type Snippet } from 'svelte';

	import { stateUrlDerived, type Language } from 'state-shared';
	import type { MessagesMap, SweepsLanguage } from 'utils-shared/i18n';

	type Props = {
		debug?: boolean;
		children: Snippet;
		messagesMap: MessagesMap;
	};

	const props: Props = $props();

	let loaded = $state(false);

	const loadMessages = (lang: Language | SweepsLanguage) => {
		const messages = props.messagesMap[lang];
		if (props.debug) console.log({ messages });
		return messages;
	};

	onMount(() => {
		try {
			const lang = stateUrlDerived.lang();
			const sweepsLang: SweepsLanguage = `sweeps_${lang}`;
			const useSweeps = stateUrlDerived.social() && sweepsLang in props.messagesMap;
			const activeLang = useSweeps ? sweepsLang : lang;
			const messages = loadMessages(activeLang);
			stateI18nDerived.init(lang, messages ?? {});
		} catch (error) {
			console.error("Loading fallback locale 'en' because of error", error);
			try {
				const messages = loadMessages('en');
				stateI18nDerived.init('en', messages ?? {});
			} catch (error) {
				console.error("Loading fallback locale 'en' without any messages because of error", error);
				stateI18nDerived.init('en', {});
			}
		}
		loaded = true;
	});
</script>

{#if loaded}
	{@render props.children()}
{/if}
