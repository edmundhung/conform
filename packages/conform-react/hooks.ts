import { type FormId, type FieldName } from '@conform-to/dom';
import { useEffect, useId, useState, useLayoutEffect } from 'react';
import {
	type FormMetadata,
	type FieldMetadata,
	type Pretty,
	type FormOptions,
	createFormContext,
	useFormState,
	useFormContext,
	useSubjectRef,
	getFieldMetadata,
	getFormMetadata,
} from './context';

/**
 * useLayoutEffect is client-only.
 * This basically makes it a no-op on server
 */
export const useSafeLayoutEffect =
	typeof document === 'undefined' ? useEffect : useLayoutEffect;

export function useFormId<Schema extends Record<string, unknown>, FormError>(
	preferredId?: string,
): FormId<Schema, FormError> {
	const id = useId();

	return preferredId ?? id;
}

export function useNoValidate(defaultNoValidate = true): boolean {
	const [noValidate, setNoValidate] = useState(defaultNoValidate);

	useSafeLayoutEffect(() => {
		// This is necessary to fix an issue in strict mode with related to our proxy setup
		// It avoids the component from being rerendered without re-rendering the child
		// Which reset the proxy but failed to capture its usage within child component
		if (!noValidate) {
			setNoValidate(true);
		}
	}, [noValidate]);

	return noValidate;
}

export function useForm<
	Schema extends Record<string, any>,
	FormValue = Schema,
	FormError = string[],
>(
	options: Pretty<
		Omit<FormOptions<Schema, FormError, FormValue>, 'formId'> & {
			/**
			 * The form id. If not provided, a random id will be generated.
			 */
			id?: string;

			/**
			 * Enable constraint validation before the dom is hydated.
			 *
			 * Default to `true`.
			 */
			defaultNoValidate?: boolean;
		}
	>,
): [
	FormMetadata<Schema, FormError>,
	ReturnType<FormMetadata<Schema, FormError>['getFieldset']>,
] {
	const { id, ...formConfig } = options;
	const formId = useFormId<Schema, FormError>(id);
	const [context] = useState(() =>
		createFormContext({ ...formConfig, formId }),
	);

	useSafeLayoutEffect(() => {
		const disconnect = context.observe();
		document.addEventListener('input', context.onInput);
		document.addEventListener('focusout', context.onBlur);
		document.addEventListener('reset', context.onReset);

		return () => {
			disconnect();
			document.removeEventListener('input', context.onInput);
			document.removeEventListener('focusout', context.onBlur);
			document.removeEventListener('reset', context.onReset);
		};
	}, [context]);

	useSafeLayoutEffect(() => {
		context.onUpdate({ ...formConfig, formId });
	});

	const subjectRef = useSubjectRef();
	const state = useFormState(context, subjectRef);
	const noValidate = useNoValidate(options.defaultNoValidate);
	const form = getFormMetadata(formId, state, subjectRef, context, noValidate);

	return [form, form.getFieldset()];
}

export function useFormMetadata<
	Schema extends Record<string, any>,
	FormError = string[],
>(
	formId: FormId<Schema, FormError>,
	options: {
		defaultNoValidate?: boolean;
	} = {},
): FormMetadata<Schema, FormError> {
	const subjectRef = useSubjectRef();
	const context = useFormContext(formId);
	const state = useFormState(context, subjectRef);
	const noValidate = useNoValidate(options.defaultNoValidate);

	return getFormMetadata(
		context.formId,
		state,
		subjectRef,
		context,
		noValidate,
	);
}

export function useField<
	FieldSchema,
	FormSchema extends Record<string, unknown> = Record<string, unknown>,
	FormError = string[],
>(
	name: FieldName<FieldSchema, FormSchema, FormError>,
	options: {
		formId?: FormId<FormSchema, FormError>;
	} = {},
): [
	FieldMetadata<FieldSchema, FormSchema, FormError>,
	FormMetadata<FormSchema, FormError>,
] {
	const subjectRef = useSubjectRef();
	const context = useFormContext(options.formId);
	const state = useFormState(context, subjectRef);
	const field = getFieldMetadata<FieldSchema, FormSchema, FormError>(
		context.formId,
		state,
		subjectRef,
		name,
	);
	const form = getFormMetadata(
		context.formId,
		state,
		subjectRef,
		context,
		false,
	);

	return [field, form];
}
