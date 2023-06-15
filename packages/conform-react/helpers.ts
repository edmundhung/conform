import {
	INTENT,
	VALIDATION_UNDEFINED,
	VALIDATION_SKIPPED,
} from '@conform-to/dom';
import type { FieldConfig, Primitive } from './hooks.js';
import type { CSSProperties, HTMLInputTypeAttribute } from 'react';

interface FormControlProps extends Partial<HiddenProps> {
	id?: string;
	name: string;
	form?: string;
	required?: boolean;
	autoFocus?: boolean;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
}

interface HiddenProps {
	tabIndex: number;
	style: CSSProperties;
	'aria-hidden': boolean;
}

interface InputProps<Schema> extends FormControlProps {
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

interface SelectProps extends FormControlProps {
	defaultValue?: string | number | readonly string[] | undefined;
	multiple?: boolean;
}

interface TextareaProps extends FormControlProps {
	minLength?: number;
	maxLength?: number;
	defaultValue?: string;
}

type BaseOptions = {
	description?: boolean;
	ariaAttributes?: boolean;
	hidden?: boolean;
};

type InputOptions = BaseOptions &
	(
		| {
				type: 'checkbox' | 'radio';
				value?: string;
		  }
		| {
				type?: Exclude<HTMLInputTypeAttribute, 'button' | 'submit' | 'hidden'>;
				value?: never;
		  }
	);

export function descriptionId<Config extends { id?: string }>(
	config: Config,
): string | undefined {
	return config.id ? `${config.id}-description` : undefined;
}

export function errorId<Config extends { id?: string }>(
	config: Config,
): string | undefined {
	return config.id ? `${config.id}-error` : undefined;
}

export function autoFocus(config: FieldConfig<any>): boolean {
	return Object.entries(config.initialError ?? {}).length > 0;
}

export const hiddenProps: HiddenProps = {
	/**
	 * Style to make the input element visually hidden
	 * Based on the `sr-only` class from tailwindcss
	 */
	style: {
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: 0,
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0,0,0,0)',
		whiteSpace: 'nowrap',
		border: 0,
	},
	tabIndex: -1,
	'aria-hidden': true,
};

function getFormControlProps(
	config: FieldConfig<any>,
	options?: BaseOptions,
): FormControlProps {
	const props: FormControlProps = {
		id: config.id,
		name: config.name,
		form: config.form,
		required: config.required,
	};

	if (autoFocus(config)) {
		props.autoFocus = true;
	}

	const error = errorId(config);

	if (error && options?.ariaAttributes) {
		const description = options?.description
			? descriptionId(config)
			: undefined;

		if (config.id && config.error) {
			props['aria-invalid'] = true;
			props['aria-describedby'] = description
				? `${error} ${description}`
				: `${error}`;
		} else if (description) {
			props['aria-describedby'] = description;
		}
	}

	if (options?.hidden) {
		props.style = hiddenProps.style;
		props.tabIndex = hiddenProps.tabIndex;
		props['aria-hidden'] = hiddenProps['aria-hidden'];
	}

	return props;
}

export function input<Schema extends Primitive | unknown>(
	config: FieldConfig<Schema>,
	options?: InputOptions,
): InputProps<Schema>;
export function input<Schema extends File | File[]>(
	config: FieldConfig<Schema>,
	options: InputOptions & { type: 'file' },
): InputProps<Schema>;
export function input<Schema extends Primitive | File | File[] | unknown>(
	config: FieldConfig<Schema>,
	options: InputOptions = {},
): InputProps<Schema> {
	const props: InputProps<Schema> = {
		...getFormControlProps(config, options),
		type: options.type,
		minLength: config.minLength,
		maxLength: config.maxLength,
		min: config.min,
		max: config.max,
		step: config.step,
		pattern: config.pattern,
		multiple: config.multiple,
	};

	if (options.type === 'checkbox' || options.type === 'radio') {
		props.value = options.value ?? 'on';
		props.defaultChecked = config.defaultValue === props.value;
	} else if (options.type !== 'file') {
		props.defaultValue = config.defaultValue as string | undefined;
	}

	return props;
}

export function select<
	Schema extends Primitive | Primitive[] | undefined | unknown,
>(config: FieldConfig<Schema>, options?: BaseOptions): SelectProps {
	const props: SelectProps = {
		...getFormControlProps(config, options),
		defaultValue: config.defaultValue,
		multiple: config.multiple,
	};

	return props;
}

export function textarea<Schema extends Primitive | undefined | unknown>(
	config: FieldConfig<Schema>,
	options?: BaseOptions,
): TextareaProps {
	const props: TextareaProps = {
		...getFormControlProps(config, options),
		defaultValue: config.defaultValue,
		minLength: config.minLength,
		maxLength: config.maxLength,
	};

	return props;
}

export { INTENT, VALIDATION_UNDEFINED, VALIDATION_SKIPPED };
