<script lang="ts">
	import { LayoutGrid } from 'lucide-svelte';
	import { itemsStore } from '$lib/stores/items.svelte';
	import { listsStore } from '$lib/stores/lists.svelte';

	let {
		isOpen = false,
		onSelect
	}: {
		isOpen?: boolean;
		onSelect?: () => void;
	} = $props();

	let editingId = $state<string | null>(null);
	let editingName = $state('');
	let confirmDeleteId = $state<string | null>(null);
	let inputEl: HTMLInputElement | undefined = $state();

	$effect(() => {
		if (editingId && inputEl) {
			inputEl.focus();
			inputEl.select();
		}
	});

	function startEdit(list: { id: string; name: string }) {
		editingId = list.id;
		editingName = list.name;
		confirmDeleteId = null;
	}

	function commitEdit() {
		if (editingId) listsStore.rename(editingId, editingName);
		editingId = null;
	}

	function addList() {
		const list = listsStore.create();
		startEdit(list);
	}

	function selectList(id: string) {
		listsStore.setActive(id);
		onSelect?.();
	}
</script>

<aside
	class="fixed inset-y-0 left-0 z-40 w-70 shrink-0 flex flex-col h-dvh border-r border-ink/10 bg-bg shadow-2xl transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0 md:shadow-none
	       {isOpen ? 'translate-x-0' : '-translate-x-full'}"
	aria-label="Roghnóir liostaí"
	data-tour="list-switcher"
>
	<!-- Brand -->
	<div class="px-6 pt-7 pb-4">
		<h1 class="font-serif text-[28px] font-bold text-green leading-none">Liosta</h1>
		<p class="mt-1 text-[11px] text-ink/40">Athbheochan Labs</p>
	</div>

	<div class="mx-5 h-px bg-ink/10 mb-2"></div>

	<!-- List nav -->
	<nav class="flex-1 overflow-y-auto px-3 py-1 space-y-px" aria-label="Liostaí" data-tour="list-nav">
		{#each listsStore.lists as list (list.id)}
			{@const isActive = list.id === listsStore.activeId}
			{@const isEditing = editingId === list.id}
			{@const isPendingDelete = confirmDeleteId === list.id}
			{@const itemCount = itemsStore.itemCount(list.id)}

			<div
				class="group flex items-center gap-1.5 rounded-xl px-3 py-2.75 transition-colors
				       {isActive ? 'bg-green/10' : 'hover:bg-ink/5'}"
				data-tour={isActive ? 'active-list' : undefined}
			>
				{#if isEditing}
					<input
						bind:this={inputEl}
						type="text"
						bind:value={editingName}
						class="flex-1 bg-transparent text-sm font-medium text-ink outline-none"
						onkeydown={(e) => {
							if (e.key === 'Enter') commitEdit();
							if (e.key === 'Escape') editingId = null;
						}}
						onblur={commitEdit}
					/>
					<button
						onclick={commitEdit}
						class="shrink-0 text-xs text-green opacity-80 hover:opacity-100"
						aria-label="Deimhnigh"
					>✓</button>

				{:else if isPendingDelete}
					<span class="flex-1 text-sm opacity-40 line-through">{list.name}</span>
					<span class="shrink-0 text-[11px] text-ink/50">Scrios?</span>
					<button
						onclick={() => { listsStore.delete(list.id); confirmDeleteId = null; }}
						class="shrink-0 text-xs text-green font-semibold"
						aria-label="Deimhnigh scriosadh"
					>✓</button>
					<button
						onclick={() => (confirmDeleteId = null)}
						class="shrink-0 text-xs text-ink/40"
						aria-label="Cealaigh"
					>✕</button>

				{:else}
					<button
						onclick={() => selectList(list.id)}
						class="flex-1 text-left font-serif text-[15px] leading-snug
						       {isActive ? 'text-green font-semibold' : 'text-ink'}"
					>
						{list.name}
					</button>

					<!-- hover actions — always in DOM so badge doesn't shift -->
					<button
						onclick={(e) => { e.stopPropagation(); startEdit(list); }}
						class="shrink-0 opacity-0 group-hover:opacity-30 hover:opacity-70!
						       text-[11px] text-ink transition-opacity"
						aria-label="Athainmnigh"
						data-tour={isActive ? 'rename-list' : undefined}
					>✎</button>
					{#if listsStore.lists.length > 1}
						<button
							onclick={(e) => { e.stopPropagation(); confirmDeleteId = list.id; editingId = null; }}
							class="shrink-0 opacity-0 group-hover:opacity-30 hover:opacity-70!
							       text-[11px] text-ink transition-opacity"
							aria-label="Scrios"
						>✕</button>
					{/if}

					<!-- badge -->
					<span
						class="shrink-0 min-w-5.5 h-5.5 rounded-full flex items-center justify-center
						       text-[11px] font-medium tabular-nums
						       {isActive ? 'bg-green text-bg' : 'bg-ink/10 text-ink/40'}"
					>{itemCount}</span>
				{/if}
			</div>
		{/each}
	</nav>

	<!-- Add list -->
	<div class="border-t border-ink/10 px-5 py-5">
		<button
			onclick={addList}
			class="flex items-center gap-2.5 text-[13px] text-ink/40 hover:text-ink/60 transition-colors"
			data-tour="new-list"
		>
			<LayoutGrid size={14} />
			Liosta nua
		</button>
	</div>
</aside>
