import { useControl } from '@conform-to/react/future';
import {
	CheckboxGroup as AriaCheckboxGroup,
	CheckboxGroupProps as AriaCheckboxGroupProps,
	FieldError,
	Label,
	Text,
} from 'react-aria-components';

import './CheckboxGroup.css';

export interface CheckboxGroupProps
	extends Omit<AriaCheckboxGroupProps, 'children'> {
	children?: React.ReactNode;
	label?: string;
	description?: string;
	errors?: string[];
}

export function CheckboxGroup({
	label,
	name,
	description,
	defaultValue,
	errors,
	children,
	...props
}: CheckboxGroupProps) {
	const control = useControl({ defaultValue });

	return (
		<AriaCheckboxGroup
			{...props}
			ref={(wrapper) => control.register(wrapper?.querySelectorAll('input'))}
			name={name}
			value={control.options ?? []}
			onChange={(value) => control.change(value)}
			onBlur={() => control.blur()}
		>
			{label && <Label>{label}</Label>}
			{children}
			{description && <Text slot="description">{description}</Text>}
			<FieldError>{errors}</FieldError>
		</AriaCheckboxGroup>
	);
}
