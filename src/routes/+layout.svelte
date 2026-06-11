<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	let isOffline = $state(false);

	onMount(() => {
		function syncNetworkState() {
			isOffline = !navigator.onLine;
		}

		syncNetworkState();
		window.addEventListener('online', syncNetworkState);
		window.addEventListener('offline', syncNetworkState);

		return () => {
			window.removeEventListener('online', syncNetworkState);
			window.removeEventListener('offline', syncNetworkState);
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

{#if isOffline}
	<div
		class="fixed inset-x-3 bottom-3 z-50 rounded-lg bg-ink px-4 py-3 text-center text-sm font-medium text-bg shadow-lg md:left-auto md:right-4 md:w-fit"
		role="status"
		aria-live="polite"
	>
		Tá tú as líne. Leanann Liosta ag obair.
	</div>
{/if}
