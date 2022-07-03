import {
	type FieldsetElement,
	type FieldConfig,
	type Schema,
	type FieldsetData,
	isFieldElement,
	setFieldState,
	reportValidity,
	shouldSkipValidate,
	createFieldConfig,
	createControlButton,
	getFieldElements,
	getName,
} from '@conform-to/dom';
import {
	type ButtonHTMLAttributes,
	type FormEvent,
	type FormEventHandler,
	type FormHTMLAttributes,
	type RefObject,
	useRef,
	useState,
	useEffect,
	useMemo,
	useReducer,
} from 'react';

interface FormConfig {
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
			if (!isFieldElement(event.target) || event.target?.form !== ref.current) {
				return;
			}

			if (initialReport === 'onChange') {
				setFieldState(event.target, { touched: true });
			}

			if (ref.current) {
				reportValidity(ref.current);
			}
		};
		const handleBlur = (event: FocusEvent) => {
			if (!isFieldElement(event.target) || event.target?.form !== ref.current) {
				return;
			}

			if (initialReport === 'onBlur') {
				setFieldState(event.target, { touched: true });
			}

			if (ref.current) {
				reportValidity(ref.current);
			}
		};

		document.body.addEventListener('input', handleChange);
		document.body.addEventListener('focusout', handleBlur);

		return () => {
			document.body.removeEventListener('input', handleChange);
			document.body.removeEventListener('focusout', handleBlur);
		};
	}, [noValidate, initialReport]);

	return {
		ref,
		onSubmit: handleSubmit,
		onReset: handleReset,
		noValidate: formNoValidate,
	};
}

interface FieldsetConfig<Type> extends Partial<FieldConfig<Type>> {}

interface FieldsetProps {
	ref: RefObject<HTMLFieldSetElement>;
	name?: string;
	form?: string;
	onChange: FormEventHandler<HTMLFieldSetElement>;
	onReset: FormEventHandler<HTMLFieldSetElement>;
	onInvalid: FormEventHandler<HTMLFieldSetElement>;
}

export function useFieldset<Type extends Record<string, any>>(
	schema: Schema<Type>,
	config: FieldsetConfig<Type> = {},
): [FieldsetProps, { [Key in keyof Type]-?: FieldConfig<Type[Key]> }] {
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
			onChange(e: FormEvent<FieldsetElement>) {
				const fieldset = e.currentTarget;

				schema.validate?.(fieldset);
				dispatch({ type: 'cleanup', payload: { fieldset } });
			},
			onReset(e: FormEvent<FieldsetElement>) {
				setFieldState(e.currentTarget, { touched: false });
				dispatch({ type: 'reset' });
			},
			onInvalid(e: FormEvent<FieldsetElement>) {
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
		createFieldConfig(schema, {
			...config,
			error: Object.assign({}, config.error, errorMessage),
		}),
	];
}

interface FieldListControl {
	prepend(): ButtonHTMLAttributes<HTMLButtonElement>;
	append(): ButtonHTMLAttributes<HTMLButtonElement>;
	remove(index: number): ButtonHTMLAttributes<HTMLButtonElement>;
}

export function useFieldList<Type extends Array<any>>(
	config: FieldConfig<Type>,
): [
	Array<{
		key: string;
		config: FieldConfig<
			Type extends Array<infer InnerType> ? InnerType : never
		>;
	}>,
	FieldListControl,
] {
	const size = config.initialValue?.length ?? 1;
	const [keys, setKeys] = useState(() => [...Array(size).keys()]);
	const list = useMemo(
		() =>
			keys.map<{ key: string; config: FieldConfig }>((key, index) => ({
				key: `${key}`,
				config: {
					...config,
					name: `${config.name}[${index}]`,
					initialValue: config.initialValue?.[index],
					error: config.error?.[index],
					// @ts-expect-error
					constraint: {
						...config.constraint,
						multiple: false,
					},
				},
			})),
		[keys, config],
	);
	const controls: FieldListControl = {
		prepend() {
			return {
				...createControlButton(config.name, 'prepend', {}),
				onClick(e) {
					setKeys((keys) => [Date.now(), ...keys]);
					e.preventDefault();
				},
			};
		},
		append() {
			return {
				...createControlButton(config.name, 'append', {}),
				onClick(e) {
					setKeys((keys) => [...keys, Date.now()]);
					e.preventDefault();
				},
			};
		},
		remove(index) {
			return {
				...createControlButton(config.name, 'remove', { index }),
				onClick(e) {
					setKeys((keys) => [
						...keys.slice(0, index),
						...keys.slice(index + 1),
					]);
					e.preventDefault();
				},
			};
		},
	};

	useEffect(() => {
		setKeys((keys) => {
			if (keys.length === size) {
				return keys;
			}

			return [...Array(size).keys()];
		});
	}, [size]);

	return [list, controls];
}
