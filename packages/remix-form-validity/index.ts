import { Form as RemixForm } from '@remix-run/react';
import type { ComponentProps } from 'react';
import { forwardRef, createElement } from 'react';
import { useFormValidity } from 'react-form-validity';

export { useFieldset, useFieldsetControl, parse, f } from 'react-form-validity';
export type { FieldsetOptions } from 'react-form-validity';

export const Form = forwardRef<
	HTMLFormElement,
	ComponentProps<typeof RemixForm>
>(({ noValidate, onBlur, onChange, onSubmit, ...props }, ref) => {
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
});

Form.displayName = 'Form';
