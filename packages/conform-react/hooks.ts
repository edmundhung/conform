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

export function useFormId<Error>(preferredId?: string): FormId<Error> {
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
): FormMetadata<Schema, Error> {
	const formId = useFormId<Error>(options.id);
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

	return useFormMetadata({
		formId,
		context,
		defaultNoValidate: options.defaultNoValidate,
	});
}

export function useFormMetadata<
	Schema extends Record<string, any>,
	Error,
	Value = Schema,
>(options: {
	formId: FormId<Error>;
	context?: Form<Schema, Error, Value>;
	defaultNoValidate?: boolean;
}): FormMetadata<Schema, Error> {
	const subjectRef = useSubjectRef();
	const form = useRegistry(options.formId, options.context);
	const state = useFormState(form, subjectRef);
	const noValidate = useNoValidate(options.defaultNoValidate);

	return getFormMetadata(options.formId, state, subjectRef, form, noValidate);
}

export function useField<Schema, Error>(options: {
	formId: FormId<Error>;
	name: FieldName<Schema>;
	context?: Form<any, Error>;
}): FieldMetadata<Schema, Error> {
	const subjectRef = useSubjectRef();
	const form = useRegistry(options.formId, options.context);
	const state = useFormState(form, subjectRef);

	return getFieldMetadata(options.formId, state, subjectRef, options.name);
}
