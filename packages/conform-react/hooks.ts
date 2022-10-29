import {
	type FieldConfig,
	type FieldElement,
	type FieldValue,
	type FieldsetConstraint,
	type ListCommand,
	type Primitive,
	type Submission,
	focusFirstInvalidField,
	getFormData,
	getFormElement,
	getFormError,
	getName,
	getPaths,
	getSubmissionType,
	isFieldElement,
	parse,
	parseListCommand,
	requestSubmit,
	requestValidate,
	setFormError,
	updateList,
	hasError,
} from '@conform-to/dom';
import {
	type InputHTMLAttributes,
	type FormEvent,
	type RefObject,
	useRef,
	useState,
	useEffect,
} from 'react';
import { input } from './helpers';

export interface FormConfig<Schema extends Record<string, any>> {
	/**
	 * Validation mode. Default to `client-only`.
	 */
	mode?: 'client-only' | 'server-validation';

	/**
	 * Define when the error should be reported initially.
	 * Support "onSubmit", "onChange", "onBlur".
	 *
	 * Default to `onSubmit`.
	 */
	initialReport?: 'onSubmit' | 'onChange' | 'onBlur';

	/**
	 * An object representing the initial value of the form.
	 */
	defaultValue?: FieldValue<Schema>;

	/**
	 * An object describing the state from the last submission
	 */
	state?: Submission<Schema>;

	/**
	 * Enable native validation before hydation.
	 *
	 * Default to `false`.
	 */
	fallbackNative?: boolean;

	/**
	 * Accept form submission regardless of the form validity.
	 *
	 * Default to `false`.
	 */
	noValidate?: boolean;

	/**
	 * A function to be called when the form should be (re)validated.
	 */
	onValidate?: ({
		form,
		formData,
	}: {
		form: HTMLFormElement;
		formData: FormData;
	}) => Submission<Schema>;

	/**
	 * The submit event handler of the form. It will be called
	 * only when the form is considered valid.
	 */
	onSubmit?: (
		event: FormEvent<HTMLFormElement>,
		context: {
			formData: FormData;
			submission: Submission<Schema>;
		},
	) => void;
}

/**
 * Properties to be applied to the form element
 */
interface FormProps {
	ref: RefObject<HTMLFormElement>;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	noValidate: boolean;
}

interface Form<Schema extends Record<string, any>> {
	ref: RefObject<HTMLFormElement>;
	error: string;
	props: FormProps;
	config: FieldsetConfig<Schema>;
}

/**
 * Returns properties required to hook into form events.
 * Applied custom validation and define when error should be reported.
 *
 * @see https://github.com/edmundhung/conform/tree/v0.4.0-pre.2/packages/conform-react/README.md#useform
 */
export function useForm<Schema extends Record<string, any>>(
	config: FormConfig<Schema> = {},
): Form<Schema> {
	const configRef = useRef(config);
	const ref = useRef<HTMLFormElement>(null);
	const [error, setError] = useState<string>(() => {
		const [, message] = config.state?.error?.find(([key]) => key === '') ?? [];

		return message ?? '';
	});
	const [fieldsetConfig, setFieldsetConfig] = useState<FieldsetConfig<Schema>>(
		() => {
			const error = config.state?.error ?? [];

			return {
				defaultValue: config.state?.value ?? config.defaultValue,
				initialError: error.filter(
					([name]) => name !== '' && getSubmissionType(name) === null,
				),
			};
		},
	);
	const [noValidate, setNoValidate] = useState(
		config.noValidate || !config.fallbackNative,
	);

	useEffect(() => {
		configRef.current = config;
	});

	useEffect(() => {
		setNoValidate(true);
	}, []);

	useEffect(() => {
		const form = ref.current;

		if (!form || !config.state) {
			return;
		}

		setFormError(form, config.state);

		if (!form.reportValidity()) {
			focusFirstInvalidField(form);
		}

		requestSubmit(form);
	}, [config.state]);

	useEffect(() => {
		// Revalidate the form when input value is changed
		const handleInput = (event: Event) => {
			const field = event.target;
			const form = ref.current;
			const formConfig = configRef.current;

			if (!form || !isFieldElement(field) || field.form !== form) {
				return;
			}

			if (formConfig.initialReport === 'onChange') {
				field.dataset.conformTouched = 'true';
			}

			if (field.dataset.conformTouched) {
				requestValidate(form, field.name);
			}
		};
		const handleBlur = (event: FocusEvent) => {
			const field = event.target;
			const form = ref.current;
			const formConfig = configRef.current;

			if (!form || !isFieldElement(field) || field.form !== form) {
				return;
			}

			if (
				formConfig.initialReport === 'onBlur' &&
				!field.dataset.conformTouched
			) {
				field.dataset.conformTouched = 'true';

				requestValidate(form, field.name);
			}
		};
		const handleInvalid = (event: Event) => {
			const form = getFormElement(ref.current);
			const field = event.target;

			if (
				!form ||
				!isFieldElement(field) ||
				field.form !== form ||
				field.name !== ''
			) {
				return;
			}

			event.preventDefault();

			if (field.dataset.conformTouched) {
				setError(field.validationMessage);
			}
		};
		const handleReset = (event: Event) => {
			const form = ref.current;
			const formConfig = configRef.current;

			if (!form || event.target !== form) {
				return;
			}

			// Reset all field state
			for (const field of form.elements) {
				if (isFieldElement(field)) {
					delete field.dataset.conformTouched;
					field.setCustomValidity('');
				}
			}

			setError('');
			setFieldsetConfig({
				defaultValue: formConfig.defaultValue,
				initialError: [],
			});
		};

		/**
		 * The input event handler will be triggered in capturing phase in order to
		 * allow follow-up action in the bubble phase based on the latest validity

		 * E.g. `useFieldset` reset the error of valid field after checking the
		 * validity in the bubble phase.
		 */
		document.addEventListener('input', handleInput, true);
		document.addEventListener('blur', handleBlur, true);
		document.addEventListener('invalid', handleInvalid, true);
		document.addEventListener('reset', handleReset);

		return () => {
			document.removeEventListener('input', handleInput, true);
			document.removeEventListener('blur', handleBlur, true);
			document.removeEventListener('invalid', handleInvalid, true);
			document.removeEventListener('reset', handleReset);
		};
	}, []);

	return {
		ref,
		error,
		props: {
			ref,
			noValidate,
			onSubmit(event) {
				const form = event.currentTarget;
				const nativeEvent = event.nativeEvent as SubmitEvent;
				const submitter = nativeEvent.submitter as
					| HTMLButtonElement
					| HTMLInputElement
					| null;

				for (const element of form.elements) {
					if (isFieldElement(element) && element.name === '') {
						setError(element.validationMessage);
						break;
					}
				}

				/**
				 * It checks defaultPrevented to confirm if the submission is intentional
				 * This is utilized by `useFieldList` to modify the list state when the submit
				 * event is captured and revalidate the form with new fields without triggering
				 * a form submission at the same time.
				 */
				if (!submitter || event.defaultPrevented) {
					event.preventDefault();
					return;
				}

				try {
					let submission: Submission<Schema>;

					const formData = getFormData(form, submitter);

					if (typeof config.onValidate === 'function') {
						submission = config.onValidate({ form, formData });
					} else {
						submission = parse(formData);

						if (config.mode !== 'server-validation') {
							submission.error.push(...getFormError(form));
						}
					}

					// Touch all fields only if the submitter is not a command button
					if (submission.type === 'submit') {
						for (const field of form.elements) {
							if (isFieldElement(field)) {
								// Mark the field as touched
								field.dataset.conformTouched = 'true';
							}
						}
					}

					if (
						(!config.noValidate &&
							!submitter.formNoValidate &&
							hasError(submission.error)) ||
						(submission.type === 'validate' &&
							config.mode !== 'server-validation')
					) {
						event.preventDefault();
					} else {
						config.onSubmit?.(event, { formData, submission });
					}

					if (event.defaultPrevented) {
						setFormError(form, submission);

						if (!form.reportValidity()) {
							focusFirstInvalidField(form);
						}
					}
				} catch (e) {
					console.warn(e);
				}
			},
		},
		config: fieldsetConfig,
	};
}

/**
 * All the information of the field, including state and config.
 */
export type Field<Schema> = {
	config: FieldConfig<Schema>;
	error?: string;
};

/**
 * A set of field information.
 */
export type Fieldset<Schema extends Record<string, any>> = {
	[Key in keyof Schema]-?: Field<Schema[Key]>;
};

export interface FieldsetConfig<Schema extends Record<string, any>> {
	/**
	 * The prefix used to generate the name of nested fields.
	 */
	name?: string;

	/**
	 * An object representing the initial value of the fieldset.
	 */
	defaultValue?: FieldValue<Schema>;

	/**
	 * An object describing the initial error of each field
	 */
	initialError?: Array<[string, string]>;

	/**
	 * An object describing the constraint of each field
	 */
	constraint?: FieldsetConstraint<Schema>;

	/**
	 * The id of the form, connecting each field to a form remotely.
	 */
	form?: string;
}

/**
 * Returns all the information about the fieldset.
 *
 * @see https://github.com/edmundhung/conform/tree/v0.4.0-pre.2/packages/conform-react/README.md#usefieldset
 */
export function useFieldset<Schema extends Record<string, any>>(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config: FieldsetConfig<Schema>,
): Fieldset<Schema>;
export function useFieldset<Schema extends Record<string, any>>(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config: FieldConfig<Schema>,
): Fieldset<Schema>;
export function useFieldset<Schema extends Record<string, any>>(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config: FieldsetConfig<Schema> | FieldConfig<Schema>,
): Fieldset<Schema> {
	const configRef = useRef(config);
	const [uncontrolledState, setUncontrolledState] = useState<{
		defaultValue: FieldValue<Schema>;
		initialError: Record<string, Array<[string, string]> | undefined>;
	}>(
		// @ts-expect-error
		() => {
			const initialError: Record<string, Array<[string, string]> | undefined> =
				{};

			for (const [name, message] of config?.initialError ?? []) {
				const [key, ...paths] = getPaths(name);

				if (typeof key === 'string') {
					const scopedName = getName(paths);
					const entries = initialError[key] ?? [];

					if (scopedName === '' && entries.length > 0 && entries[0][0] !== '') {
						initialError[key] = [[scopedName, message], ...entries];
					} else {
						initialError[key] = [...entries, [scopedName, message]];
					}
				}
			}

			return {
				defaultValue: config?.defaultValue ?? {},
				initialError,
			};
		},
	);
	const [error, setError] = useState<Record<string, string | undefined>>(() => {
		const result: Record<string, string> = {};

		for (const [key, entries] of Object.entries(
			uncontrolledState.initialError,
		)) {
			const [name, message] = entries?.[0] ?? [];

			if (name === '') {
				result[key] = message ?? '';
			}
		}

		return result;
	});

	useEffect(() => {
		configRef.current = config;
	});

	useEffect(() => {
		const invalidHandler = (event: Event) => {
			const form = getFormElement(ref.current);
			const field = event.target;
			const fieldsetName = configRef.current.name ?? '';

			if (
				!form ||
				!isFieldElement(field) ||
				field.form !== form ||
				!field.name.startsWith(fieldsetName)
			) {
				return;
			}

			const [key, ...paths] = getPaths(
				fieldsetName.length > 0
					? field.name.slice(fieldsetName.length + 1)
					: field.name,
			);

			// Update the error only if the field belongs to the fieldset
			if (typeof key === 'string' && paths.length === 0) {
				if (field.dataset.conformTouched) {
					setError((prev) => {
						const prevMessage = prev?.[key] ?? '';

						if (prevMessage === field.validationMessage) {
							return prev;
						}

						return {
							...prev,
							[key]: field.validationMessage,
						};
					});
				}

				event.preventDefault();
			}
		};
		const submitHandler = (event: SubmitEvent) => {
			const form = getFormElement(ref.current);

			if (!form || event.target !== form) {
				return;
			}

			/**
			 * Reset the error state of each field if its validity is changed.
			 *
			 * This is a workaround as no official way is provided to notify
			 * when the validity of the field is changed from `invalid` to `valid`.
			 */
			setError((prev) => {
				let next = prev;

				const fieldsetName = configRef.current.name ?? '';

				for (const field of form.elements) {
					if (isFieldElement(field) && field.name.startsWith(fieldsetName)) {
						const key = fieldsetName
							? field.name.slice(fieldsetName.length + 1)
							: field.name;
						const prevMessage = next?.[key] ?? '';
						const nextMessage = field.validationMessage;

						if (prevMessage !== '' && nextMessage === '') {
							next = {
								...next,
								[key]: '',
							};
						}
					}
				}

				return next;
			});
		};
		const resetHandler = (event: Event) => {
			const form = getFormElement(ref.current);

			if (!form || event.target !== form) {
				return;
			}

			const fieldsetConfig = configRef.current as
				| FieldsetConfig<Schema>
				| undefined;

			setUncontrolledState({
				// @ts-expect-error
				defaultValue: fieldsetConfig?.defaultValue ?? {},
				initialError: {},
			});
			setError({});
		};

		// The invalid event does not bubble and so listening on the capturing pharse is needed
		document.addEventListener('invalid', invalidHandler, true);
		document.addEventListener('submit', submitHandler);
		document.addEventListener('reset', resetHandler);

		return () => {
			document.removeEventListener('invalid', invalidHandler, true);
			document.removeEventListener('submit', submitHandler);
			document.removeEventListener('reset', resetHandler);
		};
	}, [ref]);

	/**
	 * This allows us constructing the field at runtime as we have no information
	 * about which fields would be available. The proxy will also help tracking
	 * the usage of each field for optimization in the future.
	 */
	return new Proxy(
		{},
		{
			get(_target, key) {
				if (typeof key !== 'string') {
					return;
				}

				const fieldsetConfig = (config ?? {}) as FieldsetConfig<Schema>;
				const constraint = fieldsetConfig.constraint?.[key];
				const field: Field<unknown> = {
					config: {
						name: fieldsetConfig.name ? `${fieldsetConfig.name}.${key}` : key,
						form: fieldsetConfig.form,
						defaultValue: uncontrolledState.defaultValue[key],
						initialError: uncontrolledState.initialError[key],
						...constraint,
					},
					error: error?.[key] ?? '',
				};

				return field;
			},
		},
	) as Fieldset<Schema>;
}

interface CommandButtonProps {
	name?: string;
	value?: string;
	form?: string;
	formNoValidate: true;
}

type ListCommandPayload<
	Schema,
	Type extends ListCommand<FieldValue<Schema>>['type'],
> = Extract<ListCommand<FieldValue<Schema>>, { type: Type }>['payload'];

/**
 * Returns a list of key and config, with a group of helpers
 * configuring buttons for list manipulation
 *
 * @see https://github.com/edmundhung/conform/tree/v0.4.0-pre.2/packages/conform-react/README.md#usefieldlist
 */
export function useFieldList<Payload = any>(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config: FieldConfig<Array<Payload>>,
): [
	Array<{
		key: string;
		config: FieldConfig<Payload>;
	}>,
	{
		prepend(
			payload?: ListCommandPayload<Payload, 'prepend'>,
		): CommandButtonProps;
		append(payload?: ListCommandPayload<Payload, 'append'>): CommandButtonProps;
		replace(
			payload: ListCommandPayload<Payload, 'replace'>,
		): CommandButtonProps;
		remove(payload: ListCommandPayload<Payload, 'remove'>): CommandButtonProps;
		reorder(
			payload: ListCommandPayload<Payload, 'reorder'>,
		): CommandButtonProps;
	},
] {
	const configRef = useRef(config);
	const [uncontrolledState, setUncontrolledState] = useState<{
		defaultValue: FieldValue<Array<Payload>>;
		initialError: Array<Array<[string, string]> | undefined>;
	}>(() => {
		const initialError: Array<Array<[string, string]> | undefined> = [];

		for (const [name, message] of config?.initialError ?? []) {
			const [index, ...paths] = getPaths(name);

			if (typeof index === 'number') {
				const scopedName = getName(paths);
				const entries = initialError[index] ?? [];

				if (scopedName === '' && entries.length > 0 && entries[0][0] !== '') {
					initialError[index] = [[scopedName, message], ...entries];
				} else {
					initialError[index] = [...entries, [scopedName, message]];
				}
			}
		}

		return {
			defaultValue: config.defaultValue ?? [],
			initialError,
		};
	});
	const [entries, setEntries] = useState<
		Array<[string, FieldValue<Payload> | undefined]>
	>(() => Object.entries(config.defaultValue ?? [undefined]));
	const list = entries.map<{ key: string; config: FieldConfig<Payload> }>(
		([key, defaultValue], index) => ({
			key,
			config: {
				name: `${config.name}[${index}]`,
				form: config.form,
				defaultValue: defaultValue ?? uncontrolledState.defaultValue[index],
				initialError: uncontrolledState.initialError[index],
			},
		}),
	);

	/***
	 * This use proxy to capture all information about the command and
	 * have it encoded in the value.
	 */
	const command = new Proxy(
		{},
		{
			get(_target, type: any) {
				return (payload: any = {}) => {
					return {
						name: 'conform/list',
						value: JSON.stringify({ type, scope: config.name, payload }),
						form: config.form,
						formNoValidate: true,
					};
				};
			},
		},
	);

	useEffect(() => {
		configRef.current = config;
	});

	useEffect(() => {
		const submitHandler = (event: SubmitEvent) => {
			const form = getFormElement(ref.current);

			if (
				!form ||
				event.target !== form ||
				!(event.submitter instanceof HTMLButtonElement) ||
				event.submitter.name !== 'conform/list'
			) {
				return;
			}

			const command = parseListCommand<ListCommand<FieldValue<Payload>>>(
				event.submitter.value,
			);

			if (command.scope !== configRef.current.name) {
				// Ensure the scope of the listener are limited to specific field name
				return;
			}

			setEntries((entries) => {
				switch (command.type) {
					case 'append':
					case 'prepend':
					case 'replace':
						return updateList([...(entries ?? [])], {
							...command,
							payload: {
								...command.payload,
								defaultValue: [`${Date.now()}`, command.payload.defaultValue],
							},
						} as ListCommand<[string, FieldValue<Payload> | undefined]>);
					default: {
						return updateList([...(entries ?? [])], command);
					}
				}
			});
			event.preventDefault();
		};
		const resetHandler = (event: Event) => {
			const form = getFormElement(ref.current);

			if (!form || event.target !== form) {
				return;
			}

			const fieldConfig = configRef.current;

			setUncontrolledState({
				defaultValue: fieldConfig.defaultValue ?? [],
				initialError: [],
			});
			setEntries(Object.entries(fieldConfig.defaultValue ?? [undefined]));
		};

		document.addEventListener('submit', submitHandler, true);
		document.addEventListener('reset', resetHandler);

		return () => {
			document.removeEventListener('submit', submitHandler, true);
			document.removeEventListener('reset', resetHandler);
		};
	}, [ref]);

	return [
		list,
		// @ts-expect-error proxy type
		command,
	];
}

interface ShadowInputProps extends InputHTMLAttributes<HTMLInputElement> {
	ref: RefObject<HTMLInputElement>;
}

interface InputControl<Element extends { focus: () => void }> {
	ref: RefObject<Element>;
	value: string;
	onChange: (eventOrValue: { target: { value: string } } | string) => void;
	onBlur: () => void;
	onInvalid: (event: FormEvent<FieldElement>) => void;
}

/**
 * Returns the properties required to configure a shadow input for validation.
 * This is particular useful when integrating dropdown and datepicker whichs
 * introduces custom input mode.
 *
 * @see https://github.com/edmundhung/conform/tree/v0.4.0-pre.2/packages/conform-react/README.md#usecontrolledinput
 */
export function useControlledInput<
	Element extends { focus: () => void } = HTMLInputElement,
	Schema extends Primitive = Primitive,
>(config: FieldConfig<Schema>): [ShadowInputProps, InputControl<Element>] {
	const ref = useRef<HTMLInputElement>(null);
	const inputRef = useRef<Element>(null);
	const configRef = useRef(config);
	const [uncontrolledState, setUncontrolledState] = useState<{
		defaultValue?: FieldValue<Schema>;
		initialError?: Array<[string, string]>;
	}>({
		defaultValue: config.defaultValue,
		initialError: config.initialError,
	});
	const [value, setValue] = useState<string>(`${config.defaultValue ?? ''}`);
	const handleChange: InputControl<Element>['onChange'] = (eventOrValue) => {
		if (!ref.current) {
			return;
		}

		const newValue =
			typeof eventOrValue === 'string'
				? eventOrValue
				: eventOrValue.target.value;

		ref.current.value = newValue;
		ref.current.dispatchEvent(new InputEvent('input', { bubbles: true }));
		setValue(newValue);
	};
	const handleBlur: InputControl<Element>['onBlur'] = () => {
		ref.current?.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
	};
	const handleInvalid: InputControl<Element>['onInvalid'] = (event) => {
		event.preventDefault();
	};

	useEffect(() => {
		configRef.current = config;
	});

	useEffect(() => {
		const resetHandler = (event: Event) => {
			const form = getFormElement(ref.current);

			if (!form || event.target !== form) {
				return;
			}

			setUncontrolledState({
				defaultValue: configRef.current.defaultValue,
				initialError: configRef.current.initialError,
			});
			setValue(`${configRef.current.defaultValue ?? ''}`);
		};

		document.addEventListener('reset', resetHandler);

		return () => {
			document.removeEventListener('reset', resetHandler);
		};
	}, []);

	return [
		{
			ref,
			style: {
				position: 'absolute',
				width: '1px',
				height: '1px',
				padding: 0,
				margin: '-1px',
				overflow: 'hidden',
				clip: 'rect(0,0,0,0)',
				whiteSpace: 'nowrap',
				borderWidth: 0,
			},
			onFocus() {
				inputRef.current?.focus();
			},
			...input({ ...config, ...uncontrolledState }, { type: 'text' }),
		},
		{
			ref: inputRef,
			value,
			onChange: handleChange,
			onBlur: handleBlur,
			onInvalid: handleInvalid,
		},
	];
}
