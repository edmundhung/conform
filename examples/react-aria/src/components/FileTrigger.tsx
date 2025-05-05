import {
	FileTrigger as AriaFileTrigger,
	FileTriggerProps as AriaFileTriggerProps,
	FieldError,
	FieldErrorContext,
	Label,
	Text,
} from 'react-aria-components';
import { Button } from './Button';

import './DateField.css';
import { useControl } from '@conform-to/react';

export interface FileTriggerProps extends AriaFileTriggerProps {
	label?: string;
	name?: string;
	isInvalid?: boolean;
	description?: string;
	errors?: string[];
}

export function FileTrigger({
	label,
	description,
	isInvalid,
	errors,
	children,
	...props
}: FileTriggerProps) {
	const control = useControl();

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
				<Label>{label}</Label>
				<div>
					<Button>{children}</Button>
					{control.files ? (
						<ul>
							{control.files.map((file, index) => (
								<li key={index}>
									{file.name} ({file.size} bytes)
								</li>
							))}
						</ul>
					) : null}
				</div>
				{description && <Text slot="description">{description}</Text>}
				<FieldError
					style={{
						fontSize: '12px',
						color: 'var(--invalid-color)',
					}}
				/>
				<input type="file" ref={control.register} name={props.name} hidden />
			</AriaFileTrigger>
		</FieldErrorContext.Provider>
	);
}
