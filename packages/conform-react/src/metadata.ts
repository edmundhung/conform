import type { FormError } from 'conform-dom';
import { getPaths, getValue, isPlainObject } from 'conform-dom';
import type { DefaultValue, FormState } from './control';
import { getListValue, getName, getChildPaths } from './util';

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

	return touchedFields.some(
		(field) => field !== name && getChildPaths(name, field) !== null,
	);
}

export function getSerializedValue(
	valueObject: unknown,
	name: string,
	serialize: (
		value: unknown,
	) => string | string[] | undefined = defaultSerialize,
): string | string[] | undefined {
	const paths = getPaths(name);
	const value = getValue(valueObject, paths);

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

export function getDefaultListKey(
	formValue: Record<string, unknown> | null,
	name: string,
): string[] {
	return getListValue(formValue, name).map((_, index) => getName(name, index));
}

export function createFieldset<
	Schema,
	Metadata extends Record<string, unknown>,
>(options: {
	initialValue?: Record<string, unknown> | null;
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
				const keys =
					options.keys?.[name] ??
					getDefaultListKey(options.initialValue ?? {}, name);

				return keys.map((key, index) => {
					return createField(getName(name, index), key);
				});
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

export function getMetadata<Schema, ErrorShape, CustomState extends {}>(
	state: FormState<Schema, ErrorShape, CustomState>,
	options?: {
		defaultValue?: DefaultValue<Schema>;
		formProps?: React.DetailedHTMLProps<
			React.FormHTMLAttributes<HTMLFormElement>,
			HTMLFormElement
		>;
		serialize?: (value: unknown) => string | string[] | undefined;
	},
): {
	form: {
		touched: boolean;
		invalid: boolean;
		error: ErrorShape | undefined;
		fieldError: Record<string, ErrorShape> | undefined;
		props:
			| React.DetailedHTMLProps<
					React.FormHTMLAttributes<HTMLFormElement>,
					HTMLFormElement
			  >
			| undefined;
	} & CustomState;
	fields: Fieldset<
		Schema,
		Readonly<{
			name: string;
			defaultValue: string | undefined;
			defaultSelected: string[] | undefined;
			touched: boolean;
			invalid: boolean;
			error: ErrorShape | undefined;
		}>
	>;
} {
	const error = state.serverError ?? state.clientError;
	const initialValue = state.initialValue ?? options?.defaultValue ?? null;

	return {
		form: {
			error: error?.formError ?? undefined,
			fieldError: error?.fieldError,
			get touched() {
				return isTouched(state.touchedFields);
			},
			get invalid() {
				return error !== null;
			},
			props: options?.formProps,
			...state.custom,
		},
		fields: createFieldset({
			initialValue,
			keys: state.keys,
			defineMetadata(name) {
				return {
					get name() {
						return name;
					},
					get defaultValue() {
						const value = getSerializedValue(
							initialValue,
							name,
							options?.serialize,
						);
						const result = typeof value === 'string' ? value : value?.[0];

						return result;
					},
					get defaultSelected() {
						const value = getSerializedValue(
							initialValue,
							name,
							options?.serialize,
						);
						const result = typeof value === 'string' ? [value] : value;

						return result;
					},
					get touched() {
						return isTouched(state.touchedFields, name);
					},
					get invalid() {
						return typeof this.error !== 'undefined';
					},
					get error() {
						return getError(error, state.touchedFields, name);
					},
				};
			},
		}),
	};
}
