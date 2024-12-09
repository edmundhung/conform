import {
	type FormId,
	type FieldName,
	unstable_createFormObserver as createFormObserver,
	unstable_syncFormState as syncFormState,
} from '@conform-to/dom';
import { useEffect, useId, useState, useLayoutEffect, useRef } from 'react';
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

export const formObserver = createFormObserver();

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

			/**
			 * Define if the input could be updated by conform.
			 * Default to inputs that are configured using the `getInputProps`, `getSelectProps` or `getTextareaProps` helpers.
			 */
			shouldSyncElement?: (
				element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
			) => boolean;
		}
	>,
): [
	FormMetadata<Schema, FormError>,
	ReturnType<FormMetadata<Schema, FormError>['getFieldset']>,
] {
	const { id, ...formConfig } = options;
	const optionsRef = useRef(options);
	const formId = useFormId<Schema, FormError>(id);
	const [context] = useState(() =>
		createFormContext({ ...formConfig, formId }),
	);

	useSafeLayoutEffect(() => {
		const formId = context.getFormId();
		const disconnect = formObserver.onFieldMounted((formElement) => {
			if (formElement === document.forms.namedItem(formId)) {
				syncFormState(
					formElement,
					context.getState(),
					optionsRef.current.shouldSyncElement,
				);
				// syncFormState must happen before syncFormValue to ensure the newly mounted field have the correct default value set
				context.syncFormValue();
			}
		});
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
		optionsRef.current = options;
		context.onUpdate({ ...formConfig, formId });
	});

	const subjectRef = useSubjectRef({
		key: {
			// Subscribe to all key changes so it will re-render and
			// update the field value as soon as the DOM is updated
			prefix: [''],
		},
	});
	const stateSnapshot = useFormState(context, subjectRef);
	const noValidate = useNoValidate(options.defaultNoValidate);
	const form = getFormMetadata(context, subjectRef, stateSnapshot, noValidate);

	useEffect(() => {
		const formId = context.getFormId();
		const formElement = document.forms.namedItem(formId);

		if (formElement) {
			syncFormState(
				formElement,
				stateSnapshot,
				optionsRef.current.shouldSyncElement,
			);
		}
	}, [context, stateSnapshot]);

	return [form, form.getFieldset()];
}

export function useFormMetadata<
	Schema extends Record<string, any>,
	FormError = string[],
>(
	formId?: FormId<Schema, FormError>,
	options: {
		defaultNoValidate?: boolean;
	} = {},
): FormMetadata<Schema, FormError> {
	const subjectRef = useSubjectRef();
	const context = useFormContext(formId);
	const stateSnapshot = useFormState(context, subjectRef);
	const noValidate = useNoValidate(options.defaultNoValidate);

	return getFormMetadata(context, subjectRef, stateSnapshot, noValidate);
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
	const stateSnapshot = useFormState(context, subjectRef);
	const field = getFieldMetadata<FieldSchema, FormSchema, FormError>(
		context,
		subjectRef,
		stateSnapshot,
		name,
	);
	const form = getFormMetadata(context, subjectRef, stateSnapshot, false);

	return [field, form];
}
