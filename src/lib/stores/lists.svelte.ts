export type List = { id: string; name: string };

const STORAGE_KEY = 'liosta_lists';

function load(): List[] {
	if (typeof localStorage === 'undefined') {
		return [{ id: '1', name: 'Mo liosta' }];
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed: unknown = JSON.parse(raw);
			if (Array.isArray(parsed) && parsed.length > 0) return parsed as List[];
		}
	} catch {
		// corrupted storage — fall through to default
	}
	return [{ id: crypto.randomUUID(), name: 'Mo liosta' }];
}

class ListsStore {
	lists = $state<List[]>(load());
	activeId = $state<string>('');

	constructor() {
		this.activeId = this.lists[0]?.id ?? '';
	}

	get active(): List | undefined {
		return this.lists.find((l) => l.id === this.activeId);
	}

	setActive(id: string) {
		this.activeId = id;
	}

	create(): List {
		const list: List = { id: crypto.randomUUID(), name: 'Liosta nua' };
		this.lists = [...this.lists, list];
		this.activeId = list.id;
		this.#persist();
		return list;
	}

	rename(id: string, name: string) {
		const trimmed = name.trim();
		if (!trimmed) return;
		this.lists = this.lists.map((l) => (l.id === id ? { ...l, name: trimmed } : l));
		this.#persist();
	}

	delete(id: string) {
		if (this.lists.length <= 1) return;
		const idx = this.lists.findIndex((l) => l.id === id);
		this.lists = this.lists.filter((l) => l.id !== id);
		if (this.activeId === id) {
			this.activeId = this.lists[Math.max(0, idx - 1)].id;
		}
		this.#persist();
	}

	#persist() {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.lists));
		}
	}
}

export const listsStore = new ListsStore();
