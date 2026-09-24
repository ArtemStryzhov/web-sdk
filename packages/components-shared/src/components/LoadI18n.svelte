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

	// Social (sweepstakes) builds swap in the compliant wording where it exists.
	// `stateUrlDerived.lang()` already collapses to 'en' for them, so this only ever
	// resolves to `sweeps_en` there — no other locale is reachable in a social build.
	const resolveMessagesKey = (lang: Language): Language | SweepsLanguage => {
		const sweepsLang: SweepsLanguage = `sweeps_${lang}`;
		return stateUrlDerived.social() && sweepsLang in props.messagesMap ? sweepsLang : lang;
	};

	onMount(() => {
		try {
			const lang = stateUrlDerived.lang();
			const messages = loadMessages(resolveMessagesKey(lang));
			stateI18nDerived.init(lang, messages ?? {});
		} catch (error) {
			console.error("Loading fallback locale 'en' because of error", error);
			try {
				const messages = loadMessages(resolveMessagesKey('en'));
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
