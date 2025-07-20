import {
	appendPathSegment,
	getPathSegments,
	getRelativePath,
	getValueAtPath,
	serialize,
	ValidationAttributes,
} from '@conform-to/dom/future';
import type {
	DefaultFieldMetadata,
	Fieldset,
	FormContext,
	FormMetadata,
	FormState,
} from './types';
import { getListValue } from './util';

export function getSerializedValue(
	valueObject: unknown,
	name: string,
	serializeFn: (value: unknown) => string | string[] | undefined = serialize,
): string | string[] | undefined {
	const value = getValueAtPath(valueObject, name);

	return serializeFn(value);
}

export function getListKey(
	state: FormState<any, any>,
	initialValue: Record<string, unknown> | null,
	name: string,
): string[] {
	return (
		state.keys?.[name] ??
		getListValue(initialValue, name).map((_, index) =>
			appendPathSegment(name, index),
		)
	);
}

/**
 * Determine if the field is validated
 *
 * This checks if the field is in the list of touched fields,
 * or if there is any child field that is validated, i.e. form / fieldset
 */
export function isValidated(state: FormState<any, any>, name = '') {
	if (state.touchedFields.includes(name)) {
		return true;
	}

	const paths = getPathSegments(name);

	return state.touchedFields.some(
		(field) => field !== name && getRelativePath(field, paths) !== null,
	);
}

export function getErrors<ErrorShape>(
	state: FormState<any, ErrorShape>,
	name?: string,
): ErrorShape | undefined {
	const error = state.serverError ?? state.clientError;

	if (!error || !isValidated(state, name)) {
		return;
	}

	return (name ? error.fieldErrors[name] : error.formErrors) ?? undefined;
}

export function createFormMetadata<
	FormShape,
	ErrorShape,
	FormProps extends React.DetailedHTMLProps<
		React.FormHTMLAttributes<HTMLFormElement>,
		HTMLFormElement
	>,
>(
	context: FormContext<FormShape, ErrorShape>,
	props: FormProps,
): FormMetadata<ErrorShape, FormProps> {
	return {
		id: context.formId,
		get errors() {
			return getErrors(context.state);
		},
		get fieldErrors() {
			const result: Record<string, ErrorShape> = {};

			for (const name of context.state.touchedFields) {
				const error = getErrors(context.state, name);

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
			return typeof this.errors !== 'undefined';
		},
		props,
	};
}

export function createFieldset<
	FormShape,
	ErrorShape,
	Metadata extends Record<string, unknown>,
>(
	context: FormContext<FormShape, ErrorShape>,
	options: {
		name?: string;
		serialize?: (value: unknown) => string | string[] | undefined;
		defineFieldMetadata?: (
			name: string,
			metadata: DefaultFieldMetadata<ErrorShape>,
			context: FormContext<FormShape, ErrorShape>,
		) => Metadata;
	},
): Fieldset<FormShape, Metadata> {
	const initialValue =
		context.state.submittedValue ?? context.defaultValue ?? {};
	const defaultValidationAttributes: ValidationAttributes = {
		required: undefined,
		minLength: undefined,
		maxLength: undefined,
		pattern: undefined,
		min: undefined,
		max: undefined,
		step: undefined,
		multiple: undefined,
	};

	function createField(name: string, key?: string) {
		const defaultMetadata: DefaultFieldMetadata<ErrorShape> = {
			...defaultValidationAttributes,
			...context.constraint?.[name],
			id: `${context.formId}-${name}`,
			descriptionId: `${context.formId}-${name}-description`,
			errorId: `${context.formId}-${name}-error`,
			get defaultValue() {
				const value = getSerializedValue(initialValue, name, options.serialize);

				return typeof value === 'string' ? value : value?.[0];
			},
			get defaultOptions() {
				const value = getSerializedValue(initialValue, name, options.serialize);

				return typeof value === 'string' ? [value] : value;
			},
			get defaultChecked() {
				const value = getSerializedValue(initialValue, name, options.serialize);

				return value === 'on';
			},
			get validated() {
				return isValidated(context.state, name);
			},
			get invalid() {
				return typeof getErrors(context.state, name) !== 'undefined';
			},
			get errors() {
				return getErrors(context.state, name);
			},
		};
		const metadata =
			options.defineFieldMetadata?.(name, defaultMetadata, context) ??
			defaultMetadata;

		return Object.assign(metadata, {
			key,
			name,
			getFieldset() {
				return createFieldset(context, {
					...options,
					name,
				});
			},
			getFieldList() {
				const keys = getListKey(context.state, initialValue, name);

				return keys.map((key, index) => {
					return createField(appendPathSegment(name, index), key);
				});
			},
		});
	}

	return new Proxy({} as any, {
		get(target, name, receiver) {
			if (typeof name !== 'string') {
				return Reflect.get(target, name, receiver);
			}

			return createField(appendPathSegment(options?.name, name));
		},
	});
}
