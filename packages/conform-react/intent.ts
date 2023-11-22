import {
	type ListIntentPayload,
	type FieldName,
	type FormValue,
	INTENT,
	serializeIntent,
} from '@conform-to/dom';
import type { Pretty } from './context';

function createIntentButtonProps(value: string, form?: string) {
	return {
		name: INTENT,
		value,
		form,
		formNoValidate: true,
	};
}

export function validate(options: {
	formId: string;
	name: FieldName<unknown>;
}) {
	return createIntentButtonProps(
		serializeIntent({
			type: 'validate',
			payload: options.name,
		}),
		options.formId,
	);
}

export function reset<Schema>(options: {
	formId: string;
	name?: FieldName<Schema>;
	value?: boolean;
	validated?: boolean;
}) {
	return createIntentButtonProps(
		serializeIntent({
			type: 'reset',
			payload: {
				name: options.name,
				value: options.value,
				validated: options.validated,
			},
		}),
		options.formId,
	);
}

export function replace<Schema>(options: {
	formId: string;
	name?: FieldName<Schema>;
	value?: FormValue<Schema>;
	validated?: boolean;
}) {
	return createIntentButtonProps(
		serializeIntent({
			type: 'replace',
			payload: {
				name: options.name,
				value: options.value,
				validated: options.validated,
			},
		}),
		options.formId,
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
			field: {
				name: FieldName<Array<Item>>;
				formId: string;
			},
			payload?: ExtractListIntentPayload<Operation, Item>,
	  ) => ReturnType<typeof createIntentButtonProps>
	: <Item>(
			field: {
				name: FieldName<Array<Item>>;
				formId: string;
			},
			payload: ExtractListIntentPayload<Operation, Item>,
	  ) => ReturnType<typeof createIntentButtonProps>;

/**
 * Helpers to configure an intent button for modifying a list
 *
 * @see https://conform.guide/api/react#list
 */
export const list = new Proxy<{
	insert: ListIntent<'insert'>;
	remove: ListIntent<'remove'>;
	reorder: ListIntent<'reorder'>;
}>({} as any, {
	get(_target, operation: any) {
		return (
			field: {
				name: FieldName<unknown>;
				formId: string;
			},
			payload = {},
		) =>
			createIntentButtonProps(
				serializeIntent({
					type: 'list',
					payload: { name: field.name, operation, ...payload },
				}),
				field.formId,
			);
	},
});
