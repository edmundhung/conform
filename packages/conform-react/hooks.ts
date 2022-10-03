import {
	type FieldConfig,
	type FieldValue,
	type FieldElement,
	type FieldsetConstraint,
	type ListCommand,
	type Primitive,
	isFieldElement,
	getKey,
	listCommandKey,
	serializeListCommand,
	parseListCommand,
	updateList,
	getFormElement,
	getPaths,
	getName,
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

export interface FormConfig {
	/**
	 * Define when the error should be reported initially.
	 * Support "onSubmit", "onChange", "onBlur".
	 *
	 * Default to `onSubmit`.
	 */
	initialReport?: 'onSubmit' | 'onChange' | 'onBlur';

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
	validate?: (
		form: HTMLFormElement,
		submitter?: HTMLInputElement | HTMLButtonElement | null,
	) => void;

	/**
	 * The submit event handler of the form. It will be called
	 * only when the form is considered valid.
	 */
	onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Properties to be applied to the form element
 */
interface FormProps {
	ref: RefObject<HTMLFormElement>;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	noValidate: boolean;
}

/**
 * Returns properties required to hook into form events.
 * Applied custom validation and define when error should be reported.
 *
 * @see https://github.com/edmundhung/conform/tree/v0.3.1/packages/conform-react/README.md#useform
 */
export function useForm(config: FormConfig = {}): FormProps {
	const { validate } = config;

	const ref = useRef<HTMLFormElement>(null);
	const [noValidate, setNoValidate] = useState(
		config.noValidate || !config.fallbackNative,
	);

	useEffect(() => {
		setNoValidate(true);
	}, []);

	useEffect(() => {
		// Initialize form validation messages
		if (ref.current) {
			validate?.(ref.current);
		}

		// Revalidate the form when input value is changed
		const handleInput = (event: Event) => {
			const field = event.target;
			const form = ref.current;

			if (!form || !isFieldElement(field) || field.form !== form) {
				return;
			}

			validate?.(form);

			if (!config.noValidate) {
				if (config.initialReport === 'onChange') {
					field.dataset.conformTouched = 'true';
				}

				// Field validity might be changed due to cross reference
				for (const field of form.elements) {
					if (isFieldElement(field) && field.dataset.conformTouched) {
						// Report latest error for all touched fields
						field.checkValidity();
					}
				}
			}
		};
		const handleBlur = (event: FocusEvent) => {
			const field = event.target;
			const form = ref.current;

			if (
				!form ||
				!isFieldElement(field) ||
				field.form !== form ||
				config.noValidate ||
				config.initialReport !== 'onBlur'
			) {
				return;
			}

			field.dataset.conformTouched = 'true';
			field.reportValidity();
		};
		const handleReset = (event: Event) => {
			const form = ref.current;

			if (!form || event.target !== form) {
				return;
			}

			// Reset all field state
			for (const field of form.elements) {
				if (isFieldElement(field)) {
					delete field.dataset.conformTouched;
				}
			}

			/**
			 * The reset event is triggered before form reset happens.
			 * This make sure the form to be revalidated with initial values.
			 */
			setTimeout(() => {
				validate?.(form);
			}, 0);
		};

		/**
		 * The input event handler will be triggered in capturing phase in order to
		 * allow follow-up action in the bubble phase based on the latest validity

		 * E.g. `useFieldset` reset the error of valid field after checking the
		 * validity in the bubble phase.
		 */
		document.addEventListener('input', handleInput, true);
		document.addEventListener('blur', handleBlur, true);
		document.addEventListener('reset', handleReset);

		return () => {
			document.removeEventListener('input', handleInput, true);
			document.removeEventListener('blur', handleBlur, true);
			document.removeEventListener('reset', handleReset);
		};
	}, [validate, config.initialReport, config.noValidate]);

	return {
		ref,
		noValidate,
		onSubmit(event) {
			const form = event.currentTarget;
			const nativeEvent = event.nativeEvent as SubmitEvent;
			const submitter =
				nativeEvent.submitter instanceof HTMLButtonElement ||
				nativeEvent.submitter instanceof HTMLInputElement
					? nativeEvent.submitter
					: null;

			// Validating the form with the submitter value
			validate?.(form, submitter);

			/**
			 * It checks defaultPrevented to confirm if the submission is intentional
			 * This is utilized by `useFieldList` to modify the list state when the submit
			 * event is captured and revalidate the form with new fields without triggering
			 * a form submission at the same time.
			 */
			if (
				!config.noValidate &&
				!submitter?.formNoValidate &&
				!event.defaultPrevented
			) {
				let focused = false;

				for (const field of form.elements) {
					if (isFieldElement(field)) {
						// Mark the field as touched
						field.dataset.conformTouched = 'true';

						// Focus on the first invalid field
						if (
							!focused &&
							!field.validity.valid &&
							field.tagName !== 'BUTTON'
						) {
							field.focus();
							focused = true;
						}
					}
				}

				// Check the validity of the form
				if (!event.currentTarget.reportValidity()) {
					event.preventDefault();
				}
			}

			if (!event.defaultPrevented) {
				config.onSubmit?.(event);
			}
		},
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
 * @see https://github.com/edmundhung/conform/tree/v0.3.1/packages/conform-react/README.md#usefieldset
 */
export function useFieldset<Schema extends Record<string, any>>(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config?: FieldsetConfig<Schema>,
): Fieldset<Schema>;
export function useFieldset<Schema extends Record<string, any>>(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config?: FieldConfig<Schema>,
): Fieldset<Schema>;
export function useFieldset<Schema extends Record<string, any>>(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config?: FieldsetConfig<Schema> | FieldConfig<Schema>,
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
		/**
		 * Reset the error state of each field if its validity is changed.
		 *
		 * This is a workaround as no official way is provided to notify
		 * when the validity of the field is changed from `invalid` to `valid`.
		 */
		const resetError = (form: HTMLFormElement) => {
			setError((prev) => {
				let next = prev;

				for (const field of form.elements) {
					if (isFieldElement(field)) {
						const key = getKey(field.name, configRef.current?.name);

						if (key) {
							const prevMessage = next?.[key] ?? '';
							const nextMessage = field.validationMessage;

							/**
							 * Techincally, checking prevMessage not being empty while nextMessage being empty
							 * is sufficient for our usecase. It checks if the message is changed instead to allow
							 * the hook to be useful independently.
							 */
							if (prevMessage !== '' && prevMessage !== nextMessage) {
								next = {
									...next,
									[key]: nextMessage,
								};
							}
						}
					}
				}

				return next;
			});
		};
		const handleInput = (event: Event) => {
			const form = getFormElement(ref.current);
			const field = event.target;

			if (!form || !isFieldElement(field) || field.form !== form) {
				return;
			}

			resetError(form);
		};
		const invalidHandler = (event: Event) => {
			const form = getFormElement(ref.current);
			const field = event.target;

			if (!form || !isFieldElement(field) || field.form !== form) {
				return;
			}

			const key = getKey(field.name, configRef.current?.name);

			// Update the error only if the field belongs to the fieldset
			if (key) {
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

				event.preventDefault();
			}
		};
		const submitHandler = (event: SubmitEvent) => {
			const form = getFormElement(ref.current);

			if (!form || event.target !== form) {
				return;
			}

			// This helps resetting error that fullfilled by the submitter
			resetError(form);
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

		document.addEventListener('input', handleInput);
		// The invalid event does not bubble and so listening on the capturing pharse is needed
		document.addEventListener('invalid', invalidHandler, true);
		document.addEventListener('submit', submitHandler);
		document.addEventListener('reset', resetHandler);

		return () => {
			document.removeEventListener('input', handleInput);
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

interface ControlButtonProps {
	name?: string;
	value?: string;
	form?: string;
	formNoValidate: true;
}

type CommandPayload<
	Schema,
	Type extends ListCommand<FieldValue<Schema>>['type'],
> = Extract<ListCommand<FieldValue<Schema>>, { type: Type }>['payload'];

/**
 * A group of helpers for configuring a list control button
 */
interface ListControl<Schema> {
	prepend(payload?: CommandPayload<Schema, 'prepend'>): ControlButtonProps;
	append(payload?: CommandPayload<Schema, 'append'>): ControlButtonProps;
	replace(payload: CommandPayload<Schema, 'replace'>): ControlButtonProps;
	remove(payload: CommandPayload<Schema, 'remove'>): ControlButtonProps;
	reorder(payload: CommandPayload<Schema, 'reorder'>): ControlButtonProps;
}

/**
 * Returns a list of key and config, with a group of helpers
 * configuring buttons for list manipulation
 *
 * @see https://github.com/edmundhung/conform/tree/v0.3.1/packages/conform-react/README.md#usefieldlist
 */
export function useFieldList<Payload = any>(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config: FieldConfig<Array<Payload>>,
): [
	Array<{
		key: string;
		config: FieldConfig<Payload>;
	}>,
	ListControl<Payload>,
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
	const control = new Proxy(
		{},
		{
			get(_target, type: any) {
				return (payload: any = {}) => {
					return {
						name: listCommandKey,
						value: serializeListCommand(config.name, { type, payload }),
						form: config.form,
						formNoValidate: true,
					};
				};
			},
		},
	) as ListControl<Payload>;

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
				event.submitter.name !== listCommandKey
			) {
				return;
			}

			const [name, command] = parseListCommand(event.submitter.value);

			if (name !== configRef.current.name) {
				// Ensure the scope of the listener are limited to specific field name
				return;
			}

			switch (command.type) {
				case 'append':
				case 'prepend':
				case 'replace':
					command.payload.defaultValue = [
						`${Date.now()}`,
						command.payload.defaultValue,
					];
					break;
			}

			setEntries((entries) =>
				updateList(
					[...(entries ?? [])],
					command as ListCommand<[string, FieldValue<Payload> | undefined]>,
				),
			);
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

	return [list, control];
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
 * @see https://github.com/edmundhung/conform/tree/v0.3.1/packages/conform-react/README.md#usecontrolledinput
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
