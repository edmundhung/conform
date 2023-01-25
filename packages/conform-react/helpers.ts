import type { FieldConfig } from '@conform-to/dom';
import type { CSSProperties, HTMLInputTypeAttribute } from 'react';

interface FieldProps {
	id?: string;
	name: string;
	form?: string;
	required?: boolean;
	autoFocus?: boolean;
	tabIndex?: number;
	style?: CSSProperties;
	'aria-invalid': boolean;
	'aria-describedby'?: string;
	'aria-hidden'?: boolean;
}

interface InputProps<Schema> extends FieldProps {
	type?: HTMLInputTypeAttribute;
	minLength?: number;
	maxLength?: number;
	min?: Schema extends number ? number : string | number;
	max?: Schema extends number ? number : string | number;
	step?: Schema extends number ? number : string | number;
	pattern?: string;
	multiple?: boolean;
	value?: string;
	defaultChecked?: boolean;
	defaultValue?: string;
}

interface SelectProps extends FieldProps {
	defaultValue?: string | number | readonly string[] | undefined;
	multiple?: boolean;
}

interface TextareaProps extends FieldProps {
	minLength?: number;
	maxLength?: number;
	defaultValue?: string;
}

type InputOptions =
	| {
			type: 'checkbox' | 'radio';
			hidden?: boolean;
			value?: string;
	  }
	| {
			type?: Exclude<HTMLInputTypeAttribute, 'button' | 'submit' | 'hidden'>;
			hidden?: boolean;
			value?: never;
	  };

/**
 * Style to make the input element visually hidden
 * Based on the `sr-only` class from tailwindcss
 */
const hiddenStyle: CSSProperties = {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: 0,
	margin: '-1px',
	overflow: 'hidden',
	clip: 'rect(0,0,0,0)',
	whiteSpace: 'nowrap',
	border: 0,
};

export function input<Schema extends File | File[]>(
	config: FieldConfig<Schema>,
	options: { type: 'file' },
): InputProps<Schema>;
export function input<Schema extends any>(
	config: FieldConfig<Schema>,
	options?: InputOptions,
): InputProps<Schema>;
export function input<Schema>(
	config: FieldConfig<Schema>,
	options: InputOptions = {},
): InputProps<Schema> {
	const attributes: InputProps<Schema> = {
		id: config.id,
		type: options.type,
		name: config.name,
		form: config.form,
		required: config.required,
		minLength: config.minLength,
		maxLength: config.maxLength,
		min: config.min,
		max: config.max,
		step: config.step,
		pattern: config.pattern,
		multiple: config.multiple,
		'aria-invalid': Boolean(config.initialError?.length),
		'aria-describedby': config.errorId,
	};

	if (options?.hidden) {
		attributes.style = hiddenStyle;
		attributes.tabIndex = -1;
		attributes['aria-hidden'] = true;
	}

	if (config.initialError && config.initialError.length > 0) {
		attributes.autoFocus = true;
	}

	if (options.type === 'checkbox' || options.type === 'radio') {
		attributes.value = options.value ?? 'on';
		attributes.defaultChecked = config.defaultValue === attributes.value;
	} else if (options.type !== 'file') {
		attributes.defaultValue = config.defaultValue as string | undefined;
	}

	return attributes;
}

export function select<Schema>(
	config: FieldConfig<Schema>,
	options?: { hidden?: boolean },
): SelectProps {
	const attributes: SelectProps = {
		id: config.id,
		name: config.name,
		form: config.form,
		defaultValue: config.multiple
			? Array.isArray(config.defaultValue)
				? config.defaultValue
				: []
			: `${config.defaultValue ?? ''}`,
		required: config.required,
		multiple: config.multiple,
		'aria-invalid': Boolean(config.initialError?.length),
		'aria-describedby': config.errorId,
	};

	if (options?.hidden) {
		attributes.style = hiddenStyle;
		attributes.tabIndex = -1;
		attributes['aria-hidden'] = true;
	}

	if (config.initialError && config.initialError.length > 0) {
		attributes.autoFocus = true;
	}

	return attributes;
}

export function textarea<Schema>(
	config: FieldConfig<Schema>,
	options?: { hidden?: boolean },
): TextareaProps {
	const attributes: TextareaProps = {
		id: config.id,
		name: config.name,
		form: config.form,
		defaultValue: `${config.defaultValue ?? ''}`,
		required: config.required,
		minLength: config.minLength,
		maxLength: config.maxLength,
		autoFocus: Boolean(config.initialError),
		'aria-invalid': Boolean(config.initialError?.length),
		'aria-describedby': config.errorId,
	};

	if (options?.hidden) {
		attributes.style = hiddenStyle;
		attributes.tabIndex = -1;
		attributes['aria-hidden'] = true;
	}

	if (config.initialError && config.initialError.length > 0) {
		attributes.autoFocus = true;
	}

	return attributes;
}
