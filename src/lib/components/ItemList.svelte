<script lang="ts">
	import { getContext } from 'svelte';
	import { LayoutGrid, Menu, Moon, Sun, X } from 'lucide-svelte';
	import type { List } from '$lib/stores/lists.svelte';
	import type { Item } from '$lib/stores/items.svelte';
	import { itemsStore } from '$lib/stores/items.svelte';

	type TourContext = {
		readonly active: boolean;
	};

	type ThemeContext = {
		readonly theme: 'light' | 'dark';
		toggleTheme: () => void;
	};

	const tour = getContext<TourContext | undefined>('liosta-tour');
	const theme = getContext<ThemeContext | undefined>('liosta-theme');
	const demoItems: Item[] = [
		{ id: 'tour-demo-active', name: 'Bainne', done: false },
		{ id: 'tour-demo-done', name: 'Arán', done: true }
	];

	let {
		list,
		onOpenLists
	}: {
		list: List;
		onOpenLists?: () => void;
	} = $props();

	let newItemName = $state('');
	let draggedItemId = $state<string | null>(null);
	let revealedDeleteId = $state<string | null>(null);
	let confirmClearDone = $state(false);
	let confirmClearListId = $state('');
	let pointerStartX = 0;
	let pointerDeltaX = $state(0);
	let didSwipe = false;

	let storedItems = $derived(itemsStore.forList(list.id));
	let storedDoneCount = $derived(itemsStore.doneCount(list.id));
	let showTourDemo = $derived(Boolean(tour?.active) && storedDoneCount === 0);
	let items = $derived(showTourDemo ? demoItems : storedItems);
	let doneCount = $derived(showTourDemo ? 1 : storedDoneCount);

	function addItem() {
		itemsStore.add(list.id, newItemName);
		newItemName = '';
	}

	$effect(() => {
		if (confirmClearListId !== list.id) {
			confirmClearDone = false;
			confirmClearListId = list.id;
		}
		if (doneCount === 0) confirmClearDone = false;
	});

	function toggleItem(itemId: string) {
		if (showTourDemo) return;
		if (didSwipe) {
			didSwipe = false;
			return;
		}
		revealedDeleteId = null;
		itemsStore.toggle(list.id, itemId);
	}

	function deleteItem(itemId: string) {
		if (showTourDemo) return;
		itemsStore.delete(list.id, itemId);
		if (revealedDeleteId === itemId) revealedDeleteId = null;
	}

	function clearDoneItems() {
		if (showTourDemo) return;
		itemsStore.clearDone(list.id);
		confirmClearDone = false;
	}

	function startSwipe(event: PointerEvent, itemId: string) {
		if (showTourDemo) return;
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		draggedItemId = itemId;
		pointerStartX = event.clientX;
		pointerDeltaX = revealedDeleteId === itemId ? -72 : 0;
		didSwipe = false;
	}

	function moveSwipe(event: PointerEvent, itemId: string) {
		if (showTourDemo) return;
		if (draggedItemId !== itemId) return;
		const baseOffset = revealedDeleteId === itemId ? -72 : 0;
		const nextOffset = Math.min(0, Math.max(-88, baseOffset + event.clientX - pointerStartX));
		pointerDeltaX = nextOffset;
		if (Math.abs(nextOffset - baseOffset) > 8) didSwipe = true;
	}

	function endSwipe(itemId: string) {
		if (showTourDemo) return;
		if (draggedItemId !== itemId) return;
		revealedDeleteId = pointerDeltaX < -36 ? itemId : null;
		draggedItemId = null;
		pointerDeltaX = 0;
	}

	function rowOffset(item: Item): number {
		if (draggedItemId === item.id) return pointerDeltaX;
		return revealedDeleteId === item.id ? -72 : 0;
	}
</script>

<div class="flex flex-col flex-1 overflow-hidden">
	<!-- Header -->
	<div class="flex items-start justify-between gap-4 px-5 pt-5 pb-4 md:px-8 md:pt-7 md:pb-5">
		<div class="flex min-w-0 items-start gap-3">
			<button
				type="button"
				onclick={() => onOpenLists?.()}
				class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/8 text-ink/60 transition-colors hover:bg-ink/15 hover:text-ink md:hidden"
				aria-label="Oscail liostaí"
				data-tour="open-lists"
			>
				<Menu size={18} />
			</button>
			<h2 class="min-w-0 font-serif text-[30px] font-bold leading-tight text-ink md:text-[32px]">
				{list.name}
			</h2>
		</div>
		<div class="flex shrink-0 items-center gap-3">
			{#if doneCount > 0}
				<span class="text-sm text-ink/40">{doneCount} críochnaithe</span>
			{/if}
			<button
				type="button"
				onclick={() => theme?.toggleTheme()}
				class="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/8 text-ink/60 transition-colors hover:bg-ink/15 hover:text-ink"
				aria-label={theme?.theme === 'dark' ? 'Athraigh go mód geal' : 'Athraigh go mód dorcha'}
				title={theme?.theme === 'dark' ? 'Mód geal' : 'Mód dorcha'}
			>
				{#if theme?.theme === 'dark'}
					<Sun size={17} />
				{:else}
					<Moon size={17} />
				{/if}
			</button>
		</div>
	</div>

	<!-- Add-item input -->
	<div class="px-5 pb-4 md:px-6" data-tour="add-item">
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={newItemName}
				onkeydown={(e) => e.key === 'Enter' && addItem()}
				placeholder="Cuir mír leis"
				class="flex-1 rounded-xl bg-ink/8 text-ink placeholder:text-ink/35
				       px-5 py-4 text-sm font-medium outline-none transition-colors
				       focus:bg-bg focus:ring-2 focus:ring-green/35"
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

		{#if doneCount > 0}
			<div class="mt-3 flex flex-wrap items-center gap-3" data-tour="clear-done">
				{#if confirmClearDone}
					<span class="text-sm text-ink/45">Scrios na míreanna críochnaithe?</span>
					<button
						type="button"
						onclick={clearDoneItems}
						class="text-sm font-medium text-green hover:text-green/80 transition-colors"
					>
						Deimhnigh
					</button>
					<button
						type="button"
						onclick={() => (confirmClearDone = false)}
						class="text-sm text-ink/40 hover:text-ink/70 transition-colors"
					>
						Cealaigh
					</button>
				{:else}
					<button
						type="button"
						onclick={() => (confirmClearDone = true)}
						class="rounded-full bg-ink/8 px-3 py-1.5 text-sm text-ink/55 hover:bg-ink/12 hover:text-ink/75 transition-colors"
					>
						Glan míreanna críochnaithe
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<div class="mx-6 h-px bg-ink/10"></div>

	<!-- Items -->
	<ul class="flex-1 overflow-y-auto px-5 md:px-8" data-tour="item-actions">
		{#each items as item (item.id)}
			<li class="relative overflow-hidden border-b border-ink/6 last:border-0">
				<button
					type="button"
					onclick={(event) => {
						event.stopPropagation();
						deleteItem(item.id);
					}}
					class="absolute inset-y-0 right-0 flex w-[72px] items-center justify-center bg-green text-bg"
					aria-label="Scrios {item.name}"
				>
					<X size={18} />
				</button>

				<div
					role="button"
					tabindex="0"
					onclick={() => toggleItem(item.id)}
					onkeydown={(event) => {
						if (event.key === 'Enter' || event.key === ' ') {
							event.preventDefault();
							toggleItem(item.id);
						}
					}}
					onpointerdown={(event) => startSwipe(event, item.id)}
					onpointermove={(event) => moveSwipe(event, item.id)}
					onpointerup={() => endSwipe(item.id)}
					onpointercancel={() => endSwipe(item.id)}
					style:transform={`translateX(${rowOffset(item)}px)`}
					class="relative z-10 flex touch-pan-y items-center gap-4 bg-bg py-5 transition-transform duration-150"
					aria-label={item.done ? `Díchomharthaigh ${item.name}` : `Comharthaigh ${item.name}`}
				>
					<button
						type="button"
						onclick={(event) => {
							event.stopPropagation();
							toggleItem(item.id);
						}}
						class="shrink-0 w-9 h-9 rounded-full transition-colors
						       {item.done
							? 'bg-green flex items-center justify-center'
							: 'border-2 border-ink/15 hover:border-ink/30'}"
						aria-label={item.done ? 'Díchomharthaigh' : 'Comharthaigh'}
					>
						{#if item.done}
							<LayoutGrid size={14} class="text-bg" strokeWidth={1.5} />
						{/if}
					</button>

					<span class="flex-1 text-[15px] {item.done ? 'text-ink/35 line-through' : 'text-ink'}">
						{item.name}
					</span>

					<button
						type="button"
						onclick={(event) => {
							event.stopPropagation();
							deleteItem(item.id);
						}}
						class="shrink-0 rounded-full p-2 text-ink/25 transition-colors hover:bg-ink/8 hover:text-ink/60"
						aria-label="Scrios {item.name}"
					>
						<X size={15} />
					</button>
				</div>
			</li>
		{/each}

		{#if items.length === 0}
			<li class="pt-6 text-sm text-ink/30">Níl mír ar bith anseo fós.</li>
		{/if}
	</ul>

</div>
