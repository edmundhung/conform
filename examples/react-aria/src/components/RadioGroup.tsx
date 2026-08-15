import { useControl } from '@conform-to/react/future';
import { useCallback } from 'react';
import {
	FieldError,
	Label,
	RadioButton,
	RadioField,
	RadioGroup as AriaRadioGroup,
	Text,
} from 'react-aria-components';
import type {
	LabelProps,
	RadioFieldProps,
	RadioGroupProps as AriaRadioGroupProps,
} from 'react-aria-components';

import './RadioGroup.css';

export interface RadioGroupProps extends Omit<
	AriaRadioGroupProps,
	'children' | 'defaultValue'
> {
	children?: LabelProps['children'];
	label?: string;
	defaultValue?: string | undefined;
	description?: string;
	errors?: string[];
}

export function RadioGroup({
	label,
	description,
	errors,
	children,
	defaultValue,
	onBlur,
	onChange,
	...props
}: RadioGroupProps) {
	const control = useControl({ defaultValue });
	const registerControl = control.register;
	const register = useCallback(
		(element: HTMLDivElement | null) =>
			registerControl(element?.querySelectorAll('input')),
		[registerControl],
	);

	return (
		<AriaRadioGroup
			{...props}
			ref={register}
			value={control.value ?? null}
			onChange={(value) => {
				control.change(value);
				onChange?.(value);
			}}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) {
					control.blur();
				}
				onBlur?.(event);
			}}
		>
			{label ? <Label>{label}</Label> : null}
			{children}
			{description && <Text slot="description">{description}</Text>}
			<FieldError>{errors}</FieldError>
		</AriaRadioGroup>
	);
}

export interface RadioProps extends Omit<RadioFieldProps, 'children'> {
	children: LabelProps['children'];
	description?: string;
}

export function Radio({ children, description, ...props }: RadioProps) {
	return (
		<RadioField {...props}>
			<RadioButton>{children}</RadioButton>
			{description ? <Text slot="description">{description}</Text> : null}
		</RadioField>
	);
}
