import {
	type UnionKeyof,
	type UnionKeyType,
	type Constraint,
	type FieldName,
	type Form,
	type SubmissionResult,
	type Submission,
	type DefaultValue,
	createForm,
} from '@conform-to/dom';
import { useEffect, useId, useRef, useState, useCallback } from 'react';
import {
	type BaseConfig,
	type FieldConfig,
	useFormContext,
	useSubjectRef,
	getFieldConfig,
} from './context';

export function useFormId(preferredId?: string): string {
	const id = useId();

	return preferredId ?? id;
}

export function useNoValidate(defaultNoValidate = true): boolean {
	const [noValidate, setNoValidate] = useState(defaultNoValidate);

	useEffect(() => {
		// This is necessary to fix an issue in strict mode with related to our proxy setup
		// It avoids the component from being rerendered without re-rendering the child
		// Which reset the proxy but failed to capture its usage within child component
		if (!noValidate) {
			setNoValidate(true);
		}
	}, [noValidate]);

	return noValidate;
}

export type FormConfig<Type extends Record<string, any>> = BaseConfig<Type> & {
	onSubmit: (
		event: React.FormEvent<HTMLFormElement>,
	) => ReturnType<Form<Type>['submit']>;
	onReset: (event: React.FormEvent<HTMLFormElement>) => void;
	noValidate: boolean;
};

export function useForm<Type extends Record<string, any>>(options: {
	/**
	 * If the form id is provided, Id for label,
	 * input and error elements will be derived.
	 */
	id?: string;

	/**
	 * An object representing the initial value of the form.
	 */
	defaultValue?: DefaultValue<Type>;

	/**
	 * An object describing the result of the last submission
	 */
	lastResult?: SubmissionResult;

	/**
	 * An object describing the constraint of each field
	 */
	constraint?: Record<string, Constraint>;

	/**
	 * Enable constraint validation before the dom is hydated.
	 *
	 * Default to `true`.
	 */
	defaultNoValidate?: boolean;

	/**
	 * Define when conform should start validation.
	 * Support "onSubmit", "onInput", "onBlur".
	 *
	 * @default "onSubmit"
	 */
	shouldValidate?: 'onSubmit' | 'onBlur' | 'onInput';

	/**
	 * Define when conform should revalidate again.
	 * Support "onSubmit", "onInput", "onBlur".
	 *
	 * @default Same as shouldValidate, or "onSubmit" if shouldValidate is not provided.
	 */
	shouldRevalidate?: 'onSubmit' | 'onBlur' | 'onInput';

	/**
	 * A function to be called when the form should be (re)validated.
	 */
	onValidate?: ({
		form,
		submitter,
		formData,
	}: {
		form: HTMLFormElement;
		submitter: HTMLInputElement | HTMLButtonElement | null;
		formData: FormData;
	}) => Submission<Type>;
}): {
	form: FormConfig<Type>;
	context: Form<Type>;
	fields: Type extends Array<any>
		? { [Key in keyof Type]: FieldConfig<Type[Key]> }
		: Type extends { [key in string]?: any }
		? { [Key in UnionKeyof<Type>]: FieldConfig<UnionKeyType<Type, Key>> }
		: Record<string | number, FieldConfig<any>>;
} {
	const formId = useFormId(options.id);
	const initializeForm = () =>
		createForm(formId, {
			defaultValue: options.defaultValue,
			constraint: options.constraint,
			lastResult: options.lastResult,
			onValidate: options.onValidate,
			shouldValidate: options.shouldValidate,
			shouldRevalidate: options.shouldRevalidate,
		});
	const [form, setForm] = useState(initializeForm);

	// If id changes, reinitialize the form immediately
	if (formId !== form.id) {
		setForm(initializeForm);
	}

	const noValidate = useNoValidate(options.defaultNoValidate);
	const optionsRef = useRef(options);
	const config = useField<Type>({
		formId,
		context: form,
		name: '',
	});
	const fields = useFieldset<Type>({
		formId,
		context: form,
	});

	useEffect(() => {
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

	useEffect(() => {
		optionsRef.current = options;
		form.update({
			defaultValue: options.defaultValue,
			constraint: options.constraint,
			shouldValidate: options.shouldValidate,
			shouldRevalidate: options.shouldRevalidate,
			onValidate: options.onValidate,
		});
	});

	const onSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			const submitEvent = event.nativeEvent as SubmitEvent;
			const result = form.submit(submitEvent);

			if (submitEvent.defaultPrevented) {
				event.preventDefault();
			}

			return result;
		},
		[form],
	);
	const onReset = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => form.reset(event.nativeEvent),
		[form],
	);

	return {
		context: form,
		fields,
		form: {
			id: formId,
			errorId: config.errorId,
			descriptionId: config.descriptionId,
			onSubmit,
			onReset,
			noValidate,
			get defaultValue() {
				return config.defaultValue;
			},
			get value() {
				return config.value;
			},
			get dirty() {
				return config.dirty;
			},
			get valid() {
				return config.valid;
			},
			get error() {
				return config.error;
			},
			get allError() {
				return config.allError;
			},
			get allValid() {
				return config.allValid;
			},
		},
	};
}

export function useFieldset<Type>(options: {
	formId: string;
	name?: FieldName<Type>;
	context?: Form;
}): Type extends Array<any>
	? { [Key in keyof Type]: FieldConfig<Type[Key]> }
	: Type extends { [key in string]?: any }
	? { [Key in UnionKeyof<Type>]: FieldConfig<UnionKeyType<Type, Key>> }
	: Record<string | number, FieldConfig<any>> {
	const subjectRef = useSubjectRef();
	const context = useFormContext(options.formId, options.context, subjectRef);

	return new Proxy({} as any, {
		get(target, prop, receiver) {
			const getConfig = (key: string | number) =>
				getFieldConfig(options.formId, context, {
					name: options.name,
					key: key,
					subjectRef,
				});

			// To support array destructuring
			if (prop === Symbol.iterator) {
				let index = 0;

				return () => ({
					next: () => ({ value: getConfig(index++), done: false }),
				});
			}

			const index = Number(prop);

			if (typeof prop === 'string') {
				return getConfig(Number.isNaN(index) ? prop : index);
			}

			return Reflect.get(target, prop, receiver);
		},
	});
}

export function useFieldList<Item>(options: {
	formId: string;
	name: FieldName<Array<Item>>;
	context?: Form;
}): Array<FieldConfig<Item>> {
	const subjectRef = useSubjectRef({
		defaultValue: {
			name: [options.name],
		},
	});
	const context = useFormContext(options.formId, options.context, subjectRef);
	const defaultValue = context.initialValue[options.name] ?? [];

	if (!Array.isArray(defaultValue)) {
		throw new Error('The default value at the given name is not a list');
	}

	return Array(defaultValue.length)
		.fill(0)
		.map((_, index) =>
			getFieldConfig<Item>(options.formId, context, {
				name: options.name,
				key: index,
				subjectRef,
			}),
		);
}

export function useField<Type>(options: {
	formId: string;
	name: FieldName<Type>;
	context?: Form;
}): FieldConfig<Type> {
	const subjectRef = useSubjectRef();
	const context = useFormContext(options.formId, options.context, subjectRef);
	const field = getFieldConfig<Type>(options.formId, context, {
		name: options.name,
		subjectRef,
	});

	return field;
}
