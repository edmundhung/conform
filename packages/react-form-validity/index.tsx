import type { FormEventHandler, RefObject, FormHTMLAttributes } from 'react';
import { useEffect, useState, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isFormElement(element: any): element is HTMLFormElement {
	return element != null && element.tagName.toLowerCase() === 'form';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isFormControlsElement(
	element: any,
): element is HTMLButtonElement | HTMLInputElement | HTMLTextAreaElement {
	return isFormElement(element.form);
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

export interface FormValidityOptions extends BaseFormProps {
	reportValidity?: boolean;
}

export function useFormValidity({
	reportValidity,
	noValidate,
	onChange,
	onSubmit,
}: FormValidityOptions): BaseFormProps {
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

export function useValidationMessage(
	input: RefObject<HTMLInputElement>,
	checkCustomValidity?: (validity: ValidityState) => string,
): string {
	const [message, setMessage] = useState('');

	useEffect(() => {
		const target = input.current;

		if (!target) {
			return;
		}

		const handleInvalid = (e: Event): void => {
			if (!isFormControlsElement(e.currentTarget)) {
				return;
			}

			const error = checkCustomValidity?.(e.currentTarget.validity);

			if (typeof error !== 'undefined') {
				e.currentTarget.setCustomValidity(error);
			}

			if (e.currentTarget.form?.noValidate) {
				setMessage(error ?? e.currentTarget.validationMessage);
			}
		};
		const handleInput = (e: Event): void => {
			if (!isFormControlsElement(e.currentTarget)) {
				return;
			}

			const error = checkCustomValidity?.(e.currentTarget.validity);

			if (typeof error !== 'undefined') {
				e.currentTarget.setCustomValidity(error);
			}

			if (e.currentTarget.form?.noValidate) {
				setMessage(error ?? e.currentTarget.validationMessage);
			}
		};

		target.addEventListener('invalid', handleInvalid);

		if (message !== '') {
			target.addEventListener('input', handleInput);
		}

		return () => {
			target.removeEventListener('invalid', handleInvalid);

			if (message !== '') {
				target.removeEventListener('input', handleInput);
			}
		};
	}, [input, message, checkCustomValidity]);

	return message;
}

export function useField() {
	const ref = useRef<HTMLInputElement>(null);

	return {
		ref,
	};
}
