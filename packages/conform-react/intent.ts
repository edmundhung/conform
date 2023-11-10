import {
	type ListIntentPayload,
	INTENT,
	list as listIntent,
	validate as validateIntent,
} from '@conform-to/dom';
import type { Field, Pretty } from './context';

function createIntentButtonProps(value: string, form?: string) {
	return {
		name: INTENT,
		value,
		form,
		formNoValidate: true,
	};
}

export function validate(field: Field<unknown>) {
	return createIntentButtonProps(
		validateIntent.serialize(field.name),
		field.formId,
	);
}

type ExtractListIntentPayload<Operation, Schema = unknown> = Pretty<
	Omit<
		Extract<ListIntentPayload<Schema>, { operation: Operation }>,
		'name' | 'operation'
	>
>;

type ListIntent<Operation> = {} extends ExtractListIntentPayload<Operation>
	? <Item>(
			name: Field<Array<Item>>,
			payload?: ExtractListIntentPayload<Operation, Item>,
	  ) => ReturnType<typeof createIntentButtonProps>
	: <Item>(
			field: Field<Array<Item>>,
			payload: ExtractListIntentPayload<Operation, Item>,
	  ) => ReturnType<typeof createIntentButtonProps>;

/**
 * Helpers to configure an intent button for modifying a list
 *
 * @see https://conform.guide/api/react#list
 */
export const list = new Proxy<{
	/**
	 * @deprecated You can use `insert` without specifying an index instead
	 */
	append: ListIntent<'append'>;
	/**
	 * @deprecated You can use `insert` with zero index instead
	 */
	prepend: ListIntent<'prepend'>;
	insert: ListIntent<'insert'>;
	replace: ListIntent<'replace'>;
	remove: ListIntent<'remove'>;
	reorder: ListIntent<'reorder'>;
}>({} as any, {
	get(_target, operation: any) {
		return (field: Field<unknown>, payload = {}) =>
			createIntentButtonProps(
				listIntent.serialize({ name: field.name, operation, ...payload }),
				field.formId,
			);
	},
});
