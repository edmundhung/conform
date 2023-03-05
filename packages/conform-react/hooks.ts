import {
	type FieldConfig,
	type FieldElement,
	type FieldValue,
	type FieldsetConstraint,
	type FormMethod,
	type FormEncType,
	type ListCommand,
	type Submission,
	getFormData,
	getFormElement,
	getName,
	getPaths,
	isFieldElement,
	parse,
	parseListCommand,
	updateList,
	reportSubmission,
	validate,
	requestIntent,
	getValidationMessage,
	getErrors,
	getFormAttributes,
	shouldValidate,
	VALIDATION_UNDEFINED,
} from '@conform-to/dom';
import {
	type FormEvent,
	type RefObject,
	useRef,
	useState,
	useEffect,
	useLayoutEffect,
	useMemo,
} from 'react';

export interface FormConfig<
	Schema extends Record<string, any>,
	ClientSubmission extends Submission | Submission<Schema> = Submission,
> {
	/**
	 * If the form id is provided, Id for label,
	 * input and error elements will be derived.
	 */
	id?: string;

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
	state?: Submission;

	/**
	 * An object describing the constraint of each field
	 */
	constraint?: FieldsetConstraint<Schema>;

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
	}) => ClientSubmission;

	/**
	 * The submit event handler of the form. It will be called
	 * only when the form is considered valid.
	 */
	onSubmit?: (
		event: FormEvent<HTMLFormElement>,
		context: {
			formData: FormData;
			submission: ClientSubmission;
			action: string;
			encType: FormEncType;
			method: FormMethod;
		},
	) => void;
}

/**
 * Properties to be applied to the form element
 */
interface FormProps {
	ref: RefObject<HTMLFormElement>;
	id?: string;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	noValidate: boolean;
}

interface Form<Schema extends Record<string, any>> {
	id?: string;
	ref: RefObject<HTMLFormElement>;
	error: string;
	props: FormProps;
	config: FieldsetConfig<Schema>;
}

/**
 * Returns properties required to hook into form events.
 * Applied custom validation and define when error should be reported.
 *
 * @see https://conform.guide/api/react#useform
 */
export function useForm<
	Schema extends Record<string, any>,
	ClientSubmission extends Submission | Submission<Schema> = Submission,
>(
	config: FormConfig<Schema, ClientSubmission> = {},
): [Form<Schema>, Fieldset<Schema>] {
	const configRef = useRef(config);
	const ref = useRef<HTMLFormElement>(null);
	const [lastSubmission, setLastSubmission] = useState(config.state ?? null);
	const [error, setError] = useState<string>(() => {
		if (!config.state) {
			return '';
		}

		const message = config.state.error[''];

		return getValidationMessage(message);
	});
	const [uncontrolledState, setUncontrolledState] = useState<
		FieldsetConfig<Schema>
	>(() => {
		const submission = config.state;

		if (!submission) {
			return {
				defaultValue: config.defaultValue,
			};
		}

		return {
			defaultValue: submission.payload as FieldValue<Schema> | undefined,
			initialError: Object.entries(submission.error).reduce<
				Record<string, string | string[]>
			>((result, [name, message]) => {
				if (name !== '' && shouldValidate(submission.intent, name)) {
					result[name] = message;
				}

				return result;
			}, {}),
		};
	});
	const fieldsetConfig = {
		...uncontrolledState,
		constraint: config.constraint,
		form: config.id,
	};
	const fieldset = useFieldset(ref, fieldsetConfig);
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
		const submission = config.state;

		if (!form || !submission) {
			return;
		}

		const listCommand = parseListCommand(submission.intent);

		if (listCommand) {
			form.dispatchEvent(
				new CustomEvent('conform/list', {
					detail: submission.intent,
				}),
			);
		}

		setLastSubmission(submission);
	}, [config.state]);

	useEffect(() => {
		const form = ref.current;

		if (!form || !lastSubmission) {
			return;
		}

		reportSubmission(ref.current, lastSubmission);
	}, [lastSubmission]);

	useEffect(() => {
		// Revalidate the form when input value is changed
		const handleInput = (event: Event) => {
			const field = event.target;
			const form = ref.current;
			const formConfig = configRef.current;

			if (!form || !isFieldElement(field) || field.form !== form) {
				return;
			}

			if (
				field.dataset.conformTouched ||
				formConfig.initialReport === 'onChange'
			) {
				requestIntent(form, validate(field.name));
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
				requestIntent(form, validate(field.name));
			}
		};
		const handleInvalid = (event: Event) => {
			const form = getFormElement(ref.current);
			const field = event.target;

			if (
				!form ||
				!isFieldElement(field) ||
				field.form !== form ||
				field.name !== '__form__'
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
					field.setAttribute('aria-invalid', 'false');
					field.setCustomValidity('');
				}
			}

			setError('');
			setUncontrolledState({
				defaultValue: formConfig.defaultValue,
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

	const form: Form<Schema> = {
		id: config.id,
		ref,
		error,
		props: {
			ref,
			id: config.id,
			noValidate,
			onSubmit(event) {
				const form = event.currentTarget;
				const nativeEvent = event.nativeEvent as SubmitEvent;
				const submitter = nativeEvent.submitter as
					| HTMLButtonElement
					| HTMLInputElement
					| null;

				if (event.defaultPrevented) {
					return;
				}

				try {
					const formData = getFormData(form, submitter);
					const getSubmission =
						config.onValidate ??
						((context) => parse(context.formData) as ClientSubmission);
					const submission = getSubmission({ form, formData });

					if (
						(!config.noValidate &&
							!submitter?.formNoValidate &&
							Object.entries(submission.error).some(
								([, message]) =>
									message !== '' &&
									!([] as string[])
										.concat(message)
										.includes(VALIDATION_UNDEFINED),
							)) ||
						(typeof config.onValidate !== 'undefined' &&
							(submission.intent.startsWith('validate') ||
								submission.intent.startsWith('list')) &&
							Object.entries(submission.error).every(
								([, message]) =>
									!([] as string[])
										.concat(message)
										.includes(VALIDATION_UNDEFINED),
							))
					) {
						const listCommand = parseListCommand(submission.intent);

						if (listCommand) {
							form.dispatchEvent(
								new CustomEvent('conform/list', {
									detail: submission.intent,
								}),
							);
						}

						setLastSubmission(submission);
						event.preventDefault();
					} else {
						config.onSubmit?.(event, {
							formData,
							submission,
							...getFormAttributes(form, submitter),
						});
					}
				} catch (e) {
					console.warn(e);
				}
			},
		},
		config: fieldsetConfig,
	};

	return [form, fieldset];
}

/**
 * All the information of the field, including state and config.
 */
export type Field<Schema> = {
	config: FieldConfig<Schema>;
	error?: string;
	errors?: string[];
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
	initialError?: Record<string, string | string[]>;

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
 * @see https://conform.guide/api/react#usefieldset
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
		initialError: Record<string, Record<string, string | string[]> | undefined>;
	}>(
		// @ts-expect-error
		() => {
			const initialError: Record<
				string,
				Record<string, string | string[]> | undefined
			> = {};

			for (const [name, message] of Object.entries(
				config?.initialError ?? {},
			)) {
				const [key, ...paths] = getPaths(name);

				if (typeof key === 'string') {
					const scopedName = getName(paths);

					initialError[key] = {
						...initialError[key],
						[scopedName]: message,
					};
				}
			}

			return {
				defaultValue: config?.defaultValue ?? {},
				initialError,
			};
		},
	);
	const [error, setError] = useState<Record<string, string[] | undefined>>(
		() => {
			const result: Record<string, string[]> = {};

			for (const [key, error] of Object.entries(
				uncontrolledState.initialError,
			)) {
				result[key] = getErrors(getValidationMessage(error?.['']));
			}

			return result;
		},
	);

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
					// Update the aria attribute only if it is set
					if (field.getAttribute('aria-invalid')) {
						field.setAttribute(
							'aria-invalid',
							field.validationMessage !== '' ? 'true' : 'false',
						);
					}

					setError((prev) => {
						const prevMessage = getValidationMessage(prev?.[key]);

						if (prevMessage === field.validationMessage) {
							return prev;
						}

						return {
							...prev,
							[key]: getErrors(field.validationMessage),
						};
					});
				}

				event.preventDefault();
			}
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
		document.addEventListener('reset', resetHandler);

		return () => {
			document.removeEventListener('invalid', invalidHandler, true);
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
				const errors = error?.[key];
				const field: Field<any> = {
					config: {
						name: fieldsetConfig.name ? `${fieldsetConfig.name}.${key}` : key,
						defaultValue: uncontrolledState.defaultValue[key],
						initialError: uncontrolledState.initialError[key],
						...constraint,
					},
					error: errors?.[0],
					errors,
				};

				if (fieldsetConfig.form) {
					field.config.form = fieldsetConfig.form;
					field.config.id = `${fieldsetConfig.form}-${field.config.name}`;
					field.config.errorId = `${field.config.id}-error`;
				}

				return field;
			},
		},
	) as Fieldset<Schema>;
}

/**
 * Returns a list of key and config, with a group of helpers
 * configuring buttons for list manipulation
 *
 * @see https://conform.guide/api/react#usefieldlist
 */
export function useFieldList<Payload = any>(
	ref: RefObject<HTMLFormElement | HTMLFieldSetElement>,
	config: FieldConfig<Array<Payload>>,
): Array<{
	key: string;
	error: string | undefined;
	config: FieldConfig<Payload>;
}> {
	const configRef = useRef(config);
	const [uncontrolledState, setUncontrolledState] = useState<{
		defaultValue: FieldValue<Array<Payload>>;
		initialError: Array<Record<string, string | string[]> | undefined>;
	}>(() => {
		const initialError: Array<Record<string, string | string[]> | undefined> =
			[];

		for (const [name, message] of Object.entries(config?.initialError ?? {})) {
			const [index, ...paths] = getPaths(name);

			if (typeof index === 'number') {
				const scopedName = getName(paths);

				initialError[index] = {
					...initialError[index],
					[scopedName]: message,
				};
			}
		}

		return {
			defaultValue: config.defaultValue ?? [],
			initialError,
		};
	});
	const [error, setError] = useState<Array<string[] | undefined>>(() =>
		uncontrolledState.initialError.map((error) =>
			getErrors(getValidationMessage(error?.[''])),
		),
	);
	const [entries, setEntries] = useState<
		Array<[string, FieldValue<Payload> | undefined]>
	>(() => Object.entries(config.defaultValue ?? [undefined]));

	useEffect(() => {
		configRef.current = config;
	});

	useEffect(() => {
		const invalidHandler = (event: Event) => {
			const form = getFormElement(ref.current);
			const field = event.target;
			const prefix = configRef.current.name ?? '';

			if (
				!form ||
				!isFieldElement(field) ||
				field.form !== form ||
				!field.name.startsWith(prefix)
			) {
				return;
			}

			const [index, ...paths] = getPaths(
				prefix.length > 0 ? field.name.slice(prefix.length) : field.name,
			);

			// Update the error only if the field belongs to the fieldset
			if (typeof index === 'number' && paths.length === 0) {
				if (field.dataset.conformTouched) {
					setError((prev) => {
						const prevMessage = getValidationMessage(prev?.[index]);

						if (prevMessage === field.validationMessage) {
							return prev;
						}

						return [
							...prev.slice(0, index),
							getErrors(field.validationMessage),
							...prev.slice(index + 1),
						];
					});
				}

				event.preventDefault();
			}
		};
		const listHandler = (event: CustomEvent) => {
			const form = getFormElement(ref.current);

			if (!form || event.target !== form) {
				return;
			}

			const command = parseListCommand<ListCommand<FieldValue<Payload>>>(
				event.detail,
			);

			if (command?.scope !== configRef.current.name) {
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
								defaultValue: [
									`${Date.now()}`,
									// @ts-expect-error unknown type as it is sent through network
									command.payload.defaultValue,
								],
							},
						});
					default: {
						return updateList([...(entries ?? [])], command);
					}
				}
			});
			setError((error) => {
				switch (command.type) {
					case 'append':
					case 'prepend':
					case 'replace':
						return updateList([...error], {
							...command,
							payload: {
								...command.payload,
								defaultValue: undefined,
							},
						} as ListCommand<string[] | undefined>);
					default: {
						return updateList([...error], command);
					}
				}
			});
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
			setError([]);
		};

		// @ts-expect-error Custom event: conform/list
		document.addEventListener('conform/list', listHandler, true);
		document.addEventListener('invalid', invalidHandler, true);
		document.addEventListener('reset', resetHandler);

		return () => {
			// @ts-expect-error Custom event: conform/list
			document.removeEventListener('conform/list', listHandler, true);
			document.removeEventListener('invalid', invalidHandler, true);
			document.removeEventListener('reset', resetHandler);
		};
	}, [ref]);

	return entries.map(([key, defaultValue], index) => {
		const errors = error[index];
		const fieldConfig: FieldConfig<any> = {
			name: `${config.name}[${index}]`,
			defaultValue: defaultValue ?? uncontrolledState.defaultValue[index],
			initialError: uncontrolledState.initialError[index],
		};

		if (config.form) {
			fieldConfig.form = config.form;
			fieldConfig.id = `${config.form}-${config.name}`;
			fieldConfig.errorId = `${fieldConfig.id}-error`;
		}

		return {
			key,
			error: errors?.[0],
			errors,
			config: fieldConfig,
		};
	});
}

/**
 * Triggering react custom change event
 * Solution based on dom-testing-library
 * @see https://github.com/facebook/react/issues/10135#issuecomment-401496776
 * @see https://github.com/testing-library/dom-testing-library/blob/main/src/events.js#L104-L123
 */
function setNativeValue(element: FieldElement, value: string) {
	if (element.value === value) {
		// It will not trigger a change event if `element.value` is the same as the set value
		return;
	}

	const { set: valueSetter } =
		Object.getOwnPropertyDescriptor(element, 'value') || {};
	const prototype = Object.getPrototypeOf(element);
	const { set: prototypeValueSetter } =
		Object.getOwnPropertyDescriptor(prototype, 'value') || {};

	if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
		prototypeValueSetter.call(element, value);
	} else {
		if (valueSetter) {
			valueSetter.call(element, value);
		} else {
			throw new Error('The given element does not have a value setter');
		}
	}
}

/**
 * useLayoutEffect is client-only.
 * This basically makes it a no-op on server
 */
const useSafeLayoutEffect =
	typeof document === 'undefined' ? useEffect : useLayoutEffect;

interface InputControl {
	change: (eventOrValue: { target: { value: string } } | string) => void;
	focus: () => void;
	blur: () => void;
}

/**
 * Returns a ref object and a set of helpers that dispatch corresponding dom event.
 *
 * @see https://conform.guide/api/react#useinputevent
 */
export function useInputEvent<
	RefShape extends FieldElement = HTMLInputElement,
>(options?: {
	onSubmit?: (event: SubmitEvent) => void;
	onReset?: (event: Event) => void;
}): [RefObject<RefShape>, InputControl];
export function useInputEvent<
	RefShape extends Exclude<any, FieldElement>,
>(options: {
	getElement: (ref: RefShape | null) => FieldElement | null | undefined;
	onSubmit?: (event: SubmitEvent) => void;
	onReset?: (event: Event) => void;
}): [RefObject<RefShape>, InputControl];
export function useInputEvent<RefShape>(options?: {
	getElement?: (ref: RefShape | null) => FieldElement | null | undefined;
	onSubmit?: (event: SubmitEvent) => void;
	onReset?: (event: Event) => void;
}): [RefObject<RefShape>, InputControl] {
	const ref = useRef<RefShape>(null);
	const optionsRef = useRef(options);
	const changeDispatched = useRef(false);
	const focusDispatched = useRef(false);
	const blurDispatched = useRef(false);

	useSafeLayoutEffect(() => {
		optionsRef.current = options;
	});

	useSafeLayoutEffect(() => {
		const getInputElement = () =>
			(optionsRef.current?.getElement?.(ref.current) ?? ref.current) as
				| FieldElement
				| undefined;
		const inputHandler = (event: Event) => {
			const input = getInputElement();

			if (input && event.target === input) {
				changeDispatched.current = true;
			}
		};
		const focusHandler = (event: FocusEvent) => {
			const input = getInputElement();

			if (input && event.target === input) {
				focusDispatched.current = true;
			}
		};
		const blurHandler = (event: FocusEvent) => {
			const input = getInputElement();

			if (input && event.target === input) {
				blurDispatched.current = true;
			}
		};
		const submitHandler = (event: SubmitEvent) => {
			const input = getInputElement();

			if (input?.form && event.target === input.form) {
				optionsRef.current?.onSubmit?.(event);
			}
		};
		const resetHandler = (event: Event) => {
			const input = getInputElement();

			if (input?.form && event.target === input.form) {
				optionsRef.current?.onReset?.(event);
			}
		};

		document.addEventListener('input', inputHandler, true);
		document.addEventListener('focus', focusHandler, true);
		document.addEventListener('blur', blurHandler, true);
		document.addEventListener('submit', submitHandler);
		document.addEventListener('reset', resetHandler);

		return () => {
			document.removeEventListener('input', inputHandler, true);
			document.removeEventListener('focus', focusHandler, true);
			document.removeEventListener('blur', blurHandler, true);
			document.removeEventListener('submit', submitHandler);
			document.removeEventListener('reset', resetHandler);
		};
	}, []);

	const control = useMemo(() => {
		const getInputElement = () =>
			(optionsRef.current?.getElement?.(ref.current) ??
				ref.current) as FieldElement;

		return {
			change(eventOrValue: { target: { value: string } } | string) {
				const input = getInputElement();

				if (!input) {
					console.warn(
						'Missing input ref; No change-related events will be dispatched',
					);
					return;
				}

				if (changeDispatched.current) {
					changeDispatched.current = false;
					return;
				}

				const previousValue = input.value;
				const nextValue =
					typeof eventOrValue === 'string'
						? eventOrValue
						: eventOrValue.target.value;

				// This make sure no event is dispatched on the first effect run
				if (nextValue === previousValue) {
					return;
				}

				// Dispatch beforeinput event before updating the input value
				input.dispatchEvent(new Event('beforeinput', { bubbles: true }));
				// Update the input value to trigger a change event
				setNativeValue(input, nextValue);
				// Dispatch input event with the updated input value
				input.dispatchEvent(new InputEvent('input', { bubbles: true }));
				// Reset the dispatched flag
				changeDispatched.current = false;
			},
			focus() {
				const input = getInputElement();

				if (!input) {
					console.warn(
						'Missing input ref; No focus-related events will be dispatched',
					);
					return;
				}

				if (focusDispatched.current) {
					focusDispatched.current = false;
					return;
				}

				const focusinEvent = new FocusEvent('focusin', {
					bubbles: true,
				});
				const focusEvent = new FocusEvent('focus');

				input.dispatchEvent(focusinEvent);
				input.dispatchEvent(focusEvent);

				// Reset the dispatched flag
				focusDispatched.current = false;
			},
			blur() {
				const input = getInputElement();

				if (!input) {
					console.warn(
						'Missing input ref; No blur-related events will be dispatched',
					);
					return;
				}

				if (blurDispatched.current) {
					blurDispatched.current = false;
					return;
				}

				const focusoutEvent = new FocusEvent('focusout', {
					bubbles: true,
				});
				const blurEvent = new FocusEvent('blur');

				input.dispatchEvent(focusoutEvent);
				input.dispatchEvent(blurEvent);

				// Reset the dispatched flag
				blurDispatched.current = false;
			},
		};
	}, []);

	return [ref, control];
}
