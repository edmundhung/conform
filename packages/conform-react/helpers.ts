import {
	INTENT,
	VALIDATION_UNDEFINED,
	VALIDATION_SKIPPED,
} from '@conform-to/dom';
import type { FieldConfig, Primitive } from './hooks.js';
import type { CSSProperties, HTMLInputTypeAttribute } from 'react';

interface FormControlProps {
	id?: string;
	name: string;
	form?: string;
	required?: boolean;
	autoFocus?: boolean;
	tabIndex?: number;
	style?: CSSProperties;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
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
			ariaAttributes?: false;
			hidden?: boolean;
	  }
	| {
			ariaAttributes: true;
			description?: boolean;
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

function getFormControlProps(
	config: FieldConfig<any>,
	options?: BaseOptions,
): FormControlProps {
	const props: FormControlProps = {
		id: config.id,
		name: config.name,
		form: config.form,
		required: config.required,
		autoFocus:
			config.initialError && Object.entries(config.initialError).length > 0
				? true
				: undefined,
	};

	if (options?.ariaAttributes) {
		if (config.descriptionId && options?.description) {
			props['aria-describedby'] = config.descriptionId;
		}

		if (config.errorId && config.error?.length) {
			props['aria-invalid'] = true;
			props['aria-describedby'] =
				config.descriptionId && options?.description
					? `${config.errorId} ${config.descriptionId}`
					: config.errorId;
		}
	}

	return {
		...props,
		...(options?.hidden ? hiddenProps : {}),
	};
}

function cleanup<Props extends Object>(props: Props): Props {
	for (const key in props) {
		if (props[key] === undefined) {
			delete props[key];
		}
	}

	return props;
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
>(config: FieldConfig<Schema>, options?: BaseOptions): SelectProps {
	const props: SelectProps = {
		...getFormControlProps(config, options),
		defaultValue: config.defaultValue,
		multiple: config.multiple,
	};

	return cleanup(props);
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

	return cleanup(props);
}

export function collection<Schema extends Primitive[] | undefined | unknown>(
	config: FieldConfig<Schema>,
	options: BaseOptions & {
		type: 'checkbox' | 'radio';
		values: string[];
	},
): (InputProps<Schema> & Required<Pick<InputProps<Schema>, 'type'>>)[] {
	return options.values.map((value, index) =>
		cleanup({
			...getFormControlProps(config, options),
			id: config.id ? `${config.id}-${index}` : undefined,
			type: options.type,
			name: options.type === 'checkbox' ? `${config.name}[]` : config.name,
			value,
			defaultChecked: config.defaultValue?.includes(value) ?? false,
			minLength: config.minLength,
			maxLength: config.maxLength,
			min: config.min,
			max: config.max,
			step: config.step,
			pattern: config.pattern,
		}),
	);
}

export { INTENT, VALIDATION_UNDEFINED, VALIDATION_SKIPPED };
