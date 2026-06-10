<script lang="ts">
	import { LayoutGrid } from 'lucide-svelte';
	import type { List } from '$lib/stores/lists.svelte';
	import { itemsStore } from '$lib/stores/items.svelte';

	let { list }: { list: List } = $props();

	let newItemName = $state('');

	let items = $derived(itemsStore.forList(list.id));
	let doneCount = $derived(itemsStore.doneCount(list.id));

	function addItem() {
		itemsStore.add(list.id, newItemName);
		newItemName = '';
	}
</script>

<div class="flex flex-col flex-1 overflow-hidden">
	<!-- Header -->
	<div class="flex items-start justify-between px-8 pt-7 pb-5">
		<h2 class="font-serif text-[32px] font-bold leading-tight text-ink">{list.name}</h2>
		{#if doneCount > 0}
			<span class="mt-1 shrink-0 ml-6 text-sm text-ink/40">{doneCount} críochnaithe</span>
		{/if}
	</div>

	<!-- Add-item input -->
	<div class="px-6 pb-4 flex gap-2">
		<input
			type="text"
			bind:value={newItemName}
			onkeydown={(e) => e.key === 'Enter' && addItem()}
			placeholder="Cuir mír leis..."
			class="flex-1 rounded-xl bg-ink text-bg placeholder:text-bg/40
			       px-5 py-4 text-sm font-medium outline-none"
		/>
		<button
			onclick={addItem}
			aria-label="Cuir leis"
			class="shrink-0 w-14 rounded-xl bg-ink/8 hover:bg-ink/15 transition-colors
			       flex items-center justify-center text-ink/50 hover:text-ink"
		>
			<span class="text-base leading-none">↑</span>
		</button>
	</div>

	<div class="mx-6 h-px bg-ink/10"></div>

	<!-- Items -->
	<ul class="flex-1 overflow-y-auto px-8">
		{#each items as item (item.id)}
			<li class="flex items-center gap-4 py-5 border-b border-ink/6 last:border-0">
				{#if item.done}
					<button
						onclick={() => itemsStore.toggle(list.id, item.id)}
						class="shrink-0 w-9 h-9 rounded-full bg-green flex items-center justify-center"
						aria-label="Díchomharthaigh"
					>
						<LayoutGrid size={14} class="text-[#f5f3ee]" strokeWidth={1.5} />
					</button>
					<span class="flex-1 text-[15px] text-ink/35 line-through">{item.name}</span>
				{:else}
					<button
						onclick={() => itemsStore.toggle(list.id, item.id)}
						class="shrink-0 w-9 h-9 rounded-full border-2 border-ink/15
						       hover:border-ink/30 transition-colors"
						aria-label="Comharthaigh"
					></button>
					<span class="flex-1 text-[15px] text-ink">{item.name}</span>
				{/if}
			</li>
		{/each}

		{#if items.length === 0}
			<li class="pt-6 text-sm text-ink/30">Níl mír ar bith anseo fós.</li>
		{/if}
	</ul>

	<!-- Footer -->
	{#if doneCount > 0}
		<div class="border-t border-ink/10 px-8 py-5 flex items-center justify-between">
			<span class="text-sm text-ink/50">{doneCount} mír críochnaithe</span>
			<button
				onclick={() => itemsStore.clearDone(list.id)}
				class="text-sm text-ink/40 hover:text-ink/70 transition-colors"
			>
				Glan
			</button>
		</div>
	{/if}
</div>
