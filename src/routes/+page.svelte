<script lang="ts">
	import ItemList from '$lib/components/ItemList.svelte';
	import ListPanel from '$lib/components/ListPanel.svelte';
	import { listsStore } from '$lib/stores/lists.svelte';
</script>

<div class="flex h-dvh overflow-hidden bg-bg text-ink">
	<ListPanel />

	{#if listsStore.active}
		<ItemList list={listsStore.active} />
	{/if}
</div>
