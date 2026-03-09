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
	label: string;
	description?: string;
	errors?: string[];
}

const fieldsetResetStyle: React.CSSProperties = {
	border: 0,
	margin: 0,
	padding: 0,
	minInlineSize: 0,
};

export function CheckboxGroup({
	label,
	name,
	description,
	defaultValue,
	errors,
	children,
	onChange,
	onBlur,
	...props
}: CheckboxGroupProps) {
	const control = useControl({ defaultValue });

	return (
		<fieldset name={name} ref={control.register} style={fieldsetResetStyle}>
			<AriaCheckboxGroup
				{...props}
				name={name}
				value={control.options ?? []}
				onChange={(value) => {
					control.change(value);
					onChange?.(value);
				}}
				onBlur={(event) => {
					control.blur();
					onBlur?.(event);
				}}
			>
				<Label>{label}</Label>
				{children}
				{description && <Text slot="description">{description}</Text>}
				<FieldError>{errors}</FieldError>
			</AriaCheckboxGroup>
		</fieldset>
	);
}
