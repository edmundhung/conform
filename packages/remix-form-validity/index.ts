import { Form as RemixForm } from '@remix-run/react';
import type { ComponentProps } from 'react';
import { forwardRef, createElement } from 'react';
import type { FormValidationProps } from 'react-form-validity';
import { useFormValidity } from 'react-form-validity';

export { useFieldset, parse, f } from 'react-form-validity';
export type { FieldsetOptions } from 'react-form-validity';

export type FormProps = FormValidationProps & ComponentProps<typeof RemixForm>;

export const Form = forwardRef<HTMLFormElement, FormProps>(
	({ noValidate, onBlur, onChange, onSubmit, ...props }, ref) => {
		const formProps = useFormValidity({
			noValidate,
			onBlur,
			onChange,
			onSubmit,
		});

		return createElement(RemixForm, {
			ref,
			...props,
			...formProps,
		});
	},
);

Form.displayName = 'Form';
