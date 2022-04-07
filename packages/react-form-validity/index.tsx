import type { FormEventHandler, FormHTMLAttributes, InputHTMLAttributes } from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import type { Field } from 'form-validity';
import { getFieldAttributes, configureCustomValidity, isDirtyField, isValidationConstraintSupported } from 'form-validity';

export { f } from 'form-validity';

export type BaseFormProps = Pick<
	FormHTMLAttributes<HTMLFormElement>,
	'noValidate' | 'onChange' | 'onBlur' | 'onSubmit'
>;

export interface UseFormValidationOptions extends BaseFormProps {
	reportValidity?: boolean;
}

export function useFormValidation({
	reportValidity,
	noValidate,
	onChange,
	onBlur,
	onSubmit,
}: UseFormValidationOptions): BaseFormProps {
	const ref = useRef<{ submitted: boolean; touched: Record<string, boolean | undefined> }>({ submitted: false, touched: {} });
	const [noBrowserValidate, setNoBrowserValidate] = useState(
		noValidate ?? false,
	);
	const handleBlur: FormEventHandler<HTMLFormElement> | undefined = noValidate
		? onBlur
		: (event) => {
			if (isValidationConstraintSupported(event.target) && isDirtyField(event.target)) {
				ref.current.touched[event.target.name] = true;
				event.target.checkValidity();
			}
		};
	const handleChange: FormEventHandler<HTMLFormElement> | undefined = noValidate
		? onChange
		: (event) => {
			if (isValidationConstraintSupported(event.target) && (ref.current.submitted || ref.current.touched[event.target.name])) {
				event.target.checkValidity();
			}

			onChange?.(event);
		};
	const handleSubmit: FormEventHandler<HTMLFormElement> | undefined = noValidate
		? onSubmit
		: (event) => {
			ref.current.submitted = true;

			if (!event.currentTarget.checkValidity()) {
				event.preventDefault();
			} else {
				onSubmit?.(event);
			}
		};

	useEffect(() => {
		if (!reportValidity) {
			setNoBrowserValidate(true);
		}
	}, [reportValidity]);

	return {
		onBlur: handleBlur,
		onChange: handleChange,
		onSubmit: handleSubmit,
		noValidate: noBrowserValidate,
	};
}

export function useFieldset<T extends string>(fieldset: Record<T, Field>) {
	const [error, setError] = useState(() => Object.fromEntries(Object.keys(fieldset).map(name => [name, ''])));
	const inputs = useMemo(() => {
		const entries = Object.entries<Field>(fieldset).map(([name, field]) => {
			const constraints = field.getConstraints();
			const checkCustomValidity = configureCustomValidity(constraints);
			const fieldAttributes: InputHTMLAttributes<HTMLInputElement> = {
				...getFieldAttributes(constraints),
				type: field.getType(),
				name,
				onInput(e) {
					const customMessage = checkCustomValidity?.(e.currentTarget.validity);
					const message = customMessage ?? e.currentTarget.validationMessage;

					if (message) {
						// Skip: the input is valid
						return;
					}

					setError(error => error[name] === '' ? error : { ...error, [name]: '' });
				},
				onInvalid(e) {
					const customMessage = checkCustomValidity?.(e.currentTarget.validity);
					const message = customMessage ?? e.currentTarget.validationMessage;

					setError(error => error[name] === message ? error : { ...error, [name]: message });
				},
			};

			return [name, fieldAttributes] as [string, InputHTMLAttributes<HTMLInputElement>];
		});

		return Object.fromEntries(entries);
	}, [fieldset]);

	useEffect(() => {
		setError(error => Object.fromEntries(Object.keys(fieldset).map(name => [name, error[name] ?? ''])));
	}, [fieldset]);

	return [inputs, error];
}