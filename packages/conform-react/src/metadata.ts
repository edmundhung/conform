import type { FormError } from 'conform-dom';
import { getPaths, getValue, isPlainObject } from 'conform-dom';
import type { DefaultValue, FormState } from './control';
import { getName, isChildField } from './util';

type BaseCombine<
	T,
	K extends PropertyKey = T extends unknown ? keyof T : never,
> = T extends unknown ? T & Partial<Record<Exclude<K, keyof T>, never>> : never;

export type Combine<T> = {
	[K in keyof BaseCombine<T>]: BaseCombine<T>[K];
};

export type Field<
	Schema,
	Metadata extends Record<string, unknown>,
> = Metadata & { key: string | undefined } & ([Schema] extends [Date | File]
		? {}
		: [Schema] extends [Array<infer Item> | null | undefined]
			? {
					getFieldList: () => Array<Field<Item, Metadata>>;
				}
			: [Schema] extends [Record<string, unknown> | null | undefined]
				? {
						getFieldset: () => Fieldset<Schema, Metadata>;
					}
				: {});

export type Fieldset<Schema, Metadata extends Record<string, unknown>> = {
	[Key in keyof Combine<Schema>]-?: Field<Combine<Schema>[Key], Metadata>;
};

export type FormMetadata<Schema extends Record<string, unknown>, ErrorShape> = {
	defaultValue: DefaultValue<Schema> | null;
	touched: boolean;
	error: ErrorShape | null;
	fieldError: Record<string, ErrorShape> | null;
};

export function defaultSerialize(
	value: unknown,
): string | string[] | undefined {
	if (typeof value === 'string') {
		return value;
	} else if (isPlainObject(value)) {
		return;
	} else if (Array.isArray(value)) {
		const result: string[] = [];

		for (const item of value) {
			const serializedItem = defaultSerialize(item);

			if (typeof serializedItem !== 'string') {
				return;
			}

			result.push(serializedItem);
		}

		return result;
	} else if (value instanceof Date) {
		return value.toISOString();
	} else if (typeof value === 'boolean') {
		return value ? 'on' : undefined;
	} else if (typeof value === 'number' || typeof value === 'bigint') {
		return value.toString();
	}

	return value?.toString();
}

/**
 * Determine if the field is touched
 *
 * This checks if the field is in the list of touched fields,
 * or if there is any child field that is touched, i.e. form / fieldset
 */
export function isTouched(touchedFields: string[], name = '') {
	if (touchedFields.includes(name)) {
		return true;
	}

	return touchedFields.some((field) => isChildField(field, name));
}

export function getFormMetadata<
	Schema extends Record<string, unknown>,
	ErrorShape,
>(state: FormState<Schema, ErrorShape>): FormMetadata<Schema, ErrorShape> {
	const error = state.serverError ?? state.clientError;

	return {
		defaultValue: state.defaultValue,
		error: error?.formError ?? null,
		fieldError: error?.fieldError ?? null,
		get touched() {
			return isTouched(state.touchedFields);
		},
	};
}

export function getDefaultValue(
	initialValue: unknown,
	name: string,
	serialize: (
		value: unknown,
	) => string | string[] | undefined = defaultSerialize,
): string | string[] | undefined {
	const paths = getPaths(name);
	const value = getValue(initialValue, paths);

	return serialize(value);
}

export function getError<ErrorShape>(
	error: FormError<unknown, ErrorShape> | null,
	touchedFields: string[],
	name?: string,
): ErrorShape | undefined {
	if (!isTouched(touchedFields, name) || !error) {
		return;
	}

	return (name ? error.fieldError[name] : error.formError) ?? undefined;
}

export function getListInitialValue(
	initialValue: Record<string, unknown>,
	name: string,
) {
	const paths = getPaths(name);
	const value = getValue(initialValue, paths) ?? [];

	if (!Array.isArray(value)) {
		throw new Error(`The value of "${name}" is not an array`);
	}

	return value;
}

export function createFieldset<
	Schema,
	Metadata extends Record<string, unknown>,
>(options: {
	keys?: Record<string, string[]>;
	name?: string;
	defineMetadata?: (name: string) => Metadata;
}): Fieldset<Schema, Metadata> {
	function createField(name: string, key?: string) {
		const metadata = options?.defineMetadata?.(name) ?? {};

		return Object.assign(metadata, {
			key,
			getFieldset() {
				return createFieldset({
					...options,
					name,
				});
			},
			getFieldList() {
				const keys = options.keys?.[name] ?? [];

				return keys.map((key, index) => createField(getName(name, index), key));
			},
		});
	}

	return new Proxy({} as any, {
		get(target, name, receiver) {
			if (typeof name !== 'string') {
				return Reflect.get(target, name, receiver);
			}

			return createField(getName(options?.name, name));
		},
	});
}

export function getFieldset<Schema, ErrorShape>(
	state: FormState<Schema, ErrorShape>,
): Fieldset<
	Schema,
	Readonly<{
		name: string;
		defaultValue: string | string[] | undefined;
		touched: boolean;
		valid: boolean;
		error: ErrorShape | undefined;
	}>
> {
	return createFieldset({
		keys: state.keys,
		defineMetadata(name) {
			const error = state.serverError ?? state.clientError;

			return {
				get name() {
					return name;
				},
				get defaultValue() {
					return getDefaultValue(state.initialValue, name);
				},
				get touched() {
					return isTouched(state.touchedFields, name);
				},
				get valid() {
					return (
						typeof getError(error, state.touchedFields, name) === 'undefined'
					);
				},
				get error() {
					return getError(error, state.touchedFields, name);
				},
			};
		},
	});
}
