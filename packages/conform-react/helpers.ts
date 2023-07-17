import {
	INTENT,
	VALIDATION_UNDEFINED,
	VALIDATION_SKIPPED,
} from '@conform-to/dom';
import type { FieldConfig, Primitive } from './hooks.js';
import type { CSSProperties, HTMLInputTypeAttribute } from 'react';

interface FormElementProps {
	id?: string;
	name: string;
	form?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
}

interface FormControlProps extends FormElementProps {
	required?: boolean;
	autoFocus?: boolean;
	tabIndex?: number;
	style?: CSSProperties;
	'aria-hidden'?: boolean;
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

type BaseOptions =
	| {
			ariaAttributes?: true;
			description?: boolean;
	  }
	| {
			ariaAttributes: false;
	  };

type ControlOptions = BaseOptions & {
	hidden?: boolean;
};

type InputOptions = ControlOptions &
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

/**
 * Cleanup `undefined` from the dervied props
 * To minimize conflicts when merging with user defined props
 */
function cleanup<Props>(props: Props): Props {
	for (const key in props) {
		if (props[key] === undefined) {
			delete props[key];
		}
	}

	return props;
}

function getFormElementProps(
	config: FieldConfig<unknown>,
	options: BaseOptions = {},
): FormElementProps {
	const hasAriaAttributes = options.ariaAttributes ?? true;

	return cleanup({
		id: config.id,
		name: config.name,
		form: config.form,
		'aria-invalid':
			hasAriaAttributes && config.errorId && config.error?.length
				? true
				: undefined,
		'aria-describedby': hasAriaAttributes
			? [
					config.errorId && config.error?.length ? config.errorId : undefined,
					config.descriptionId &&
					options.ariaAttributes !== false &&
					options.description
						? config.descriptionId
						: undefined,
			  ].reduce((result, id) => {
					if (!result) {
						return id;
					}

					if (!id) {
						return result;
					}

					return `${result} ${id}`;
			  })
			: undefined,
	});
}

function getFormControlProps(
	config: FieldConfig<unknown>,
	options?: ControlOptions,
): FormControlProps {
	return cleanup({
		...getFormElementProps(config, options),
		required: config.required,
		autoFocus:
			config.initialError && Object.entries(config.initialError).length > 0
				? true
				: undefined,
		...(options?.hidden ? hiddenProps : undefined),
	});
}

export const hiddenProps: {
	style: CSSProperties;
	tabIndex: number;
	'aria-hidden': boolean;
} = {
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

	return cleanup(props);
}

export function select<
	Schema extends Primitive | Primitive[] | undefined | unknown,
>(config: FieldConfig<Schema>, options?: ControlOptions): SelectProps {
	return cleanup({
		...getFormControlProps(config, options),
		defaultValue: config.defaultValue,
		multiple: config.multiple,
	});
}

export function textarea<Schema extends Primitive | undefined | unknown>(
	config: FieldConfig<Schema>,
	options?: ControlOptions,
): TextareaProps {
	return cleanup({
		...getFormControlProps(config, options),
		defaultValue: config.defaultValue,
		minLength: config.minLength,
		maxLength: config.maxLength,
	});
}

export function fieldset<
	Schema extends Record<string, unknown> | undefined | unknown,
>(config: FieldConfig<Schema>, options?: BaseOptions): FormControlProps {
	return getFormElementProps(config, options);
}

export { INTENT, VALIDATION_UNDEFINED, VALIDATION_SKIPPED };
