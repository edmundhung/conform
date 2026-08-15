import { BaseControl, useControl } from '@conform-to/react/future';
import { useRef } from 'react';
import {
	CheckboxGroup as AriaCheckboxGroup,
	FieldError,
	Label,
	Text,
} from 'react-aria-components';
import type {
	CheckboxGroupProps as AriaCheckboxGroupProps,
	LabelProps,
} from 'react-aria-components';

import './CheckboxGroup.css';

export interface CheckboxGroupProps extends Omit<
	AriaCheckboxGroupProps,
	'children'
> {
	children?: LabelProps['children'];
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
	onBlur,
	...props
}: CheckboxGroupProps) {
	const groupRef = useRef<HTMLDivElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			groupRef.current?.querySelector('input')?.focus();
		},
	});

	return (
		<>
			<BaseControl
				type="select"
				name={name ?? ''}
				ref={control.register}
				defaultValue={control.defaultValue ?? []}
				multiple
			/>
			<AriaCheckboxGroup
				{...props}
				ref={groupRef}
				value={control.options ?? []}
				onChange={(value) => control.change(value)}
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) {
						control.blur();
					}
					onBlur?.(event);
				}}
			>
				{label && <Label>{label}</Label>}
				{children}
				{description && <Text slot="description">{description}</Text>}
				<FieldError>{errors}</FieldError>
			</AriaCheckboxGroup>
		</>
	);
}
