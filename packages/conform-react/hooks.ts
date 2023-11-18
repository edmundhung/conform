import {
	type FieldName,
	type Form,
	type FormOptions,
	createForm,
} from '@conform-to/dom';
import { useEffect, useId, useRef, useState, useLayoutEffect } from 'react';
import {
	type FormMetadata,
	type FieldMetadata,
	type FieldsetMetadata,
	type Pretty,
	useFormState,
	useRegistry,
	useSubjectRef,
	getFieldMetadata,
	getFormMetadata,
	getFieldsetMetadata,
} from './context';

/**
 * useLayoutEffect is client-only.
 * This basically makes it a no-op on server
 */
export const useSafeLayoutEffect =
	typeof document === 'undefined' ? useEffect : useLayoutEffect;

export function useFormId(preferredId?: string): string {
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

export function useForm<Schema extends Record<string, any>>(
	options: Pretty<
		FormOptions<Schema> & {
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
	form: FormMetadata<Schema>;
	context: Form<Schema>;
	fields: Pretty<FieldsetMetadata<Schema>>;
} {
	const formId = useFormId(options.id);
	const initializeForm = () => createForm(formId, options);
	const [form, setForm] = useState(initializeForm);

	// If id changes, reinitialize the form immediately
	if (formId !== form.id) {
		setForm(initializeForm);
	}

	const optionsRef = useRef(options);

	useSafeLayoutEffect(() => form.initialize(), [form]);

	useSafeLayoutEffect(() => {
		if (options.lastResult === optionsRef.current.lastResult) {
			// If there is no change, do nothing
			return;
		}

		if (options.lastResult) {
			form.report(options.lastResult);
		} else {
			document.forms.namedItem(form.id)?.reset();
		}
	}, [form, options.lastResult]);

	useSafeLayoutEffect(() => {
		optionsRef.current = options;
		form.update(options);
	});

	const subjectRef = useSubjectRef();
	const context = useFormState(form, subjectRef);
	const noValidate = useNoValidate(options.defaultNoValidate);

	return {
		form: getFormMetadata(formId, context, {
			subjectRef,
			form,
			noValidate,
		}),
		fields: getFieldsetMetadata(formId, context, {
			subjectRef,
		}),
		context: form,
	};
}

export function useFormMetadata<Schema extends Record<string, any>>(options: {
	formId: string;
	context?: Form<Schema>;
	defaultNoValidate?: boolean;
}): FormMetadata<Schema> {
	const subjectRef = useSubjectRef();
	const form = useRegistry(options.formId, options.context);
	const state = useFormState(form, subjectRef);
	const noValidate = useNoValidate(options.defaultNoValidate);

	return getFormMetadata(options.formId, state, {
		subjectRef,
		form,
		noValidate,
	});
}

export function useFieldset<Schema>(options: {
	formId: string;
	name?: FieldName<Schema>;
	context?: Form;
}): Pretty<FieldsetMetadata<Schema>> {
	const subjectRef = useSubjectRef();
	const form = useRegistry(options.formId, options.context);
	const state = useFormState(form, subjectRef);

	return getFieldsetMetadata(options.formId, state, {
		name: options.name,
		subjectRef,
	});
}

export type Item<List> = List extends Array<infer Item> ? Item : any;

export function useFieldList<Schema>(options: {
	formId: string;
	name: FieldName<Schema>;
	context?: Form;
}): Array<FieldMetadata<Item<Schema>>> {
	const subjectRef = useSubjectRef({
		initialValue: {
			name: [options.name],
		},
	});
	const form = useRegistry(options.formId, options.context);
	const state = useFormState(form, subjectRef);
	const initialValue = state.initialValue[options.name] ?? [];

	if (!Array.isArray(initialValue)) {
		throw new Error('The initial value at the given name is not a list');
	}

	return Array(initialValue.length)
		.fill(0)
		.map((_, index) =>
			getFieldMetadata<Item<Schema>>(options.formId, state, {
				name: options.name,
				key: index,
				subjectRef,
			}),
		);
}

export function useField<Schema>(options: {
	formId: string;
	name: FieldName<Schema>;
	context?: Form;
}): FieldMetadata<Schema> {
	const subjectRef = useSubjectRef();
	const form = useRegistry(options.formId, options.context);
	const state = useFormState(form, subjectRef);

	return getFieldMetadata<Schema>(options.formId, state, {
		name: options.name,
		subjectRef,
	});
}
