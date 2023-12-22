import {
	type FormId,
	type FieldName,
	type FormOptions,
	createFormContext,
} from '@conform-to/dom';
import { useEffect, useId, useRef, useState, useLayoutEffect } from 'react';
import {
	type FormMetadata,
	type FieldMetadata,
	type Pretty,
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

export function useFormId<Schema extends Record<string, unknown>, Error>(
	preferredId?: string,
): FormId<Schema, Error> {
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
	Error = string[],
	Value = Schema,
>(
	options: Pretty<
		Omit<FormOptions<Schema, Error, Value>, 'formId'> & {
			/**
			 * If the form id is provided, Id for label,
			 * input and error elements will be derived.
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
): {
	form: FormMetadata<Schema, Error>;
	fieldset: ReturnType<FormMetadata<Schema, Error>['getFieldset']>;
} {
	const formId = useFormId<Schema, Error>(options.id);
	const [context] = useState(() => createFormContext({ ...options, formId }));
	const optionsRef = useRef(options);

	useSafeLayoutEffect(() => {
		document.addEventListener('input', context.input);
		document.addEventListener('focusout', context.blur);
		document.addEventListener('reset', context.reset);

		return () => {
			document.removeEventListener('input', context.input);
			document.removeEventListener('focusout', context.blur);
			document.removeEventListener('reset', context.reset);
		};
	}, [context]);

	useSafeLayoutEffect(() => {
		if (options.lastResult === optionsRef.current.lastResult) {
			// If there is no change, do nothing
			return;
		}

		if (options.lastResult) {
			context.report(options.lastResult);
		}
	}, [context, options.lastResult]);

	useSafeLayoutEffect(() => {
		optionsRef.current = options;
		context.update({ ...options, formId });
	});

	const subjectRef = useSubjectRef();
	const state = useFormState(context, subjectRef);
	const noValidate = useNoValidate(options.defaultNoValidate);
	const form = getFormMetadata(formId, state, subjectRef, context, noValidate);

	return {
		form,
		fieldset: form.getFieldset(),
	};
}

export function useFormMetadata<
	Schema extends Record<string, any>,
	Error,
>(options: {
	formId: FormId<Schema, Error>;
	defaultNoValidate?: boolean;
}): FormMetadata<Schema, Error> {
	const subjectRef = useSubjectRef();
	const context = useFormContext(options.formId);
	const state = useFormState(context, subjectRef);
	const noValidate = useNoValidate(options.defaultNoValidate);

	return getFormMetadata(
		options.formId,
		state,
		subjectRef,
		context,
		noValidate,
	);
}

export function useField<
	FormSchema extends Record<string, unknown>,
	FieldSchema = FormSchema,
	Error = unknown,
>(
	options:
		| {
				formId: FormId<FormSchema, Error>;
				name: FieldName<FieldSchema>;
		  }
		| {
				formId: FormId<FormSchema, Error>;
				name?: undefined;
		  },
): {
	field: FieldMetadata<FieldSchema, Error, FormSchema>;
	fieldset: FieldMetadata<
		FieldSchema,
		Error,
		FormSchema
	>['getFieldset'] extends Function
		? ReturnType<FieldMetadata<FieldSchema, Error, FormSchema>['getFieldset']>
		: never;
	fieldlist: FieldMetadata<
		FieldSchema,
		Error,
		FormSchema
	>['getFieldList'] extends Function
		? ReturnType<FieldMetadata<FieldSchema, Error, FormSchema>['getFieldList']>
		: never;
	form: FormMetadata<FormSchema, Error>;
} {
	const subjectRef = useSubjectRef();
	const context = useFormContext(options.formId);
	const state = useFormState(context, subjectRef);
	const field = getFieldMetadata<FieldSchema, Error, FormSchema>(
		options.formId,
		state,
		subjectRef,
		options.name,
	);
	const form = getFormMetadata(
		options.formId,
		state,
		subjectRef,
		context,
		false,
	);

	return {
		field,
		// @ts-expect-error The types is used as a hint only
		get fieldset() {
			return field.getFieldset();
		},
		// @ts-expect-error The types is used as a hint only
		get fieldlist() {
			return field.getFieldList();
		},
		form,
	};
}
