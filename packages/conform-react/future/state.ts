import {
	type FieldName,
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
	FieldMetadata,
	Fieldset,
	FormContext,
	FormMetadata,
	FormState,
	FormAction,
	UnknownIntent,
	ActionHandler,
	BaseFieldMetadata,
	BaseFormMetadata,
	DefineConditionalField,
} from './types';
import { generateUniqueKey, getArrayAtPath, merge, when } from './util';

export function initializeState<ErrorShape>(options?: {
	defaultValue?: Record<string, unknown> | null | undefined;
	resetKey?: string | undefined;
}): FormState<ErrorShape> {
	return {
		resetKey: options?.resetKey ?? generateUniqueKey(),
		listKeys: {},
		defaultValue: options?.defaultValue ?? {},
		targetValue: null,
		serverValue: null,
		serverError: null,
		clientError: null,
		touchedFields: [],
	};
}

/**
 * Updates form state based on action type:
 * - Client actions: update target value and client errors
 * - Server actions: update server errors and clear client errors, with optional target value
 * - Initialize: set initial server value
 */
export function updateState<ErrorShape>(
	state: FormState<ErrorShape>,
	action: FormAction<
		ErrorShape,
		UnknownIntent | null,
		{
			handlers: Record<string, ActionHandler>;
			reset: (
				defaultValue?: Record<string, unknown> | null | undefined,
			) => FormState<ErrorShape>;
		}
	>,
): FormState<ErrorShape> {
	if (action.reset) {
		return action.ctx.reset(action.targetValue);
	}

	const value = action.targetValue ?? action.submission.payload;

	// Apply the form error and target value from the result first
	state =
		action.type === 'client'
			? merge(state, {
					targetValue: action.targetValue ?? state.targetValue,
					serverValue: action.targetValue ? null : state.serverValue,
					// Update client error only if the error is different from the previous one to minimize unnecessary re-renders
					clientError:
						typeof action.error !== 'undefined' &&
						!deepEqual(state.clientError, action.error)
							? action.error
							: state.clientError,
					// Reset server error if form value is changed
					serverError:
						typeof action.error !== 'undefined' &&
						!deepEqual(state.serverValue, value)
							? null
							: state.serverError,
				})
			: merge(state, {
					// Clear client error to avoid showing stale errors
					clientError: null,
					// Update server error if the error is defined.
					// There is no need to check if the error is different as we are updating other states as well
					serverError:
						typeof action.error !== 'undefined'
							? action.error
							: state.serverError,
					listKeys:
						action.type === 'server' && action.targetValue
							? pruneListKeys(state.listKeys, action.targetValue)
							: state.listKeys,
					targetValue:
						action.type === 'server' && action.targetValue
							? action.targetValue
							: state.targetValue,
					// Keep track of the value that the serverError is based on
					serverValue: !deepEqual(state.serverValue, value)
						? value
						: state.serverValue,
				});
	// Validate the whole form if no intent is provided (default submission)
	const intent = action.intent ?? { type: 'validate' };
	const handler = action.ctx.handlers?.[intent.type];

	if (typeof handler?.onUpdate === 'function') {
		if (handler.validatePayload?.(intent.payload) ?? true) {
			return handler.onUpdate(state, {
				...action,
				ctx: {
					reset: action.ctx.reset,
				},
				intent: {
					type: intent.type,
					payload: intent.payload,
				},
			});
		}
	}

	return state;
}

/**
 * Removes list keys where array length has changed to force regeneration.
 * Minimizes UI state loss by only invalidating keys when necessary.
 */
export function pruneListKeys(
	listKeys: Record<string, string[]>,
	targetValue: Record<string, unknown>,
): Record<string, string[]> {
	let result = listKeys;

	for (const [name, keys] of Object.entries(listKeys)) {
		const list = getArrayAtPath(targetValue, name);

		// Reset list keys only if the length has changed
		// to minimize potential UI state loss due to key changes
		if (keys.length !== list.length) {
			// Create a shallow copy to avoid mutating the original object
			if (result === listKeys) {
				result = { ...result };
			}

			// Remove the list key to force regeneration
			delete result[name];
		}
	}

	return result;
}

export function getDefaultValue(
	context: FormContext<any>,
	name: string,
	serialize: Serialize = defaultSerialize,
): string {
	const value = getValueAtPath(
		context.state.serverValue ??
			context.state.targetValue ??
			context.state.defaultValue,
		name,
	);
	const serializedValue = serialize(value);

	if (typeof serializedValue === 'string') {
		return serializedValue;
	}

	return '';
}

export function getDefaultOptions(
	context: FormContext<any>,
	name: string,
	serialize: Serialize = defaultSerialize,
): string[] {
	const value = getValueAtPath(
		context.state.serverValue ??
			context.state.targetValue ??
			context.state.defaultValue,
		name,
	);
	const serializedValue = serialize(value);

	if (
		Array.isArray(serializedValue) &&
		serializedValue.every((item) => typeof item === 'string')
	) {
		return serializedValue;
	}

	if (typeof serializedValue === 'string') {
		return [serializedValue];
	}

	return [];
}

export function isDefaultChecked(
	context: FormContext<any>,
	name: string,
	serialize: Serialize = defaultSerialize,
): boolean {
	const value = getValueAtPath(
		context.state.serverValue ??
			context.state.targetValue ??
			context.state.defaultValue,
		name,
	);
	const serializedValue = serialize(value);

	if (typeof serializedValue === 'string') {
		return serializedValue === 'on';
	}

	return false;
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
			context.state.serverValue ??
				context.state.targetValue ??
				context.state.defaultValue,
			name,
		)
	);
}

export function getErrors<ErrorShape>(
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

export function getFieldErrors<ErrorShape>(
	state: FormState<ErrorShape>,
	name?: string,
) {
	const result: Record<string, ErrorShape[]> = {};
	const error = state.serverError ?? state.clientError;

	if (error) {
		const basePath = getPathSegments(name);

		for (const field of Object.keys(error.fieldErrors)) {
			const relativePath = getRelativePath(field, basePath);

			// Only include errors for specified field's children
			if (!relativePath || relativePath.length === 0) {
				continue;
			}

			const error = getErrors(state, field);

			if (typeof error !== 'undefined') {
				result[formatPathSegments(relativePath)] = error;
			}
		}
	}

	return result;
}

export function isValid(state: FormState<any>, name?: string): boolean {
	const error = state.serverError ?? state.clientError;

	// If there is no error, it must be valid
	if (!error) {
		return true;
	}

	const basePath = getPathSegments(name);

	for (const field of Object.keys(error.fieldErrors)) {
		// When checking a specific field, only check that field and its children
		if (name && !getRelativePath(field, basePath)) {
			continue;
		}

		// If the field is not touched, we don't consider its error
		const error = getErrors(state, field);

		if (error) {
			return false;
		}
	}

	// Make sure there is no form error when checking the whole form
	if (!name) {
		return !getErrors(state);
	}

	return true;
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

export function getFormMetadata<
	ErrorShape,
	CustomFormMetadata extends Record<string, unknown> = {},
	CustomFieldMetadata extends Record<string, unknown> = {},
>(
	context: FormContext<ErrorShape>,
	options?: {
		serialize?: Serialize | undefined;
		extendFormMetadata?:
			| ((metadata: BaseFormMetadata<ErrorShape>) => CustomFormMetadata)
			| undefined;
		extendFieldMetadata?:
			| (<FieldShape>(
					metadata: BaseFieldMetadata<FieldShape, ErrorShape>,
					ctx: {
						form: BaseFormMetadata<ErrorShape>;
						when: DefineConditionalField;
					},
			  ) => CustomFieldMetadata)
			| undefined;
	},
): FormMetadata<ErrorShape, CustomFormMetadata, CustomFieldMetadata> {
	const metadata: BaseFormMetadata<ErrorShape> = {
		key: context.state.resetKey,
		id: context.formId,
		errorId: `${context.formId}-form-error`,
		descriptionId: `${context.formId}-form-description`,
		defaultValue: context.state.defaultValue,
		get errors() {
			return getErrors(context.state);
		},
		get fieldErrors() {
			return getFieldErrors(context.state);
		},
		get touched() {
			return isTouched(context.state);
		},
		get valid() {
			return isValid(context.state);
		},
		get invalid() {
			return !this.valid;
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
				name,
				serialize: options?.serialize,
				extendFieldMetadata: options?.extendFieldMetadata,
			});
		},
		getFieldset(name) {
			return getFieldset(context, {
				name,
				serialize: options?.serialize,
				extendFieldMetadata: options?.extendFieldMetadata,
			});
		},
		getFieldList(name) {
			return getFieldList(context, {
				name,
				serialize: options?.serialize,
				extendFieldMetadata: options?.extendFieldMetadata,
			});
		},
	};

	const customMetadata = options?.extendFormMetadata?.(metadata) ?? {};
	const descriptors = Object.getOwnPropertyDescriptors(customMetadata);
	const extended = Object.create(metadata);
	Object.defineProperties(extended, descriptors);

	return extended as FormMetadata<
		ErrorShape,
		CustomFormMetadata,
		CustomFieldMetadata
	>;
}

export function getField<
	FieldShape,
	ErrorShape = string,
	CustomFieldMetadata extends Record<string, unknown> = {},
>(
	context: FormContext<ErrorShape>,
	options: {
		name: FieldName<FieldShape>;
		serialize?: Serialize | undefined;
		extendFieldMetadata?:
			| (<F>(
					metadata: BaseFieldMetadata<F, ErrorShape>,
					ctx: {
						form: BaseFormMetadata<ErrorShape>;
						when: DefineConditionalField;
					},
			  ) => CustomFieldMetadata)
			| undefined;
		form?: BaseFormMetadata<ErrorShape, CustomFieldMetadata> | undefined;
		key?: string | undefined;
	},
): FieldMetadata<FieldShape, ErrorShape, CustomFieldMetadata> {
	const {
		key,
		name,
		serialize = defaultSerialize,
		extendFieldMetadata,
		form = getFormMetadata(context, {
			serialize,
			extendFieldMetadata,
		}),
	} = options;
	const id = `${context.formId}-field-${name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
	const constraint = getConstraint(context, name);
	const metadata: BaseFieldMetadata<FieldShape, ErrorShape> = {
		key,
		name,
		id,
		descriptionId: `${id}-description`,
		errorId: `${id}-error`,
		formId: context.formId,
		required: constraint?.required,
		minLength: constraint?.minLength,
		maxLength: constraint?.maxLength,
		pattern: constraint?.pattern,
		min: constraint?.min,
		max: constraint?.max,
		step: constraint?.step,
		multiple: constraint?.multiple,
		get defaultValue() {
			return getDefaultValue(context, name, serialize);
		},
		get defaultOptions() {
			return getDefaultOptions(context, name, serialize);
		},
		get defaultChecked() {
			return isDefaultChecked(context, name, serialize);
		},
		get touched() {
			return isTouched(context.state, name);
		},
		get valid() {
			return isValid(context.state, name);
		},
		get invalid() {
			return !this.valid;
		},
		get errors() {
			return getErrors(context.state, name);
		},
		get fieldErrors() {
			return getFieldErrors(context.state, name);
		},
		get ariaInvalid() {
			return !this.valid ? true : undefined;
		},
		get ariaDescribedBy() {
			return !this.valid ? this.errorId : undefined;
		},
		getFieldset() {
			return getFieldset(context, {
				name: name as string,
				serialize,
				extendFieldMetadata,
			});
		},
		// @ts-expect-error The return type includes CustomFieldMetadata which BaseFieldMetadata
		// doesn't account for. This is a type-level limitation; runtime behavior is correct.
		getFieldList() {
			return getFieldList(context, {
				name,
				serialize,
				extendFieldMetadata,
			});
		},
	};

	const customMetadata = extendFieldMetadata?.(metadata, { form, when }) ?? {};
	const descriptors = Object.getOwnPropertyDescriptors(customMetadata);
	const extended = Object.create(metadata);
	Object.defineProperties(extended, descriptors);

	return extended as FieldMetadata<FieldShape, ErrorShape, CustomFieldMetadata>;
}

/**
 * Creates a proxy that dynamically generates field objects when properties are accessed.
 */
export function getFieldset<
	FieldShape = Record<string, any>,
	ErrorShape = string,
	CustomFieldMetadata extends Record<string, unknown> = {},
>(
	context: FormContext<ErrorShape>,
	options: {
		name?: FieldName<FieldShape> | undefined;
		serialize?: Serialize | undefined;
		extendFieldMetadata?:
			| (<F>(
					metadata: BaseFieldMetadata<F, ErrorShape>,
					ctx: {
						form: BaseFormMetadata<ErrorShape>;
						when: DefineConditionalField;
					},
			  ) => CustomFieldMetadata)
			| undefined;
		form?: BaseFormMetadata<ErrorShape, CustomFieldMetadata> | undefined;
	},
): Fieldset<FieldShape, ErrorShape, CustomFieldMetadata> {
	return new Proxy({} as any, {
		get(target, name, receiver) {
			if (typeof name === 'string') {
				options.form ??= getFormMetadata(context, {
					serialize: options?.serialize,
					extendFieldMetadata: options?.extendFieldMetadata,
				});

				return getField(context, {
					name: appendPathSegment(options?.name, name),
					serialize: options.serialize,
					extendFieldMetadata: options.extendFieldMetadata,
					form: options.form,
				});
			}

			return Reflect.get(target, name, receiver);
		},
	});
}

/**
 * Creates an array of field objects for list/array inputs
 */
export function getFieldList<
	FieldShape = Array<any>,
	ErrorShape = string,
	CustomFieldMetadata extends Record<string, unknown> = {},
>(
	context: FormContext<ErrorShape>,
	options: {
		name: FieldName<FieldShape>;
		serialize?: Serialize | undefined;
		extendFieldMetadata?:
			| (<F>(
					metadata: BaseFieldMetadata<F, ErrorShape>,
					ctx: {
						form: BaseFormMetadata<ErrorShape>;
						when: DefineConditionalField;
					},
			  ) => CustomFieldMetadata)
			| undefined;
	},
): FieldMetadata<
	[FieldShape] extends [Array<infer ItemShape> | null | undefined]
		? ItemShape
		: unknown,
	ErrorShape,
	CustomFieldMetadata
>[] {
	const keys = getListKey(context, options.name);

	return keys.map((key, index) => {
		return getField<
			[FieldShape] extends [Array<infer ItemShape> | null | undefined]
				? ItemShape
				: unknown,
			ErrorShape,
			CustomFieldMetadata
		>(context, {
			name: appendPathSegment(options.name, index),
			serialize: options.serialize,
			extendFieldMetadata: options.extendFieldMetadata,
			key,
		});
	});
}
