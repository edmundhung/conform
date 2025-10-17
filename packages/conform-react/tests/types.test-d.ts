import { assertType, expectTypeOf, test } from 'vitest';
import { createIntentDispatcher } from '../future/dom';
import type { FieldName } from '../future/types';

test('types: intent dispatcher', () => {
	const intent = createIntentDispatcher(() => null, 'test');

	expectTypeOf(intent.validate).toBeFunction();
	expectTypeOf(intent.update).toBeFunction();
	expectTypeOf(intent.insert).toBeFunction();
	expectTypeOf(intent.remove).toBeFunction();
	expectTypeOf(intent.reorder).toBeFunction();

	// Basic usage
	assertType<void>(intent.validate());
	assertType<void>(intent.update({ name: 'field', value: null }));
	assertType<void>(intent.insert({ name: 'field', defaultValue: {} }));
	assertType<void>(intent.remove({ name: 'field', index: 0 }));
	assertType<void>(intent.reorder({ name: 'field', from: 0, to: 1 }));

	// Insert with primitive array
	assertType<void>(
		intent.insert({
			name: 'tags' as FieldName<string[]>,
			defaultValue: 'new-tag',
		}),
	);

	// Insert with object array
	assertType<void>(
		intent.insert({
			name: 'items' as FieldName<Array<{ id: string; name: string }>>,
			defaultValue: { id: '1' },
		}),
	);

	// Update with primitives
	assertType<void>(
		intent.update({ name: 'name' as FieldName<string>, value: 'text' }),
	);
	assertType<void>(
		intent.update({ name: 'count' as FieldName<number>, value: 42 }),
	);

	// Update with partial object
	assertType<void>(
		intent.update({
			name: 'user' as FieldName<{ name: string; email: string }>,
			value: { name: 'John' },
		}),
	);
});
