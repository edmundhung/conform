import { BaseControl, useControl } from '@conform-to/react/future';
import { useCallback, useRef } from 'react';
import {
	FieldError,
	SwitchButton,
	SwitchField,
	Text,
} from 'react-aria-components';
import type { LabelProps, SwitchFieldProps } from 'react-aria-components';

import './Switch.css';

export interface SwitchProps extends Omit<
	SwitchFieldProps,
	'children' | 'isSelected' | 'onChange' | 'inputRef'
> {
	children: LabelProps['children'];
	description?: string;
	errors?: string[];
}

export function Switch({
	children,
	name,
	defaultSelected,
	description,
	errors,
	onBlur,
	...props
}: SwitchProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const focusInput = useCallback(() => inputRef.current?.focus(), []);
	const control = useControl({
		defaultChecked: defaultSelected,
		onFocus: focusInput,
	});

	return (
		<>
			<BaseControl
				type="checkbox"
				name={name ?? ''}
				ref={control.register}
				defaultChecked={control.defaultValue === 'on'}
			/>
			<SwitchField
				{...props}
				inputRef={inputRef}
				isSelected={control.checked}
				onChange={(selected) => control.change(selected)}
				onBlur={(event) => {
					control.blur();
					onBlur?.(event);
				}}
			>
				<SwitchButton>
					<div className="indicator" />
					{children}
				</SwitchButton>
				{description ? <Text slot="description">{description}</Text> : null}
				<FieldError>{errors}</FieldError>
			</SwitchField>
		</>
	);
}
