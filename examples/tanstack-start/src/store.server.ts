import { setTimeout } from 'node:timers/promises';

function createInMemoryStore<Type>(stores: Record<string, Type | null>) {
	return {
		async getValue(id?: string) {
			await setTimeout(Math.random() * 150);
			return stores[id ?? ''] ?? null;
		},
		async setValue(value: Type, id?: string) {
			await setTimeout(Math.random() * 1000);
			stores[id ?? ''] = value;
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
