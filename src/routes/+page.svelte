<script lang="ts">
	import ItemList from '$lib/components/ItemList.svelte';
	import ListPanel from '$lib/components/ListPanel.svelte';
	import { listsStore } from '$lib/stores/lists.svelte';

	let isListPanelOpen = $state(false);

	function closeListPanel() {
		isListPanelOpen = false;
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (isListPanelOpen && event.key === 'Escape') closeListPanel();
	}}
/>

<div class="flex h-dvh overflow-hidden bg-bg text-ink">
	{#if isListPanelOpen}
		<button
			type="button"
			class="fixed inset-0 z-30 bg-ink/35 md:hidden"
			aria-label="Dún liostaí"
			onclick={closeListPanel}
		></button>
	{/if}

	<ListPanel isOpen={isListPanelOpen} onSelect={closeListPanel} />

	{#if listsStore.active}
		<ItemList list={listsStore.active} onOpenLists={() => (isListPanelOpen = true)} />
	{/if}
</div>
