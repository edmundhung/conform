import { BaseControl, useControl } from '@conform-to/react/future';
import { useCallback, useContext, useRef } from 'react';
import type { Context } from 'react';
import {
	CheckboxButton,
	CheckboxField,
	CheckboxGroupStateContext,
	FieldError,
	Text,
} from 'react-aria-components';
import type { CheckboxFieldProps, LabelProps } from 'react-aria-components';

import './Checkbox.css';

export interface CheckboxProps extends Omit<
	CheckboxFieldProps,
	'children' | 'isSelected' | 'onChange' | 'inputRef'
> {
	children?: LabelProps['children'];
	description?: string;
	errors?: string[];
}

function CheckboxContent({ children }: Pick<CheckboxProps, 'children'>) {
	return (
		<CheckboxButton>
			{({ isIndeterminate }) => (
				<>
					<div className="checkbox">
						<svg viewBox="0 0 18 18" aria-hidden="true">
							{isIndeterminate ? (
								<rect x={1} y={7.5} width={15} height={3} />
							) : (
								<polyline points="1 9 7 14 15 4" />
							)}
						</svg>
					</div>
					{children}
				</>
			)}
		</CheckboxButton>
	);
}

function StandaloneCheckbox({
	name,
	defaultSelected,
	children,
	description,
	errors,
	onBlur,
	...props
}: CheckboxProps) {
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
			<CheckboxField
				{...props}
				inputRef={inputRef}
				isSelected={control.checked}
				onChange={(checked) => control.change(checked)}
				onBlur={(event) => {
					control.blur();
					onBlur?.(event);
				}}
			>
				<CheckboxContent>{children}</CheckboxContent>
				{description ? <Text slot="description">{description}</Text> : null}
				<FieldError>{errors}</FieldError>
			</CheckboxField>
		</>
	);
}

export function Checkbox(props: CheckboxProps) {
	// React Aria Components 1.19 declares this context with React 18 types.
	const state = useContext(
		CheckboxGroupStateContext as unknown as Context<unknown>,
	);

	if (!state) {
		return <StandaloneCheckbox {...props} />;
	}

	const { children, description, errors, ...fieldProps } = props;

	return (
		<CheckboxField {...fieldProps}>
			<CheckboxContent>{children}</CheckboxContent>
			{description ? <Text slot="description">{description}</Text> : null}
			<FieldError>{errors}</FieldError>
		</CheckboxField>
	);
}

export { Checkbox as MyCheckbox };
