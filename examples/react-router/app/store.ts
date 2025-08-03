import { setTimeout } from 'node:timers/promises';

export function createInMemoryStore<Type>() {
	let store: Type | null = null;

	return {
		async getValue() {
			await setTimeout(Math.random() * 150);
			return store;
		},
		async setValue(value: Type) {
			await setTimeout(Math.random() * 1000);

			store = value;
		},
	};
}
