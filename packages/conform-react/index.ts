import type {
	ButtonHTMLAttributes,
	FocusEventHandler,
	FormEvent,
	FormEventHandler,
	FormHTMLAttributes,
	InputHTMLAttributes,
	RefObject,
	SelectHTMLAttributes,
	TextareaHTMLAttributes,
} from 'react';
import type { FieldsetElement, FieldConfig, Schema } from '@conform-to/dom';
import { useRef, useState, useEffect, useMemo } from 'react';
import {
	isFieldElement,
	setFieldState,
	reportValidity,
	shouldSkipValidate,
	createFieldConfig,
	getFields,
	getName,
} from '@conform-to/dom';

export { getFields };

type FormProps = Pick<
	FormHTMLAttributes<HTMLFormElement>,
	'onChange' | 'onBlur' | 'onSubmit' | 'onReset' | 'noValidate'
>;

interface UseFormOptions extends FormProps {
	fallbackMode?: 'native' | 'none';
	initialReport?: 'onSubmit' | 'onChange' | 'onBlur';
}

interface SetupProps<Type> {
	fieldset: {
		ref: RefObject<HTMLFieldSetElement>;
		name?: string;
		form?: string;
		onChange: FormEventHandler<HTMLFieldSetElement>;
		onReset: FormEventHandler<HTMLFieldSetElement>;
		onInvalid: FormEventHandler<HTMLFieldSetElement>;
	};
	field: { [Key in keyof Type]-?: FieldConfig<Type[Key]> };
}

interface FieldListControl {
	prepend(): ButtonHTMLAttributes<HTMLButtonElement>;
	remove(index: number): ButtonHTMLAttributes<HTMLButtonElement>;
}

export const f = {
	input<Type extends string | number | Date | undefined>({
		name,
		form,
		value,
		constraint,
	}: FieldConfig<Type>): InputHTMLAttributes<HTMLInputElement> {
		return {
			name,
			form,
			defaultValue: value?.toString(),
			required: constraint?.required,
			minLength: constraint?.minLength,
			maxLength: constraint?.maxLength,
			min: constraint?.min,
			max: constraint?.max,
			step: constraint?.step,
			pattern: constraint?.pattern,
		};
	},
	select({
		name,
		form,
		value,
		constraint,
	}: FieldConfig): SelectHTMLAttributes<HTMLSelectElement> {
		return {
			name,
			form,
			defaultValue: value?.toString(),
			required: constraint?.required,
			multiple: constraint?.multiple,
		};
	},
	textarea({
		name,
		form,
		value,
		constraint,
	}: FieldConfig<string>): TextareaHTMLAttributes<HTMLTextAreaElement> {
		return {
			name,
			form,
			defaultValue: value?.toString(),
			required: constraint?.required,
			minLength: constraint?.minLength,
			maxLength: constraint?.maxLength,
		};
	},
};

export function useForm({
	onChange,
	onBlur,
	onReset,
	onSubmit,
	noValidate = false,
	fallbackMode = 'none',
	initialReport = 'onSubmit',
}: UseFormOptions = {}): FormProps {
	const [formNoValidate, setFormNoValidate] = useState(
		noValidate || fallbackMode !== 'native',
	);
	const handleBlur: FocusEventHandler<HTMLFormElement> = (event) => {
		if (!noValidate) {
			if (initialReport === 'onBlur') {
				setFieldState(event.target, { touched: true });
			}

			reportValidity(event.currentTarget);
		}

		onBlur?.(event);
	};
	const handleChange: FormEventHandler<HTMLFormElement> = (event) => {
		if (!noValidate) {
			if (initialReport === 'onChange') {
				setFieldState(event.target, { touched: true });
			}

			reportValidity(event.currentTarget);
		}

		onChange?.(event);
	};
	const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
		if (!noValidate) {
			setFieldState(event.currentTarget, { touched: true });

			if (
				!shouldSkipValidate(event.nativeEvent as SubmitEvent) &&
				!event.currentTarget.reportValidity()
			) {
				event.preventDefault();
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

	return {
		onChange: handleChange,
		onBlur: handleBlur,
		onSubmit: handleSubmit,
		onReset: handleReset,
		noValidate: formNoValidate,
	};
}

export function useFieldset<Type extends Record<string, any>>(
	schema: Schema<Type>,
	config: Partial<FieldConfig<Type>> = {},
): [SetupProps<Type>, Record<keyof Type, string>] {
	const ref = useRef<HTMLFieldSetElement>(null);
	const [errorMessage, setErrorMessage] = useState(() =>
		Object.fromEntries(
			Object.keys(schema.constraint).map((name) => [
				name,
				config.error?.[name] ?? '',
			]),
		),
	);

	const setup: SetupProps<Type> = {
		fieldset: {
			ref,
			name: config.name,
			form: config.form,
			onChange(e: FormEvent<FieldsetElement>) {
				const fieldset = e.currentTarget;

				schema.validate?.(fieldset);
				setErrorMessage((error) => resetErrorMessages(fieldset, error));
			},
			onReset(e: FormEvent<FieldsetElement>) {
				setErrorMessage({} as Record<keyof Type, string>);
			},
			onInvalid(e: FormEvent<FieldsetElement>) {
				const element = isFieldElement(e.target) ? e.target : null;
				const key = Object.keys(schema.constraint).find(
					(key) => element?.name === getName([e.currentTarget.name, key]),
				);

				if (!element || !key) {
					return;
				}

				// Disable browser report
				e.preventDefault();

				setErrorMessage((message) => {
					if (message[key] === element.validationMessage) {
						return message;
					}

					return {
						...message,
						[key]: element.validationMessage,
					};
				});
			},
		},
		field: createFieldConfig(schema, config),
	};

	useEffect(() => {
		const fieldset = ref.current;
		const form = fieldset?.form;

		if (!fieldset) {
			console.warn(
				'Missing fieldset ref; Please make sure the ref to be passed to the element',
			);
			return;
		}

		if (!form) {
			console.warn(
				'No form related to the fieldset; It must be placed within the form tag or else a form id should be provided',
			);
		}

		schema.validate?.(fieldset);
		setErrorMessage((error) => resetErrorMessages(fieldset, error));
	}, [schema]);

	useEffect(() => {
		setErrorMessage(
			Object.fromEntries(
				Object.keys(schema.constraint).map((name) => [
					name,
					config.error?.[name] ?? '',
				]),
			),
		);
	}, [config.error, schema]);

	return [setup, errorMessage as Record<keyof Type, string>];
}

export function useFieldList<InnerType, Type extends Array<InnerType>>(
	config: FieldConfig<Type>,
): [Array<{ key: string; config: FieldConfig<InnerType> }>, FieldListControl] {
	const size = config.value?.length ?? 1;
	const [keys, setKeys] = useState(() => [...Array(size).keys()]);
	const list = useMemo(
		() =>
			keys.map<{ key: string; config: FieldConfig<InnerType> }>(
				(key, index) => ({
					key: `${key}`,
					config: {
						...config,
						name: `${config.name}[${index}]`,
						value: config.value?.[index],
						error: config.error?.[index],
						// @ts-expect-error
						constraint: {
							...config.constraint,
							multiple: false,
						},
					},
				}),
			),
		[keys, config],
	);
	const controls = {
		prepend(): ButtonHTMLAttributes<HTMLButtonElement> {
			return {
				type: 'submit',
				name: config.name,
				value: 'conforms::prepend',
				formNoValidate: true,
				onClick(e) {
					setKeys((keys) => keys.concat(Date.now()));
					e.preventDefault();
				},
			};
		},
		remove(index: number): ButtonHTMLAttributes<HTMLButtonElement> {
			return {
				type: 'submit',
				name: config.name,
				value: `conforms::remove:${index}`,
				formNoValidate: true,
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

function resetErrorMessages<T extends Record<string, any>>(
	fieldset: FieldsetElement,
	error: T,
): T {
	const updates: Array<[string, string]> = [];

	for (let [key, message] of Object.entries(error)) {
		if (!message) {
			continue;
		}

		const fields = getFields(fieldset, key);

		for (let field of fields) {
			if (field.validity.valid) {
				updates.push([key, '']);
			}
		}
	}

	if (updates.length === 0) {
		return error;
	}

	return {
		...error,
		...Object.fromEntries(updates),
	};
}
