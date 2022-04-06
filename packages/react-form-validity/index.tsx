import type { FormEventHandler, FormHTMLAttributes, InputHTMLAttributes } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { Field } from 'form-validity';
import { getFieldAttributes, configureCustomValidity } from 'form-validity';

export { f } from 'form-validity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isFormElement(element: any): element is HTMLFormElement {
	return !!element && element.tagName.toLowerCase() === 'form';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFormElement(element: any): HTMLFormElement | null {
	if (isFormElement(element)) {
		return element;
	} else if (isFormElement(element.form)) {
		return element.form;
	} else {
		return null;
	}
}

export type BaseFormProps = Pick<
	FormHTMLAttributes<HTMLFormElement>,
	'noValidate' | 'onChange' | 'onSubmit'
>;

export interface UseFormValidationOptions extends BaseFormProps {
	reportValidity?: boolean;
}

export function useFormValidation({
	reportValidity,
	noValidate,
	onChange,
	onSubmit,
}: UseFormValidationOptions): BaseFormProps {
	const [noBrowserValidate, setNoBrowserValidate] = useState(
		noValidate ?? false,
	);
	const [submitted, setSubmitted] = useState(false);
	const handleChange: FormEventHandler<HTMLFormElement> | undefined = noValidate
		? onChange
		: (event) => {
				if (submitted) {
					event.currentTarget.checkValidity();
				}

				onChange?.(event);
		  };
	const handleSubmit: FormEventHandler<HTMLFormElement> | undefined = noValidate
		? onSubmit
		: (event) => {
				setSubmitted(true);

				const formElement = getFormElement(event.currentTarget);

				if (!formElement) {
					return;
				}

				if (!formElement.checkValidity()) {
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
		onChange: handleChange,
		onSubmit: handleSubmit,
		noValidate: noBrowserValidate,
	};
}

export type Fieldset<T extends string> = Record<T, Field>;

export function useFieldset<T extends string>(fieldset: Fieldset<T>) {
	const [error, setError] = useState(() => Object.fromEntries(Object.keys(fieldset).map(name => [name, ''])));
	const inputs = useMemo(() => {
		const entries = Object.entries<Field>(fieldset).map(([name, field]) => {
			const constraints = field.getConstraints();
			const checkCustomValidity = configureCustomValidity(constraints);
			const fieldAttributes: InputHTMLAttributes<HTMLInputElement> = {
				...getFieldAttributes(constraints),
				onInput(e) {
					const customMessage = checkCustomValidity?.(e.currentTarget.validity);
		
					if (e.currentTarget.form?.noValidate) {
						const message = customMessage ?? e.currentTarget.validationMessage;

						setError(error => error[name] === message ? error : { ...error, [name]: message });
					} else if (typeof customMessage !== 'undefined' && customMessage !== null) {
						e.currentTarget.setCustomValidity(customMessage);
					}
				},
				onInvalid(e) {
					const customMessage = checkCustomValidity?.(e.currentTarget.validity);
		
					if (e.currentTarget.form?.noValidate) {
						const message = customMessage ?? e.currentTarget.validationMessage;

						setError(error => error[name] === message ? error : { ...error, [name]: message });
					} else if (typeof customMessage !== 'undefined' && customMessage !== null) {
						e.currentTarget.setCustomValidity(customMessage);
					}
				},
			};

			return [name, fieldAttributes] as [string, InputHTMLAttributes<HTMLInputElement>];
		});

		return Object.fromEntries(entries);
	}, [fieldset]);

	useEffect(() => {
		setError(error => {
			const newKeys = Object.keys(fieldset).sort();

			if (newKeys.join('|') === Object.keys(error).sort().join('|')) {
				return error;
			}

			return Object.fromEntries(newKeys.map(name => [name, error[name] ?? '']));
		});
	}, [fieldset]);

	return [inputs, error];
}