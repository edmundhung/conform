import { setTimeout } from 'node:timers/promises';

function createInMemoryStore<Type>(stores: Record<string, Type | null>) {
	const pendingWrites = new Map<string, Promise<void>>();

	return {
		async getValue(id?: string) {
			await setTimeout(Math.random() * 150);
			return stores[id ?? ''] ?? null;
		},
		async setValue(value: Type, id?: string) {
			const key = id ?? '';
			const write = (pendingWrites.get(key) ?? Promise.resolve()).then(
				async () => {
					await setTimeout(Math.random() * 1000);
					stores[key] = value;
				},
			);

			pendingWrites.set(key, write);

			try {
				await write;
			} finally {
				if (pendingWrites.get(key) === write) {
					pendingWrites.delete(key);
				}
			}
		},
	};
}

type TodoList = {
	title: string;
	tasks: Array<{ content: string; completed: boolean }>;
};

const serverState = globalThis as typeof globalThis & {
	conformTanStackStartTodos?: Record<string, TodoList | null>;
};

export const todoStore = createInMemoryStore(
	(serverState.conformTanStackStartTodos ??= {}),
);
