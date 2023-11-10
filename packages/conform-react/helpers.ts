import type { CSSProperties, HTMLInputTypeAttribute } from 'react';
import type { FieldConfig, BaseConfig } from './context';
import type { FormConfig } from './hooks';

interface FormControlProps {
	id: string;
	name: string;
	form: string;
	required?: boolean;
	autoFocus?: boolean;
	tabIndex?: number;
	style?: CSSProperties;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
	'aria-hidden'?: boolean;
}

interface InputProps extends FormControlProps {
	type?: Exclude<HTMLInputTypeAttribute, 'submit' | 'reset' | 'button'>;
	minLength?: number;
	maxLength?: number;
	min?: string | number;
	max?: string | number;
	step?: string | number;
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

type Primitive = string | number | boolean | Date | null | undefined;

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

type FormOptions<Type extends Record<string, any>> = BaseOptions & {
	onSubmit?: (
		event: React.FormEvent<HTMLFormElement>,
		context: ReturnType<FormConfig<Type>['onSubmit']>,
	) => void;
	onReset?: (event: React.FormEvent<HTMLFormElement>) => void;
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

function getAriaAttributes<Config extends BaseConfig<unknown>>(
	config: Config,
	options: BaseOptions = {},
) {
	const hasAriaAttributes = options.ariaAttributes ?? true;

	return cleanup({
		'aria-invalid':
			(hasAriaAttributes && config.errorId && !config.valid) || undefined,
		'aria-describedby': hasAriaAttributes
			? [
					config.errorId && !config.valid ? config.errorId : undefined,
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
) {
	return cleanup({
		id: config.id,
		name: config.name,
		form: config.formId,
		required: config.constraint.required,
		// FIXME: something to differentiate if the form is reloaded
		autoFocus: false,
		...(options?.hidden ? hiddenProps : undefined),
		...getAriaAttributes(config, options),
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
	field: FieldConfig<Schema>,
	options?: InputOptions,
): InputProps;
export function input<Schema extends File | File[]>(
	field: FieldConfig<Schema>,
	options: InputOptions & { type: 'file' },
): InputProps;
export function input<Schema extends Primitive | File | File[] | unknown>(
	field: FieldConfig<Schema>,
	options: InputOptions = {},
): InputProps {
	const props: InputProps = {
		...getFormControlProps(field, options),
		type: options.type,
		minLength: field.constraint.minLength,
		maxLength: field.constraint.maxLength,
		min: field.constraint.min,
		max: field.constraint.max,
		step: field.constraint.step,
		pattern: field.constraint.pattern,
		multiple: field.constraint.multiple,
	};

	if (options.type === 'checkbox' || options.type === 'radio') {
		props.value = options.value ?? 'on';
		props.defaultChecked =
			typeof field.defaultValue === 'boolean'
				? field.defaultValue
				: field.defaultValue === props.value;
	} else if (options.type !== 'file') {
		props.defaultValue = `${field.defaultValue ?? ''}`;
	}

	return cleanup(props);
}

export function select<
	Schema extends Primitive | Primitive[] | undefined | unknown,
>(field: FieldConfig<Schema>, options?: ControlOptions): SelectProps {
	return cleanup({
		...getFormControlProps(field, options),
		defaultValue: Array.isArray(field.defaultValue)
			? field.defaultValue
			: `${field.defaultValue ?? ''}`,
		multiple: field.constraint.multiple,
	});
}

export function textarea<Schema extends Primitive | undefined | unknown>(
	field: FieldConfig<Schema>,
	options?: ControlOptions,
): TextareaProps {
	return cleanup({
		...getFormControlProps(field, options),
		defaultValue: `${field.defaultValue ?? ''}`,
		minLength: field.constraint.minLength,
		maxLength: field.constraint.maxLength,
	});
}

export function form<Type extends Record<string, any>>(
	config: FormConfig<Type>,
	options?: FormOptions<Type>,
) {
	const onSubmit = options?.onSubmit;
	const onReset = options?.onReset;

	return cleanup({
		id: config.id,
		onSubmit:
			typeof onSubmit !== 'function'
				? config.onSubmit
				: (event: React.FormEvent<HTMLFormElement>) => {
						const context = config.onSubmit(event);

						if (!event.defaultPrevented) {
							onSubmit(event, context);
						}
				  },
		onReset:
			typeof onReset !== 'function'
				? config.onReset
				: (event: React.FormEvent<HTMLFormElement>) => {
						config.onReset(event);
						onReset(event);
				  },
		noValidate: config.noValidate,
		...getAriaAttributes(config, options),
	});
}

export function fieldset<
	Schema extends Record<string, any> | undefined | unknown,
>(field: FieldConfig<Schema>, options?: BaseOptions) {
	return cleanup({
		id: field.id,
		name: field.name,
		form: field.formId,
		...getAriaAttributes(field, options),
	});
}

export function collection<
	Schema extends
		| Array<string | boolean>
		| string
		| boolean
		| undefined
		| unknown,
>(
	field: FieldConfig<Schema>,
	options: BaseOptions & {
		type: 'checkbox' | 'radio';
		options: string[];
	},
): Array<InputProps & Pick<Required<InputProps>, 'type' | 'value'>> {
	return options.options.map((value) =>
		cleanup({
			...getFormControlProps(field, options),
			id: `${field.id}-${value}`,
			type: options.type,
			value,
			defaultChecked:
				options.type === 'checkbox' && Array.isArray(field.defaultValue)
					? field.defaultValue.includes(value)
					: field.defaultValue === value,

			// The required attribute doesn't make sense for checkbox group
			// As it would require all checkboxes to be checked instead of at least one
			// It is overriden with `undefiend` so it could be cleaned upW properly
			required:
				options.type === 'checkbox' ? undefined : field.constraint.required,
		}),
	);
}
