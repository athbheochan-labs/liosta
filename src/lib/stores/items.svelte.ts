export type Item = { id: string; name: string; done: boolean };

const STORAGE_KEY = 'liosta_items';

function load(): Record<string, Item[]> {
	if (typeof localStorage === 'undefined') return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed: unknown = JSON.parse(raw);
			if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
				return parsed as Record<string, Item[]>;
			}
		}
	} catch {
		// corrupted — fall through
	}
	return {};
}

class ItemsStore {
	#data = $state<Record<string, Item[]>>(load());

	forList(listId: string): Item[] {
		return [...(this.#data[listId] ?? [])].sort((a, b) => Number(a.done) - Number(b.done));
	}

	itemCount(listId: string): number {
		return (this.#data[listId] ?? []).length;
	}

	pendingCount(listId: string): number {
		return (this.#data[listId] ?? []).filter((i) => !i.done).length;
	}

	doneCount(listId: string): number {
		return (this.#data[listId] ?? []).filter((i) => i.done).length;
	}

	add(listId: string, name: string) {
		const trimmed = name.trim();
		if (!trimmed) return;
		const item: Item = { id: crypto.randomUUID(), name: trimmed, done: false };
		this.#data = { ...this.#data, [listId]: [...(this.#data[listId] ?? []), item] };
		this.#persist();
	}

	toggle(listId: string, itemId: string) {
		this.#data = {
			...this.#data,
			[listId]: (this.#data[listId] ?? []).map((i) =>
				i.id === itemId ? { ...i, done: !i.done } : i
			)
		};
		this.#persist();
	}

	delete(listId: string, itemId: string) {
		this.#data = {
			...this.#data,
			[listId]: (this.#data[listId] ?? []).filter((i) => i.id !== itemId)
		};
		this.#persist();
	}

	clearDone(listId: string) {
		this.#data = {
			...this.#data,
			[listId]: (this.#data[listId] ?? []).filter((i) => !i.done)
		};
		this.#persist();
	}

	#persist() {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#data));
		}
	}
}

export const itemsStore = new ItemsStore();
