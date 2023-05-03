import {
	type FieldConstraint,
	type FieldElement,
	type FieldsetConstraint,
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
	validate,
	requestIntent,
	getValidationMessage,
	getErrors,
	getScope,
	getFormAction,
	getFormEncType,
	getFormMethod,
	getFormControls,
	focusFirstInvalidControl,
	isSubmitting,
	isFocusedOnIntentButton,
	focusFormControl,
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

export type Primitive = null | undefined | string | number | boolean | Date;

export interface FieldConfig<Schema = unknown> extends FieldConstraint<Schema> {
	id?: string;
	name: string;
	defaultValue?: FieldValue<Schema>;
	initialError?: Record<string, string | string[]>;
	form?: string;
	descriptionId?: string;
	errorId?: string;

	/**
	 * The frist error of the field
	 */
	error?: string;

	/**
	 * All of the field errors
	 */
	errors?: string[];
}

export type FieldValue<Schema> = Schema extends Primitive
	? string
	: Schema extends File
	? File
	: Schema extends Array<infer InnerType>
	? Array<FieldValue<InnerType>>
	: Schema extends Record<string, any>
	? { [Key in keyof Schema]?: FieldValue<Schema[Key]> }
	: any;

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
	 * A form ref object. Conform will fallback to its own ref object if it is not provided.
	 */
	ref?: RefObject<HTMLFormElement>;

	/**
	 * @deprecated Use `shouldValidate` and `shouldRevalidate` instead.
	 */
	initialReport?: 'onSubmit' | 'onChange' | 'onBlur';

	/**
	 * Define when conform should start validation.
	 * Support "onSubmit", "onChange", "onBlur".
	 *
	 * Default to `onSubmit`.
	 */
	shouldValidate?: 'onSubmit' | 'onBlur' | 'onInput';

	/**
	 * Define when conform should revalidate again.
	 * Support "onSubmit", "onChange", "onBlur".
	 *
	 * Default to `onInput`.
	 */
	shouldRevalidate?: 'onSubmit' | 'onBlur' | 'onInput';

	/**
	 * An object representing the initial value of the form.
	 */
	defaultValue?: FieldValue<Schema>;

	/**
	 * An object describing the result of the last submission
	 */
	lastSubmission?: Submission;

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
			encType: ReturnType<typeof getFormEncType>;
			method: ReturnType<typeof getFormMethod>;
		},
	) => void;
}

/**
 * Properties to be applied to the form element
 */
interface FormProps {
	id?: string;
	ref: RefObject<HTMLFormElement>;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	noValidate: boolean;
	'aria-invalid'?: 'true';
	'aria-describedby'?: string;
}

interface Form {
	id?: string;
	errorId?: string;
	error: string;
	errors: string[];
	ref: RefObject<HTMLFormElement>;
	props: FormProps;
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
>(config: FormConfig<Schema, ClientSubmission> = {}): [Form, Fieldset<Schema>] {
	const configRef = useRef(config);
	const formRef = useRef<HTMLFormElement>(null);
	const [lastSubmission, setLastSubmission] = useState(
		config.lastSubmission ?? null,
	);
	const [errors, setErrors] = useState<string[]>(() => {
		if (!config.lastSubmission) {
			return [];
		}

		return ([] as string[]).concat(config.lastSubmission.error['']);
	});
	const initialError = useMemo(() => {
		const submission = config.lastSubmission;

		if (!submission) {
			return {};
		}

		const scope = getScope(submission.intent);

		return Object.entries(submission.error).reduce<
			Record<string, string | string[]>
		>((result, [name, message]) => {
			if (name !== '' && (scope === null || scope === name)) {
				result[name] = message;
			}

			return result;
		}, {});
	}, [config.lastSubmission]);
	const ref = config.ref ?? formRef;
	const fieldset = useFieldset(ref, {
		defaultValue:
			(config.lastSubmission?.payload as FieldValue<Schema>) ??
			config.defaultValue,
		initialError,
		constraint: config.constraint,
		form: config.id,
	});
	const [noValidate, setNoValidate] = useState(
		config.noValidate || !config.fallbackNative,
	);

	useSafeLayoutEffect(() => {
		configRef.current = config;
	});

	useEffect(() => {
		setNoValidate(true);
	}, []);

	useEffect(() => {
		const form = ref.current;
		const submission = config.lastSubmission;

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
	}, [ref, config.lastSubmission]);

	useEffect(() => {
		const form = ref.current;

		if (!form || !lastSubmission) {
			return;
		}

		reportSubmission(form, lastSubmission);
	}, [ref, lastSubmission]);

	useEffect(() => {
		// Revalidate the form when input value is changed
		const handleInput = (event: Event) => {
			const field = event.target;
			const form = ref.current;
			const formConfig = configRef.current;
			const {
				initialReport = 'onSubmit',
				shouldValidate = initialReport === 'onChange'
					? 'onInput'
					: initialReport,
				shouldRevalidate = 'onInput',
			} = formConfig;

			if (!form || !isFieldElement(field) || field.form !== form) {
				return;
			}

			if (
				field.dataset.conformTouched
					? shouldRevalidate === 'onInput'
					: shouldValidate === 'onInput'
			) {
				requestIntent(form, validate(field.name));
			}
		};
		const handleBlur = (event: FocusEvent) => {
			const field = event.target;
			const form = ref.current;
			const formConfig = configRef.current;
			const {
				initialReport = 'onSubmit',
				shouldValidate = initialReport === 'onChange'
					? 'onInput'
					: initialReport,
				shouldRevalidate = 'onInput',
			} = formConfig;

			if (!form || !isFieldElement(field) || field.form !== form) {
				return;
			}

			if (
				field.dataset.conformTouched
					? shouldRevalidate === 'onBlur'
					: shouldValidate === 'onBlur'
			) {
				requestIntent(form, validate(field.name));
			}
		};
		const handleInvalid = (event: Event) => {
			const form = ref.current;
			const field = event.target;

			if (
				!form ||
				!isFieldElement(field) ||
				field.form !== form ||
				field.name !== FORM_ERROR_ELEMENT_NAME
			) {
				return;
			}

			event.preventDefault();

			if (field.dataset.conformTouched) {
				setErrors(getErrors(field.validationMessage));
			}
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
					field.setCustomValidity('');
				}
			}

			setErrors([]);
		};

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
	}, [ref]);

	const form: Form = {
		ref,
		error: errors[0],
		errors,
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
							action: getFormAction(nativeEvent),
							encType: getFormEncType(nativeEvent),
							method: getFormMethod(nativeEvent),
						});
					}
				} catch (e) {
					console.warn(e);
				}
			},
		},
	};

	if (config.id) {
		form.id = config.id;
		form.errorId = `${config.id}-error`;
		form.props.id = form.id;
	}

	if (form.errorId && form.errors.length > 0) {
		form.props['aria-invalid'] = 'true';
		form.props['aria-describedby'] = form.errorId;
	}

	return [form, fieldset];
}

/**
 * A set of field configuration
 */
export type Fieldset<Schema extends Record<string, any>> = {
	[Key in keyof Schema]-?: FieldConfig<Schema[Key]>;
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
	 * The id of the form, connecting each field to a form remotely
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
	const [error, setError] = useState<Record<string, string[] | undefined>>(
		() => {
			const initialError = config?.initialError;

			if (!initialError) {
				return {};
			}

			const result: Record<string, string[]> = {};

			for (const [name, message] of Object.entries(initialError)) {
				const [key, ...paths] = getPaths(name);

				if (typeof key === 'string' && paths.length === 0) {
					result[key] = ([] as string[]).concat(message ?? []);
				}
			}

			return result;
		},
	);

	useSafeLayoutEffect(() => {
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

				const fieldsetConfig = config as FieldsetConfig<Schema>;
				const constraint = fieldsetConfig.constraint?.[key];
				const errors = error?.[key];
				const initialError = Object.entries(
					fieldsetConfig.initialError ?? {},
				).reduce((result, [name, message]) => {
					const [field, ...paths] = getPaths(name);

					if (field === key) {
						result[getName(paths)] = message;
					}

					return result;
				}, {} as Record<string, string | string[]>);
				const field: FieldConfig<any> = {
					...constraint,
					name: fieldsetConfig.name ? `${fieldsetConfig.name}.${key}` : key,
					defaultValue: fieldsetConfig.defaultValue?.[key],
					initialError,
					error: errors?.[0],
					errors,
				};

				if (fieldsetConfig.form) {
					field.form = fieldsetConfig.form;
					field.id = `${fieldsetConfig.form}-${field.name}`;
					field.errorId = `${field.id}-error`;
					field.descriptionId = `${field.id}-description`;
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
): Array<{ key: string } & FieldConfig<Payload>> {
	const configRef = useRef(config);
	const [error, setError] = useState(() => {
		const initialError: Array<string[] | undefined> = [];

		for (const [name, message] of Object.entries(config?.initialError ?? {})) {
			const [index, ...paths] = getPaths(name);

			if (typeof index === 'number' && paths.length === 0) {
				initialError[index] = ([] as string[]).concat(message ?? []);
			}
		}

		return initialError;
	});
	const [entries, setEntries] = useState<
		Array<[string, FieldValue<Payload> | undefined]>
	>(() => Object.entries(config.defaultValue ?? [undefined]));

	useSafeLayoutEffect(() => {
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

			setEntries(Object.entries(configRef.current.defaultValue ?? [undefined]));
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
		const initialError = Object.entries(config.initialError ?? {}).reduce(
			(result, [name, message]) => {
				const [field, ...paths] = getPaths(name);

				if (field === index) {
					result[getName(paths)] = message;
				}

				return result;
			},
			{} as Record<string, string | string[]>,
		);
		const fieldConfig: FieldConfig<Payload> = {
			name: `${config.name}[${index}]`,
			defaultValue: defaultValue ?? config.defaultValue?.[index],
			initialError,
			error: errors?.[0],
			errors,
		};

		if (config.form) {
			fieldConfig.form = config.form;
			fieldConfig.id = `${config.form}-${config.name}`;
			fieldConfig.errorId = `${fieldConfig.id}-error`;
			fieldConfig.descriptionId = `${fieldConfig.id}-description`;
		}

		return {
			key,
			...fieldConfig,
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

export const VALIDATION_UNDEFINED = '__undefined__';
export const VALIDATION_SKIPPED = '__skipped__';
export const FORM_ERROR_ELEMENT_NAME = '__form__';

/**
 * Validate the form with the Constraint Validation API
 * @see https://conform.guide/api/react#validateconstraint
 */
export function validateConstraint(options: {
	form: HTMLFormElement;
	formData?: FormData;
	constraint?: Record<
		Lowercase<string>,
		(
			value: string,
			context: { formData: FormData; attributeValue: string },
		) => boolean
	>;
	acceptMultipleErrors?: ({
		name,
		intent,
		payload,
	}: {
		name: string;
		intent: string;
		payload: Record<string, any>;
	}) => boolean;
	formatMessages?: ({
		name,
		validity,
		constraint,
		defaultErrors,
	}: {
		name: string;
		validity: ValidityState;
		constraint: Record<string, boolean>;
		defaultErrors: string[];
	}) => string[];
}): Submission {
	const formData = options?.formData ?? new FormData(options.form);
	const getDefaultErrors = (
		validity: ValidityState,
		result: Record<string, boolean>,
	) => {
		const errors: Array<string> = [];

		if (validity.valueMissing) errors.push('required');
		if (validity.typeMismatch || validity.badInput) errors.push('type');
		if (validity.tooShort) errors.push('minLength');
		if (validity.rangeUnderflow) errors.push('min');
		if (validity.stepMismatch) errors.push('step');
		if (validity.tooLong) errors.push('maxLength');
		if (validity.rangeOverflow) errors.push('max');
		if (validity.patternMismatch) errors.push('pattern');

		for (const [constraintName, valid] of Object.entries(result)) {
			if (!valid) {
				errors.push(constraintName);
			}
		}

		return errors;
	};
	const formatMessages =
		options?.formatMessages ?? (({ defaultErrors }) => defaultErrors);

	return parse(formData, {
		resolve(payload, intent) {
			const error: Record<string, string | string[]> = {};
			const constraintPattern = /^constraint[A-Z][^A-Z]*$/;
			for (const element of options.form.elements) {
				if (isFieldElement(element)) {
					const name =
						element.name !== FORM_ERROR_ELEMENT_NAME ? element.name : '';
					const constraint = Object.entries(element.dataset).reduce<
						Record<string, boolean>
					>((result, [name, attributeValue = '']) => {
						if (constraintPattern.test(name)) {
							const constraintName = name
								.slice(10)
								.toLowerCase() as Lowercase<string>;
							const validate = options.constraint?.[constraintName];

							if (typeof validate === 'function') {
								result[constraintName] = validate(element.value, {
									formData,
									attributeValue,
								});
							} else {
								console.warn(
									`Found an "${constraintName}" constraint with undefined definition; Please specify it on the validateConstraint API.`,
								);
							}
						}

						return result;
					}, {});
					const errors = formatMessages({
						name,
						validity: element.validity,
						constraint,
						defaultErrors: getDefaultErrors(element.validity, constraint),
					});
					const shouldAcceptMultipleErrors =
						options?.acceptMultipleErrors?.({
							name,
							payload,
							intent,
						}) ?? false;

					if (errors.length > 0) {
						error[name] = shouldAcceptMultipleErrors ? errors : errors[0];
					}
				}
			}

			return { error };
		},
	});
}

export function reportSubmission(
	form: HTMLFormElement,
	submission: Submission,
): void {
	for (const [name, message] of Object.entries(submission.error)) {
		// There is no need to create a placeholder button if all we want is to reset the error
		if (message === '') {
			continue;
		}

		// We can't use empty string as button name
		// As `form.element.namedItem('')` will always returns null
		const elementName = name ? name : FORM_ERROR_ELEMENT_NAME;
		const item = form.elements.namedItem(elementName);

		if (item instanceof RadioNodeList) {
			for (const field of item) {
				if ((field as FieldElement).type !== 'radio') {
					console.warn('Repeated field name is not supported.');
					continue;
				}
			}
		}

		if (item === null) {
			// Create placeholder button to keep the error without contributing to the form data
			const button = document.createElement('button');

			button.name = elementName;
			button.hidden = true;
			button.dataset.conformTouched = 'true';

			form.appendChild(button);
		}
	}

	const scope = getScope(submission.intent);

	for (const element of getFormControls(form)) {
		const elementName =
			element.name !== FORM_ERROR_ELEMENT_NAME ? element.name : '';
		const messages = ([] as string[]).concat(
			submission.error[elementName] ?? [],
		);

		if (scope === null || scope === elementName) {
			element.dataset.conformTouched = 'true';
		}

		if (
			!messages.includes(VALIDATION_SKIPPED) &&
			!messages.includes(VALIDATION_UNDEFINED)
		) {
			const invalidEvent = new Event('invalid', { cancelable: true });

			element.setCustomValidity(getValidationMessage(messages));
			element.dispatchEvent(invalidEvent);
		}
	}

	if (
		isSubmitting(submission.intent) ||
		isFocusedOnIntentButton(form, submission.intent)
	) {
		if (scope) {
			focusFormControl(form, scope);
		} else {
			focusFirstInvalidControl(form);
		}
	}
}
