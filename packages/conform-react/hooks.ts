import {
	type FormId,
	type FieldName,
	type Form,
	type FormOptions,
	createForm,
} from '@conform-to/dom';
import { useEffect, useId, useRef, useState, useLayoutEffect } from 'react';
import {
	type FormMetadata,
	type FieldMetadata,
	type Pretty,
	useFormState,
	useRegistry,
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
		FormOptions<Schema, Error, Value> & {
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
	meta: FormMetadata<Schema, Error>;
	fields: ReturnType<FormMetadata<Schema, Error>['getFieldset']>;
} {
	const formId = useFormId<Schema, Error>(options.id);
	const initializeContext = () => createForm(formId, options);
	const [context, setContext] = useState(initializeContext);

	// If id changes, reinitialize the form immediately
	if (formId !== context.id) {
		setContext(initializeContext);
	}

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
		} else {
			document.forms.namedItem(context.id)?.reset();
		}
	}, [context, options.lastResult]);

	useSafeLayoutEffect(() => {
		optionsRef.current = options;
		context.update(options);
	});

	const meta = useFormMetadata({
		formId,
		context,
		defaultNoValidate: options.defaultNoValidate,
	});

	return {
		meta,
		fields: meta.getFieldset(),
	};
}

export function useFormMetadata<
	Schema extends Record<string, any>,
	Error,
	Value = Schema,
>(options: {
	formId: FormId<Schema, Error>;
	context?: Form<Schema, Error, Value>;
	defaultNoValidate?: boolean;
}): FormMetadata<Schema, Error> {
	const subjectRef = useSubjectRef();
	const form = useRegistry(options.formId, options.context);
	const state = useFormState(form, subjectRef);
	const noValidate = useNoValidate(options.defaultNoValidate);

	return getFormMetadata(options.formId, state, subjectRef, form, noValidate);
}

export function useField<
	Schema,
	Error,
	FormSchema extends Record<string, unknown> = Record<string, unknown>,
>(options: {
	formId: FormId<FormSchema, Error>;
	name: FieldName<Schema>;
	context?: Form<FormSchema, Error>;
}): {
	meta: FieldMetadata<Schema, Error, FormSchema>;
	fields: FieldMetadata<
		Schema,
		Error,
		FormSchema
	>['getFieldset'] extends Function
		? ReturnType<FieldMetadata<Schema, Error, FormSchema>['getFieldset']>
		: never;
	list: FieldMetadata<
		Schema,
		Error,
		FormSchema
	>['getFieldList'] extends Function
		? ReturnType<FieldMetadata<Schema, Error, FormSchema>['getFieldList']>
		: never;
	form: FormMetadata<FormSchema, Error>;
} {
	const subjectRef = useSubjectRef();
	const context = useRegistry(options.formId, options.context);
	const state = useFormState(context, subjectRef);
	const meta = getFieldMetadata<Schema, Error, FormSchema>(
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
		meta,
		// @ts-expect-error The types is used as a hint only
		get fields() {
			return meta.getFieldset();
		},
		// @ts-expect-error The types is used as a hint only
		get list() {
			return meta.getFieldList();
		},
		form,
	};
}
