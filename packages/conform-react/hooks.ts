import {
	type UnionKeyof,
	type UnionKeyType,
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
	useFormContext,
	useSubjectRef,
	getFieldMetadata,
	getBaseMetadata,
	useFormStore,
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
	const metadata = useFormMetadata({
		formId,
		context: form,
		defaultNoValidate: options.defaultNoValidate,
	});
	const fields = useFieldset<Schema>({
		formId,
		context: form,
	});

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

	return {
		context: form,
		fields,
		form: metadata,
	};
}

export function useFormMetadata<Schema extends Record<string, any>>(options: {
	formId: string;
	context?: Form<Schema>;
	defaultNoValidate?: boolean;
}): FormMetadata<Schema> {
	const subjectRef = useSubjectRef();
	const form = useFormStore(options.formId, options.context);
	const context = useFormContext(form, subjectRef);
	const metadata = getBaseMetadata<Schema>(options.formId, context, {
		subjectRef,
	});
	const [noValidate, setNoValidate] = useState(
		options.defaultNoValidate ?? true,
	);

	useSafeLayoutEffect(() => {
		// This is necessary to fix an issue in strict mode with related to our proxy setup
		// It avoids the component from being rerendered without re-rendering the child
		// Which reset the proxy but failed to capture its usage within child component
		if (!noValidate) {
			setNoValidate(true);
		}
	}, [noValidate]);

	return new Proxy(metadata as any, {
		get(target, key, receiver) {
			switch (key) {
				case 'onSubmit':
					return (event: React.FormEvent<HTMLFormElement>) => {
						const submitEvent = event.nativeEvent as SubmitEvent;
						const result = form.submit(submitEvent);

						if (submitEvent.defaultPrevented) {
							event.preventDefault();
						}

						return result;
					};
				case 'onReset':
					return (event: React.FormEvent<HTMLFormElement>) =>
						form.reset(event.nativeEvent);
				case 'noValidate':
					return noValidate;
			}

			return Reflect.get(target, key, receiver);
		},
	});
}

export type FieldsetMetadata<Schema> = Schema extends Array<any>
	? { [Key in keyof Schema]: FieldMetadata<Schema[Key]> }
	: Schema extends { [key in string]?: any }
	? { [Key in UnionKeyof<Schema>]: FieldMetadata<UnionKeyType<Schema, Key>> }
	: Record<string | number, FieldMetadata<any>>;

export function useFieldset<Schema>(options: {
	formId: string;
	name?: FieldName<Schema>;
	context?: Form;
}): Pretty<FieldsetMetadata<Schema>> {
	const subjectRef = useSubjectRef();
	const form = useFormStore(options.formId, options.context);
	const context = useFormContext(form, subjectRef);

	return new Proxy({} as any, {
		get(target, prop, receiver) {
			const getMetadata = (key: string | number) =>
				getFieldMetadata(options.formId, context, {
					name: options.name,
					key: key,
					subjectRef,
				});

			// To support array destructuring
			if (prop === Symbol.iterator) {
				let index = 0;

				return () => ({
					next: () => ({ value: getMetadata(index++), done: false }),
				});
			}

			const index = Number(prop);

			if (typeof prop === 'string') {
				return getMetadata(Number.isNaN(index) ? prop : index);
			}

			return Reflect.get(target, prop, receiver);
		},
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
	const form = useFormStore(options.formId, options.context);
	const context = useFormContext(form, subjectRef);
	const initialValue = context.initialValue[options.name] ?? [];

	if (!Array.isArray(initialValue)) {
		throw new Error('The initial value at the given name is not a list');
	}

	return Array(initialValue.length)
		.fill(0)
		.map((_, index) =>
			getFieldMetadata<Item<Schema>>(options.formId, context, {
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
	const form = useFormStore(options.formId, options.context);
	const context = useFormContext(form, subjectRef);
	const metadata = getFieldMetadata<Schema>(options.formId, context, {
		name: options.name,
		subjectRef,
	});

	return metadata;
}
