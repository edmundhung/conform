import { setTimeout } from 'node:timers/promises';
import { z } from 'zod';
import { schema } from './_schema';

declare global {
	// eslint-disable-next-line no-var
	var inMemoryDemoStore: Record<string, z.infer<typeof schema> | undefined>;
}

global.inMemoryDemoStore ??= {};

export async function getTodos(id?: string) {
	await setTimeout(Math.random() * 100);

	return Promise.resolve(global.inMemoryDemoStore[id ?? 'default']);
}

export async function updateTodos(
	todos: z.infer<typeof schema>,
	id?: string,
): Promise<void> {
	await setTimeout(Math.random() * 1000);

	global.inMemoryDemoStore[id ?? 'default'] = todos;
}
