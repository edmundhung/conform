import {
	FileTrigger as AriaFileTrigger,
	FieldError,
	FieldErrorContext,
	Label,
	Text,
} from 'react-aria-components';
import type { FileTriggerProps as AriaFileTriggerProps } from 'react-aria-components';
import { Button } from './Button';

import './DateField.css';
import { useControl } from '@conform-to/react/future';
import { useCallback, useId, useRef } from 'react';

export interface FileTriggerProps extends AriaFileTriggerProps {
	label?: string;
	name?: string;
	defaultValue?: File | File[] | null | undefined;
	isInvalid?: boolean;
	description?: string;
	errors?: string[];
}

export function FileTrigger({
	label,
	defaultValue,
	description,
	isInvalid,
	errors,
	children,
	...props
}: FileTriggerProps) {
	const id = useId();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const focusButton = useCallback(() => buttonRef.current?.focus(), []);
	const control = useControl({
		defaultValue,
		onFocus: focusButton,
	});

	return (
		<FieldErrorContext.Provider
			value={{
				isInvalid: isInvalid ?? false,
				validationErrors: errors ?? [],
				validationDetails: {} as ValidityState,
			}}
		>
			<AriaFileTrigger
				{...props}
				onSelect={(files) => control.change(files ? Array.from(files) : [])}
			>
				<Label htmlFor={`${id}-button`}>{label}</Label>
				<div>
					<Button
						id={`${id}-button`}
						ref={buttonRef}
						aria-describedby={isInvalid ? `${id}-error` : undefined}
						onBlur={() => control.blur()}
					>
						{children}
					</Button>
				</div>
				{control.files ? (
					<ul>
						{control.files.map((file, index) => (
							<li key={index}>
								{file.name} ({file.size} bytes)
							</li>
						))}
					</ul>
				) : null}
				{description && <Text slot="description">{description}</Text>}
				<FieldError
					id={`${id}-error`}
					style={{
						fontSize: '12px',
						color: 'var(--invalid-color)',
					}}
				/>
				<input
					type="file"
					ref={control.register}
					name={props.name}
					className="file-input-control"
				/>
			</AriaFileTrigger>
		</FieldErrorContext.Provider>
	);
}
