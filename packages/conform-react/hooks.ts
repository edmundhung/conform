import {
	type FieldProps,
	type Schema,
	type FieldsetData,
	getFieldProps,
	getControlButtonProps,
	applyControlCommand,
	subscribeFieldset,
} from '@conform-to/dom';
import {
	type ButtonHTMLAttributes,
	type RefObject,
	type ReactElement,
	useRef,
	useState,
	useEffect,
	useMemo,
	createElement,
} from 'react';

export interface FieldsetConfig<Type>
	extends Partial<
		Pick<FieldProps<Type>, 'name' | 'form' | 'defaultValue' | 'error'>
	> {
	/**
	 * Decide when the error should be reported initially.
	 * Default to `onSubmit`
	 */
	initialReport?: 'onSubmit' | 'onChange' | 'onBlur';
}

interface FieldsetProps {
	ref: RefObject<HTMLFieldSetElement>;
	name?: string;
	form?: string;
}

export function useFieldset<Type extends Record<string, unknown>>(
	schema: Schema<Type>,
	config: FieldsetConfig<Type> = {},
): [FieldsetProps, { [Key in keyof Type]-?: FieldProps<Type[Key]> }] {
	const fieldsetRef = useRef<HTMLFieldSetElement>(null);
	const [errorMessage, setErrorMessage] = useState(() => {
		let result: Record<string, string> = {};

		for (let key of Object.keys(schema.fields)) {
			const error = config.error?.[key];

			if (typeof error === 'string') {
				result[key] = error;
			}
		}

		return result;
	});

	useEffect(() => {
		const fieldset = fieldsetRef.current;

		if (!fieldset) {
			console.warn(
				'No fieldset ref found; You must pass the fieldsetProps to the fieldset element',
			);
			return;
		}

		const unsubscribe = subscribeFieldset(fieldset, {
			fields: schema.fields,
			validate: schema.validate,
			initialReport: config.initialReport,
			onReport(key: string, message: string) {
				setErrorMessage((prev) => {
					let next = prev;

					if (next[key] !== message) {
						next = {
							...next,
							[key]: message,
						};
					}

					return next;
				});
			},
		});

		return () => {
			unsubscribe();
		};
	}, [schema, config.initialReport]);

	// useEffect(() => {
	// 	dispatch({
	// 		type: 'migrate',
	// 		payload: {
	// 			keys: Object.keys(schema.fields),
	// 			error: config.error,
	// 		},
	// 	});
	// }, [config.error, schema.fields]);

	return [
		{
			ref: fieldsetRef,
			name: config.name,
			form: config.form,
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
