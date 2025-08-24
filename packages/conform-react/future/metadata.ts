import {
	appendPathSegment,
	getPathSegments,
	getRelativePath,
	getValueAtPath,
	isFieldElement,
	requestIntent,
	serialize as defaultSerialize,
	change,
} from '@conform-to/dom/future';
import type {
	DefaultFieldMetadata,
	Field,
	FieldName,
	Fieldset,
	IntentDispatcher,
	FormContext,
	FormMetadata,
	FormState,
} from './types';
import { getListValue } from './util';
import { serializeIntent } from './form';
import { DEFAULT_INTENT } from './hooks';

export function getDefaultValue(
	context: FormContext<any, any>,
	name: string,
	serialize: (
		value: unknown,
	) => string | string[] | File | File[] | undefined = defaultSerialize,
): string | undefined {
	const value = getValueAtPath(
		context.state.intendedValue ?? context.defaultValue ?? {},
		name,
	);
	const serializedValue = serialize(value);

	if (typeof serializedValue === 'string') {
		return serializedValue;
	}
}

export function getDefaultOptions(
	context: FormContext<any, any>,
	name: string,
	serialize: (
		value: unknown,
	) => string | string[] | File | File[] | undefined = defaultSerialize,
): string[] | undefined {
	const value = getValueAtPath(
		context.state.intendedValue ?? context.defaultValue ?? {},
		name,
	);
	const serializedValue =
		typeof value !== 'undefined' ? serialize(value) : undefined;

	if (
		Array.isArray(serializedValue) &&
		serializedValue.every((item) => typeof item === 'string')
	) {
		return serializedValue;
	}

	if (typeof serializedValue === 'string') {
		return [serializedValue];
	}
}

export function getDefaultChecked(
	context: FormContext<any, any>,
	name: string,
	serialize: (
		value: unknown,
	) => string | string[] | File | File[] | undefined = defaultSerialize,
): boolean {
	const value = getValueAtPath(
		context.state.intendedValue ?? context.defaultValue ?? {},
		name,
	);
	const serializedValue =
		typeof value !== 'undefined' ? serialize(value) : undefined;

	return serializedValue === 'on';
}

export function getDefaultListKey(
	prefix: string,
	initialValue: Record<string, unknown> | null,
	name: string,
): string[] {
	return getListValue(initialValue, name).map(
		(_, index) => `${prefix}-${appendPathSegment(name, index)}`,
	);
}

export function getListKey(
	context: FormContext<any, any>,
	name: string,
): string[] {
	return (
		context.state.listKeys?.[name] ??
		getDefaultListKey(
			context.state.key,
			context.state.intendedValue ?? context.defaultValue,
			name,
		)
	);
}

/**
 * Determine if the field is validated
 *
 * This checks if the field is in the list of touched fields,
 * or if there is any child field that is validated, i.e. form / fieldset
 */
export function isValidated(state: FormState<any>, name = '') {
	if (state.touchedFields.includes(name)) {
		return true;
	}

	const paths = getPathSegments(name);

	return state.touchedFields.some(
		(field) => field !== name && getRelativePath(field, paths) !== null,
	);
}

export function getError<ErrorShape>(
	state: FormState<ErrorShape>,
	name?: string,
): ErrorShape | undefined {
	const error = state.serverError ?? state.clientError;

	if (!error || !isValidated(state, name)) {
		return;
	}

	return (name ? error.fieldErrors[name] : error.formErrors) ?? undefined;
}

export function getFormMetadata<
	ErrorShape,
	FieldMetadata extends Record<
		string,
		unknown
	> = DefaultFieldMetadata<ErrorShape>,
>(
	context: FormContext<any, ErrorShape>,
	options?: {
		serialize?: (value: unknown) => string | string[] | undefined;
		customize?: (
			name: string,
			metadata: DefaultFieldMetadata<ErrorShape>,
			context: FormContext<any, ErrorShape>,
		) => FieldMetadata;
	},
): FormMetadata<ErrorShape, FieldMetadata> {
	return {
		id: context.formId,
		get errors() {
			return getError(context.state);
		},
		get fieldErrors() {
			const result: Record<string, ErrorShape> = {};

			for (const name of context.state.touchedFields) {
				const error = getError(context.state, name);

				if (typeof error !== 'undefined') {
					result[name] = error;
				}
			}

			return result;
		},
		get touched() {
			return isValidated(context.state);
		},
		get invalid() {
			return typeof getError(context.state) !== 'undefined';
		},
		props: {
			id: context.formId,
			onSubmit: context.handleSubmit,
			onInput: context.handleInput,
			onBlur: context.handleBlur,
			noValidate: true,
		},
		getField(name) {
			return getField(context, {
				...options,
				name,
			});
		},
		getFieldset(name) {
			return getFieldset(context, {
				...options,
				name,
			});
		},
		getFieldList(name) {
			return getFieldList(context, {
				...options,
				name,
			});
		},
	};
}

export function getField<
	FormShape,
	ErrorShape,
	FieldShape = FormShape,
	Metadata extends Record<string, unknown> = DefaultFieldMetadata<ErrorShape>,
>(
	context: FormContext<FormShape, ErrorShape>,
	options: {
		name: FieldName<FieldShape>;
		key?: string;
		serialize?: (
			value: unknown,
		) => string | string[] | File | File[] | undefined;
		customize?: (
			name: string,
			metadata: DefaultFieldMetadata<ErrorShape>,
			context: FormContext<FormShape, ErrorShape>,
		) => Metadata;
	},
): Field<FieldShape, Metadata> {
	const id = `${context.formId}-${options.name}`;
	const constraint = context.constraint?.[options.name];
	const defaultMetadata: DefaultFieldMetadata<ErrorShape> = {
		id: id,
		descriptionId: `${id}-description`,
		errorId: `${id}-error`,
		required: constraint?.required,
		minLength: constraint?.minLength,
		maxLength: constraint?.maxLength,
		pattern: constraint?.pattern,
		min: constraint?.min,
		max: constraint?.max,
		step: constraint?.step,
		multiple: constraint?.multiple,
		get defaultValue() {
			return getDefaultValue(context, options.name, options.serialize);
		},
		get defaultOptions() {
			return getDefaultOptions(context, options.name, options.serialize);
		},
		get defaultChecked() {
			return getDefaultChecked(context, options.name, options.serialize);
		},
		get validated() {
			return isValidated(context.state, options.name);
		},
		get invalid() {
			return typeof getError(context.state, options.name) !== 'undefined';
		},
		get errors() {
			return getError(context.state, options.name);
		},
	};
	const metadata =
		options.customize?.(options.name, defaultMetadata, context) ??
		defaultMetadata;

	// @ts-expect-error Send us a PR if you have a better way to type this
	return Object.assign(metadata, {
		key: options.key,
		name: options.name,
		getFieldset() {
			const fieldset = getFieldset(context, options);

			// Overwrite the method to return the same fieldset
			this.getFieldset = () => fieldset;

			return fieldset;
		},
		getFieldList() {
			const fieldList = getFieldList(context, options);

			// Overwrites the method to return the same field list
			this.getFieldList = () => fieldList;

			return fieldList;
		},
	});
}

export function getFieldset<
	FieldShape,
	ErrorShape,
	Metadata extends Record<string, unknown> = DefaultFieldMetadata<ErrorShape>,
>(
	context: FormContext<any, ErrorShape>,
	options: {
		name?: FieldName<FieldShape>;
		serialize?: (
			value: unknown,
		) => string | string[] | File | File[] | undefined;
		customize?: (
			name: string,
			metadata: DefaultFieldMetadata<ErrorShape>,
			context: FormContext<any, ErrorShape>,
		) => Metadata;
	},
): Fieldset<FieldShape, Metadata> {
	const cache: Record<string, Field<FieldShape, Metadata>> = {};

	return new Proxy({} as any, {
		get(target, name, receiver) {
			if (typeof name === 'string') {
				cache[name] ??= getField(context, {
					...options,
					name: appendPathSegment(options?.name, name),
				});

				return cache[name];
			}

			return Reflect.get(target, name, receiver);
		},
	});
}

export function getFieldList<
	ErrorShape,
	FieldShape,
	Metadata extends Record<string, unknown> = DefaultFieldMetadata<ErrorShape>,
>(
	context: FormContext<any, ErrorShape>,
	options: {
		name: FieldName<FieldShape>;
		serialize?: (
			value: unknown,
		) => string | string[] | File | File[] | undefined;
		customize?: (
			name: string,
			metadata: DefaultFieldMetadata<ErrorShape>,
			context: FormContext<any, ErrorShape>,
		) => Metadata;
	},
): Field<
	[FieldShape] extends [Array<infer ItemShape> | null | undefined]
		? ItemShape
		: unknown,
	Metadata
>[] {
	const keys = getListKey(context, options.name);

	return keys.map((key, index) => {
		return getField(context, {
			...options,
			name: appendPathSegment(options.name, index),
			key,
		});
	});
}

export function createIntentDispatcher(
	formElement: HTMLFormElement | (() => HTMLFormElement | null),
	options?: {
		intentName?: string;
	},
) {
	return new Proxy<IntentDispatcher>({} as any, {
		get(target, type, receiver) {
			if (typeof type === 'string') {
				// @ts-expect-error
				target[type] ??= (payload?: unknown) => {
					const form =
						typeof formElement === 'function' ? formElement() : formElement;

					if (!form) {
						throw new Error(
							`Dispatching "${type}" intent failed; No form element found.`,
						);
					}

					requestIntent(
						form,
						options?.intentName ?? DEFAULT_INTENT,
						serializeIntent({
							type,
							payload,
						}),
					);
				};
			}

			return Reflect.get(target, type, receiver);
		},
	});
}

export function updateFormValue(
	form: HTMLFormElement,
	intendedValue: Record<string, unknown>,
	serialize: (
		value: unknown,
	) => string | string[] | File | File[] | undefined = defaultSerialize,
): void {
	for (const element of form.elements) {
		if (isFieldElement(element) && element.name) {
			const value = getValueAtPath(intendedValue, element.name);
			const serializedValue = serialize(value);

			if (typeof serializedValue !== 'undefined') {
				change(element, serializedValue, {
					preventDefault: true,
				});
			}
		}
	}
}
