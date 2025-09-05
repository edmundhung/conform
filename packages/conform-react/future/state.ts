import {
	type ValidationAttributes,
	type Serialize,
	appendPathSegment,
	formatPathSegments,
	getPathSegments,
	getRelativePath,
	getValueAtPath,
	serialize as defaultSerialize,
	deepEqual,
} from '@conform-to/dom/future';
import type {
	DefaultFieldMetadata,
	Field,
	FieldName,
	Fieldset,
	FormContext,
	FormMetadata,
	FormState,
	FormAction,
	UnknownIntent,
	ActionHandler,
} from './types';
import { generateUniqueKey, getArrayAtPath, merge } from './util';

export function initializeState<ErrorShape>(): FormState<ErrorShape> {
	return {
		resetKey: generateUniqueKey(),
		listKeys: {},
		intendedValue: null,
		serverValidatedValue: null,
		serverError: null,
		clientError: null,
		touchedFields: [],
	};
}

/**
 * Updates form state based on action type:
 * - Client actions: update intended value and client errors
 * - Server actions: update server errors and clear client errors
 * - Initialize: set initial intended value
 */
export function updateState<ErrorShape>(
	state: FormState<ErrorShape>,
	action: FormAction<
		ErrorShape,
		UnknownIntent | null,
		{
			handlers: Record<string, ActionHandler>;
			reset: () => FormState<ErrorShape>;
		}
	>,
): FormState<ErrorShape> {
	if (action.intendedValue === null) {
		return action.ctx.reset();
	}

	const value = action.intendedValue ?? action.submission.payload;

	// Apply the form error and intended value from the result first
	state =
		action.type === 'client'
			? merge(state, {
					intendedValue: !action.intent
						? value
						: action.intendedValue ?? state.intendedValue,
					// Update client error only if the error is different from the previous one to minimize unnecessary re-renders
					clientError:
						typeof action.error !== 'undefined' &&
						!deepEqual(state.clientError, action.error)
							? action.error
							: state.clientError,
					// Reset server error if form value is changed
					serverError:
						typeof action.error !== 'undefined' &&
						!deepEqual(state.serverValidatedValue, value)
							? null
							: state.serverError,
				})
			: merge(state, {
					intendedValue:
						action.type === 'initialize' ? value : state.intendedValue,
					// Clear client error to avoid showing stale errors
					clientError: null,
					// Update server error if the error is defined.
					// There is no need to check if the error is different as we are updating other states as well
					serverError:
						typeof action.error !== 'undefined'
							? action.error
							: state.serverError,
					// Keep track of the value that the serverError is based on
					serverValidatedValue:
						typeof action.error !== 'undefined'
							? value
							: state.serverValidatedValue,
				});

	if (action.type !== 'server' && typeof action.intent !== 'undefined') {
		// Validate the whole form if no intent is provided (default submission)
		const intent = action.intent ?? { type: 'validate' };
		const handler = action.ctx.handlers?.[intent.type];

		if (typeof handler?.onUpdate === 'function') {
			if (handler.validatePayload?.(intent.payload) ?? true) {
				return handler.onUpdate(state, {
					...action,
					intent: {
						type: intent.type,
						payload: intent.payload,
					},
				});
			}
		}
	}

	return state;
}

export function getDefaultValue(
	context: FormContext<any>,
	name: string,
	serialize: Serialize = defaultSerialize,
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
	context: FormContext<any>,
	name: string,
	serialize: Serialize = defaultSerialize,
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

export function isDefaultChecked(
	context: FormContext<any>,
	name: string,
	serialize: Serialize = defaultSerialize,
): boolean {
	const value = getValueAtPath(
		context.state.intendedValue ?? context.defaultValue ?? {},
		name,
	);
	const serializedValue =
		typeof value !== 'undefined' ? serialize(value) : undefined;

	return serializedValue === 'on';
}

/**
 * Determine if the field is touched
 *
 * This checks if the field is in the list of touched fields,
 * or if there is any child field that is touched, i.e. form / fieldset
 */
export function isTouched(state: FormState<any>, name = '') {
	if (state.touchedFields.includes(name)) {
		return true;
	}

	const paths = getPathSegments(name);

	return state.touchedFields.some(
		(field) => field !== name && getRelativePath(field, paths) !== null,
	);
}

export function getDefaultListKey(
	prefix: string,
	initialValue: Record<string, unknown> | null,
	name: string,
): string[] {
	return getArrayAtPath(initialValue, name).map(
		(_, index) => `${prefix}-${appendPathSegment(name, index)}`,
	);
}

export function getListKey(context: FormContext<any>, name: string): string[] {
	return (
		context.state.listKeys?.[name] ??
		getDefaultListKey(
			context.state.resetKey,
			context.state.intendedValue ?? context.defaultValue,
			name,
		)
	);
}

export function getError<ErrorShape>(
	state: FormState<ErrorShape>,
	name?: string,
): ErrorShape[] | undefined {
	const error = state.serverError ?? state.clientError;

	if (!error || !isTouched(state, name)) {
		return;
	}

	const errors = name ? error.fieldErrors[name] : error.formErrors;

	if (errors && errors.length > 0) {
		return errors;
	}
}

/**
 * Gets validation constraint for a field, with fallback to parent array patterns.
 * e.g. "array[0].key" falls back to "array[].key" if specific constraint not found.
 */
export function getConstraint(
	context: FormContext<any>,
	name: string,
): ValidationAttributes | undefined {
	let constraint = context.constraint?.[name];

	if (!constraint) {
		const path = getPathSegments(name);

		for (let i = path.length - 1; i >= 0; i--) {
			const segment = path[i];
			// Try searching a less specific path for the constraint
			// e.g. `array[0].anotherArray[1].key` -> `array[0].anotherArray[].key` -> `array[].anotherArray[].key`
			if (typeof segment === 'number') {
				// This overrides the current number segment with an empty string
				// which will be treated as an empty bracket
				path[i] = '';
				break;
			}
		}

		const alternative = formatPathSegments(path);

		if (name !== alternative) {
			constraint = getConstraint(context, alternative);
		}
	}

	return constraint;
}

export function getFormMetadata<ErrorShape>(
	context: FormContext<ErrorShape>,
	options: {
		serialize: Serialize;
	},
): FormMetadata<ErrorShape, DefaultFieldMetadata<ErrorShape>> {
	return {
		id: context.formId,
		get errors() {
			return getError(context.state);
		},
		get fieldErrors() {
			const result: Record<string, ErrorShape[]> = {};

			for (const name of context.state.touchedFields) {
				if (!name) {
					// Skip form-level errors
					continue;
				}

				const error = getError(context.state, name);

				if (typeof error !== 'undefined') {
					result[name] = error;
				}
			}

			return result;
		},
		get touched() {
			return isTouched(context.state);
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
		context,
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

export function getField<FieldShape, ErrorShape = string>(
	context: FormContext<ErrorShape>,
	options: {
		name: FieldName<FieldShape>;
		serialize: Serialize;
		key?: string;
	},
): Field<FieldShape, DefaultFieldMetadata<ErrorShape>> {
	const id = `${context.formId}-${options.name}`;
	const constraint = getConstraint(context, options.name);
	const metadata: DefaultFieldMetadata<ErrorShape> = {
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
			return isDefaultChecked(context, options.name, options.serialize);
		},
		get touched() {
			return isTouched(context.state, options.name);
		},
		get invalid() {
			return typeof getError(context.state, options.name) !== 'undefined';
		},
		get errors() {
			return getError(context.state, options.name);
		},
	};

	return Object.assign(metadata, {
		key: options.key,
		name: options.name,
		getFieldset() {
			return getFieldset(context, options);
		},
		getFieldList() {
			return getFieldList(context, options);
		},
	});
}

/**
 * Creates a proxy that dynamically generates field objects when properties are accessed.
 */
export function getFieldset<
	FieldShape = Record<string, any>,
	ErrorShape = string,
>(
	context: FormContext<ErrorShape>,
	options: {
		name?: FieldName<FieldShape>;
		serialize: Serialize;
	},
): Fieldset<FieldShape, DefaultFieldMetadata<ErrorShape>> {
	return new Proxy({} as any, {
		get(target, name, receiver) {
			if (typeof name === 'string') {
				return getField(context, {
					...options,
					name: appendPathSegment(options?.name, name),
				});
			}

			return Reflect.get(target, name, receiver);
		},
	});
}

/**
 * Creates an array of field objects for list/array inputs
 */
export function getFieldList<FieldShape = Array<any>, ErrorShape = string>(
	context: FormContext<ErrorShape>,
	options: {
		name: FieldName<FieldShape>;
		serialize: Serialize;
	},
): Field<
	[FieldShape] extends [Array<infer ItemShape> | null | undefined]
		? ItemShape
		: unknown,
	DefaultFieldMetadata<ErrorShape>
>[] {
	const keys = getListKey(context, options.name);

	return keys.map((key, index) => {
		return getField<
			[FieldShape] extends [Array<infer ItemShape> | null | undefined]
				? ItemShape
				: unknown,
			ErrorShape
		>(context, {
			...options,
			name: appendPathSegment(options.name, index),
			key,
		});
	});
}
