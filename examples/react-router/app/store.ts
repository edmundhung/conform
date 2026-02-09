import { setTimeout } from 'node:timers/promises';

export function createInMemoryStore<Type>() {
	const stores: Record<string, Type | null> = {};

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
