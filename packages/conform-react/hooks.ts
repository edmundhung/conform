import {
	type FieldsetElement,
	type FieldProps,
	type Schema,
	type FieldsetData,
	isFieldElement,
	setFieldState,
	reportValidity,
	shouldSkipValidate,
	getFieldProps,
	getControlButtonProps,
	getFieldElements,
	getName,
	applyControlCommand,
} from '@conform-to/dom';
import {
	type ButtonHTMLAttributes,
	type FormEvent,
	type FormEventHandler,
	type FormHTMLAttributes,
	type RefObject,
	type ReactElement,
	useRef,
	useState,
	useEffect,
	useMemo,
	useReducer,
	createElement,
} from 'react';

export interface FormConfig {
	/**
	 * Decide when the error should be reported initially.
	 * Default to `onSubmit`
	 */
	initialReport?: 'onSubmit' | 'onChange' | 'onBlur';

	/**
	 * Native browser report will be used before hydation if it is set to `true`.
	 * Default to `false`
	 */
	fallbackNative?: boolean;

	/**
	 * The form could be submitted even if there is invalid input control if it is set to `true`.
	 * Default to `false`
	 */
	noValidate?: boolean;

	/**
	 * The submit handler will be triggered only when the form is valid.
	 * Or when noValidate is set to `true`
	 */
	onSubmit?: FormHTMLAttributes<HTMLFormElement>['onSubmit'];
	onReset?: FormHTMLAttributes<HTMLFormElement>['onReset'];
}

interface FormProps {
	ref: RefObject<HTMLFormElement>;
	onSubmit: Required<FormHTMLAttributes<HTMLFormElement>>['onSubmit'];
	onReset: Required<FormHTMLAttributes<HTMLFormElement>>['onReset'];
	noValidate: Required<FormHTMLAttributes<HTMLFormElement>>['noValidate'];
}

export function useForm({
	onReset,
	onSubmit,
	noValidate = false,
	fallbackNative = false,
	initialReport = 'onSubmit',
}: FormConfig = {}): FormProps {
	const ref = useRef<HTMLFormElement>(null);
	const [formNoValidate, setFormNoValidate] = useState(
		noValidate || !fallbackNative,
	);
	const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
		if (!noValidate) {
			setFieldState(event.currentTarget, { touched: true });

			if (
				!shouldSkipValidate(event.nativeEvent as SubmitEvent) &&
				!event.currentTarget.reportValidity()
			) {
				return event.preventDefault();
			}
		}

		onSubmit?.(event);
	};
	const handleReset: FormEventHandler<HTMLFormElement> = (event) => {
		setFieldState(event.currentTarget, { touched: false });

		onReset?.(event);
	};

	useEffect(() => {
		setFormNoValidate(true);
	}, []);

	useEffect(() => {
		if (noValidate) {
			return;
		}

		const handleChange = (event: Event) => {
			if (
				!ref.current ||
				!isFieldElement(event.target) ||
				event.target?.form !== ref.current
			) {
				return;
			}

			if (initialReport === 'onChange') {
				setFieldState(event.target, { touched: true });
			}

			reportValidity(ref.current);
		};
		const handleBlur = (event: FocusEvent) => {
			if (
				!ref.current ||
				!isFieldElement(event.target) ||
				event.target?.form !== ref.current
			) {
				return;
			}

			if (initialReport === 'onBlur') {
				setFieldState(event.target, { touched: true });
			}

			reportValidity(ref.current);
		};

		document.addEventListener('input', handleChange);
		document.addEventListener('focusout', handleBlur);

		return () => {
			document.removeEventListener('input', handleChange);
			document.removeEventListener('focusout', handleBlur);
		};
	}, [noValidate, initialReport]);

	return {
		ref,
		onSubmit: handleSubmit,
		onReset: handleReset,
		noValidate: formNoValidate,
	};
}

export type FieldsetConfig<Type> = Partial<
	Pick<FieldProps<Type>, 'name' | 'form' | 'defaultValue' | 'error'>
>;

interface FieldsetProps {
	ref: RefObject<HTMLFieldSetElement>;
	name?: string;
	form?: string;
	onInput: FormEventHandler<HTMLFieldSetElement>;
	onInvalid: FormEventHandler<HTMLFieldSetElement>;
}

export function useFieldset<Type extends Record<string, any>>(
	schema: Schema<Type>,
	config: FieldsetConfig<Type> = {},
): [FieldsetProps, { [Key in keyof Type]-?: FieldProps<Type[Key]> }] {
	const ref = useRef<HTMLFieldSetElement>(null);
	const [errorMessage, dispatch] = useReducer(
		(
			state: Record<string, string>,
			action:
				| {
						type: 'migrate';
						payload: {
							keys: string[];
							error: FieldsetData<Type, string> | undefined;
						};
				  }
				| { type: 'cleanup'; payload: { fieldset: FieldsetElement } }
				| { type: 'report'; payload: { key: string; message: string } }
				| { type: 'reset' },
		) => {
			switch (action.type) {
				case 'report': {
					const { key, message } = action.payload;

					if (state[key] === message) {
						return state;
					}

					return {
						...state,
						[key]: message,
					};
				}
				case 'migrate': {
					let { keys, error } = action.payload;
					let nextState = state;

					for (let key of Object.keys(keys)) {
						const prevError = state[key];
						const nextError = error?.[key];

						if (typeof nextError === 'string' && prevError !== nextError) {
							return {
								...nextState,
								[key]: nextError,
							};
						}
					}

					return nextState;
				}
				case 'cleanup': {
					let { fieldset } = action.payload;
					let updates: Array<[string, string]> = [];

					for (let [key, message] of Object.entries(state)) {
						if (!message) {
							continue;
						}

						const fields = getFieldElements(fieldset, key);

						if (fields.every((field) => field.validity.valid)) {
							updates.push([key, '']);
						}
					}

					if (updates.length === 0) {
						return state;
					}

					return {
						...state,
						...Object.fromEntries(updates),
					};
				}
				case 'reset': {
					return {};
				}
			}
		},
		{},
		() =>
			Object.fromEntries(
				Object.keys(schema.fields).reduce<Array<[string, string]>>(
					(result, name) => {
						const error = config.error?.[name];

						if (typeof error === 'string') {
							result.push([name, error]);
						}

						return result;
					},
					[],
				),
			),
	);

	useEffect(
		() => {
			const fieldset = ref.current;

			if (!fieldset) {
				console.warn(
					'No fieldset ref found; You must pass the fieldsetProps to the fieldset element',
				);
				return;
			}

			if (!fieldset?.form) {
				console.warn(
					'No form element is linked to the fieldset; Do you forgot setting the form attribute?',
				);
			}

			schema.validate?.(fieldset);
			dispatch({ type: 'cleanup', payload: { fieldset } });

			const resetHandler = (e: Event) => {
				if (e.target !== fieldset.form) {
					return;
				}

				dispatch({ type: 'reset' });

				setTimeout(() => {
					// Delay revalidation until reset is completed
					schema.validate?.(fieldset);
				}, 0);
			};

			document.addEventListener('reset', resetHandler);

			return () => {
				document.removeEventListener('reset', resetHandler);
			};
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[schema.validate],
	);

	useEffect(() => {
		dispatch({
			type: 'migrate',
			payload: {
				keys: Object.keys(schema.fields),
				error: config.error,
			},
		});
	}, [config.error, schema.fields]);

	return [
		{
			ref,
			name: config.name,
			form: config.form,
			onInput(e: FormEvent<HTMLFieldSetElement>) {
				const fieldset = e.currentTarget;

				schema.validate?.(fieldset);
				dispatch({ type: 'cleanup', payload: { fieldset } });
			},
			onInvalid(e: FormEvent<HTMLFieldSetElement>) {
				const element = isFieldElement(e.target) ? e.target : null;
				const key = Object.keys(schema.fields).find(
					(key) => element?.name === getName([e.currentTarget.name, key]),
				);

				if (!element || !key) {
					return;
				}

				// Disable browser report
				e.preventDefault();

				dispatch({
					type: 'report',
					payload: { key, message: element.validationMessage },
				});
			},
		},
		getFieldProps(schema, {
			...config,
			error: Object.assign({}, config.error, errorMessage),
		}),
	];
}

interface FieldListControl<T> {
	prepend(
		defaultValue?: FieldsetData<T, string>,
	): ButtonHTMLAttributes<HTMLButtonElement>;
	append(
		defaultValue?: FieldsetData<T, string>,
	): ButtonHTMLAttributes<HTMLButtonElement>;
	replace(
		index: number,
		defaultValue: FieldsetData<T, string>,
	): ButtonHTMLAttributes<HTMLButtonElement>;
	remove(index: number): ButtonHTMLAttributes<HTMLButtonElement>;
	reorder(
		fromIndex: number,
		toIndex: number,
	): ButtonHTMLAttributes<HTMLButtonElement>;
}

export function useFieldList<Payload>(props: FieldProps<Array<Payload>>): [
	Array<{
		key: string;
		props: FieldProps<Payload>;
	}>,
	FieldListControl<Payload>,
] {
	const [entries, setEntries] = useState<
		Array<[string, FieldsetData<Payload, string> | undefined]>
	>(() => Object.entries(props.defaultValue ?? [undefined]));
	const list = entries.map<{ key: string; props: FieldProps<Payload> }>(
		([key, defaultValue], index) => ({
			key: `${key}`,
			props: {
				...props,
				name: `${props.name}[${index}]`,
				defaultValue: defaultValue ?? props.defaultValue?.[index],
				error: props.error?.[index],
				multiple: false,
			},
		}),
	);
	const controls: FieldListControl<Payload> = {
		prepend(defaultValue) {
			return {
				...getControlButtonProps(props.name, 'prepend', {
					defaultValue,
				}),
				onClick(e) {
					setEntries((entries) =>
						applyControlCommand([...entries], 'prepend', {
							defaultValue: [`${Date.now()}`, defaultValue],
						}),
					);
					e.preventDefault();
				},
			};
		},
		append(defaultValue) {
			return {
				...getControlButtonProps(props.name, 'append', {
					defaultValue,
				}),
				onClick(e) {
					setEntries((entries) =>
						applyControlCommand([...entries], 'append', {
							defaultValue: [`${Date.now()}`, defaultValue],
						}),
					);
					e.preventDefault();
				},
			};
		},
		replace(index, defaultValue) {
			return {
				...getControlButtonProps(props.name, 'replace', {
					index,
					defaultValue,
				}),
				onClick(e) {
					setEntries((entries) =>
						applyControlCommand([...entries], 'replace', {
							defaultValue: [`${Date.now()}`, defaultValue],
							index,
						}),
					);
					e.preventDefault();
				},
			};
		},
		remove(index) {
			return {
				...getControlButtonProps(props.name, 'remove', { index }),
				onClick(e) {
					setEntries((entries) =>
						applyControlCommand([...entries], 'remove', {
							index,
						}),
					);
					e.preventDefault();
				},
			};
		},
		reorder(fromIndex, toIndex) {
			return {
				...getControlButtonProps(props.name, 'reorder', {
					from: fromIndex,
					to: toIndex,
				}),
				onClick(e) {
					if (fromIndex !== toIndex) {
						setEntries((entries) =>
							applyControlCommand([...entries], 'reorder', {
								from: fromIndex,
								to: toIndex,
							}),
						);
					}

					e.preventDefault();
				},
			};
		},
	};

	useEffect(() => {
		setEntries(Object.entries(props.defaultValue ?? [undefined]));
	}, [props.defaultValue]);

	return [list, controls];
}

interface InputControl {
	value: string;
	onChange: (value: string) => void;
	onBlur: () => void;
}

export function useControlledInput<
	T extends string | number | Date | undefined,
>(field: FieldProps<T>): [ReactElement, InputControl] {
	const ref = useRef<HTMLInputElement>(null);
	const input = useMemo(
		() =>
			createElement('input', {
				ref,
				name: field.name,
				form: field.form,
				defaultValue: field.defaultValue,
				required: field.required,
				minLength: field.minLength,
				maxLength: field.maxLength,
				min: field.min,
				max: field.max,
				step: field.step,
				pattern: field.pattern,
				hidden: true,
				'aria-hidden': true,
			}),
		[
			field.name,
			field.form,
			field.defaultValue,
			field.required,
			field.minLength,
			field.maxLength,
			field.min,
			field.max,
			field.step,
			field.pattern,
		],
	);

	return [
		input,
		{
			value: ref.current?.value ?? `${field.defaultValue ?? ''}`,
			onChange: (value: string) => {
				if (!ref.current) {
					return;
				}

				ref.current.value = value;
				ref.current.dispatchEvent(new InputEvent('input', { bubbles: true }));
			},
			onBlur: () => {
				ref.current?.dispatchEvent(
					new FocusEvent('focusout', { bubbles: true }),
				);
			},
		},
	];
}
