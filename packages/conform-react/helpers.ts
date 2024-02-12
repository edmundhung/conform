import type { FormMetadata, FieldMetadata, Metadata, Pretty } from './context';

type FormControlProps = {
	key: string | undefined;
	id: string;
	name: string;
	form: string;
	required?: boolean;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
};

type FormControlOptions =
	| {
			/**
			 * Decide whether to include `aria-invalid` and `aria-describedby` in the result.
			 */
			ariaAttributes?: true;
			/**
			 * Decide whether the aria-invalid attributes should be based on `meta.errors` or `meta.allErrors`.
			 * @default 'errors'
			 */
			ariaInvalid?: 'errors' | 'allErrors';
			/**
			 * Assign additional `id` to the `aria-describedby` attribute.
			 */
			ariaDescribedBy?: string;
	  }
	| {
			ariaAttributes: false;
	  };

type InputProps = Pretty<
	FormControlProps & {
		type:
			| 'checkbox'
			| 'color'
			| 'date'
			| 'datetime-local'
			| 'email'
			| 'file'
			| 'hidden'
			| 'month'
			| 'number'
			| 'password'
			| 'radio'
			| 'range'
			| 'search'
			| 'tel'
			| 'text'
			| 'time'
			| 'url'
			| 'week';
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
>;

type InputOptions = Pretty<
	FormControlOptions &
		(
			| {
					type: 'checkbox' | 'radio';
					/**
					 * The value of the checkbox or radio button. Pass `false` if you want to mange the checked state yourself.
					 * @default 'on'
					 */
					value?: string | boolean;
			  }
			| {
					type: Exclude<InputProps['type'], 'checkbox' | 'radio'>;

					/**
					 * Decide whether defaultValue should be returned. Pass `false` if you want to mange the value yourself.
					 */
					value?: boolean;
			  }
		)
>;

type SelectProps = Pretty<
	FormControlProps & {
		defaultValue?: string | number | readonly string[] | undefined;
		multiple?: boolean;
	}
>;

type SelectOptions = Pretty<
	FormControlOptions & {
		/**
		 * Decide whether defaultValue should be returned. Pass `false` if you want to mange the value yourself.
		 */
		value?: boolean;
	}
>;

type TextareaProps = Pretty<
	FormControlProps & {
		minLength?: number;
		maxLength?: number;
		defaultValue?: string;
	}
>;

type TextareaOptions = Pretty<
	FormControlOptions & {
		/**
		 * Decide whether defaultValue should be returned. Pass `false` if you want to mange the value yourself.
		 */
		value?: true;
	}
>;

/**
 * Cleanup `undefined` from the result.
 * To minimize conflicts when merging with user defined props
 */
function simplify<Props>(props: Props): Props {
	for (const key in props) {
		if (props[key] === undefined) {
			delete props[key];
		}
	}

	return props;
}

/**
 * Derives aria attributes of a form control based on the field metadata.
 */
export function getAriaAttributes(
	metadata: Metadata<any, any, any>,
	options: FormControlOptions = {},
): {
	'aria-invalid'?: boolean;
	'aria-describedby'?: string;
} {
	if (
		typeof options.ariaAttributes !== 'undefined' &&
		!options.ariaAttributes
	) {
		return {};
	}

	const invalid =
		options.ariaInvalid === 'allErrors'
			? !metadata.valid
			: typeof metadata.errors !== 'undefined';
	const ariaDescribedBy = options.ariaDescribedBy;

	return simplify({
		'aria-invalid': invalid || undefined,
		'aria-describedby': invalid
			? `${metadata.errorId} ${ariaDescribedBy ?? ''}`.trim()
			: ariaDescribedBy,
	});
}

/**
 * Derives the properties of a form element based on the form metadata,
 * including `id`, `onSubmit`, `noValidate`, `aria-invalid` and `aria-describedby`.
 *
 * @example
 * ```tsx
 * <form {...getFormProps(metadata)} />
 * ```
 */
export function getFormProps<Schema extends Record<string, any>, FormError>(
	metadata: FormMetadata<Schema, FormError>,
	options?: FormControlOptions,
) {
	return simplify({
		id: metadata.id,
		onSubmit: metadata.onSubmit,
		noValidate: metadata.noValidate,
		...getAriaAttributes(metadata, options),
	});
}

/**
 * Derives the properties of a fieldset element based on the field metadata,
 * including `id`, `name`, `form`, `aria-invalid` and `aria-describedby`.
 *
 * @example
 * ```tsx
 * <fieldset {...getFieldsetProps(metadata)} />
 * ```
 */
export function getFieldsetProps<
	Schema extends Record<string, any> | undefined | unknown,
>(metadata: FieldMetadata<Schema, any, any>, options?: FormControlOptions) {
	return simplify({
		id: metadata.id,
		name: metadata.name,
		form: metadata.formId,
		...getAriaAttributes(metadata, options),
	});
}

/**
 * Derives common properties of a form control based on the field metadata,
 * including `key`, `id`, `name`, `form`, `required`, `autoFocus`, `aria-invalid` and `aria-describedby`.
 */
export function getFormControlProps<Schema>(
	metadata: FieldMetadata<Schema, any, any>,
	options?: FormControlOptions,
): FormControlProps {
	return simplify({
		key: metadata.key,
		required: metadata.required || undefined,
		...getFieldsetProps(metadata, options),
	});
}

/**
 * Derives the properties of an input element based on the field metadata,
 * including common form control attributes like `key`, `id`, `name`, `form`, `autoFocus`, `aria-invalid`, `aria-describedby`
 * and constraint attributes such as `type`, `required`, `minLength`, `maxLength`, `min`, `max`, `step`, `pattern`, `multiple`.
 * Depends on the provided options, it will also set `defaultChecked` / `checked` if it is a checkbox or radio button,
 * or otherwise `defaultValue` / `value`.
 *
 * @see https://conform.guide/api/react/get-input-props
 * @example
 * ```tsx
 * // To setup an uncontrolled input
 * <input {...getInputProps(metadata, { type: 'text' })} />
 * // To setup an uncontrolled checkbox
 * <input {...getInputProps(metadata, { type: 'checkbox' })} />
 * // To setup an input without defaultValue
 * <input {...getInputProps(metadata, { value: false })} />
 * // To setup a radio button without defaultChecked state
 * <input {...getInputProps(metadata, { type: 'radio', value: false })} />
 * ```
 */
export function getInputProps<Schema>(
	metadata: FieldMetadata<Schema, any, any>,
	options: InputOptions,
): InputProps {
	const props: InputProps = {
		...getFormControlProps(metadata, options),
		type: options.type,
		minLength: metadata.minLength,
		maxLength: metadata.maxLength,
		min: metadata.min,
		max: metadata.max,
		step: metadata.step,
		pattern: metadata.pattern,
		multiple: metadata.multiple,
	};

	if (typeof options.value === 'undefined' || options.value) {
		if (options.type === 'checkbox' || options.type === 'radio') {
			props.value = typeof options.value === 'string' ? options.value : 'on';
			props.defaultChecked =
				typeof metadata.initialValue === 'boolean'
					? metadata.initialValue
					: metadata.initialValue === props.value;
		} else if (typeof metadata.initialValue === 'string') {
			props.defaultValue = metadata.initialValue;
		}
	}

	return simplify(props);
}

/**
 * Derives the properties of a select element based on the field metadata,
 * including common form control attributes like `key`, `id`, `name`, `form`, `autoFocus`, `aria-invalid`, `aria-describedby`
 * and constraint attributes such as `required` or `multiple`.
 * Depends on the provided options, it will also set `defaultValue` / `value`.
 *
 * @see https://conform.guide/api/react/get-select-props
 * @example
 * ```tsx
 * // To setup an uncontrolled select
 * <select {...getSelectProps(metadata)} />
 * // To setup a select without defaultValue
 * <select {...getSelectProps(metadata, { value: false })} />
 * ```
 */
export function getSelectProps<Schema>(
	metadata: FieldMetadata<Schema, any, any>,
	options: SelectOptions = {},
): SelectProps {
	const props: SelectProps = {
		...getFormControlProps(metadata, options),
		multiple: metadata.multiple,
	};

	if (typeof options.value === 'undefined' || options.value) {
		props.defaultValue = Array.isArray(metadata.initialValue)
			? metadata.initialValue.map((item: string | undefined) => `${item ?? ''}`)
			: metadata.initialValue?.toString();
	}

	return simplify(props);
}

/**
 * Derives the properties of a textarea element based on the field metadata,
 * including common form control attributes like `key`, `id`, `name`, `form`, `autoFocus`, `aria-invalid`, `aria-describedby`
 * and constraint attributes such as `required`, `minLength` or `maxLength`.
 * Depends on the provided options, it will also set `defaultValue` / `value`.
 *
 * @see https://conform.guide/api/react/get-textarea-props
 * @example
 * ```tsx
 * // To setup an uncontrolled textarea
 * <textarea {...getTextareaProps(metadata)} />
 * // To setup a textarea without defaultValue
 * <textarea {...getTextareaProps(metadata, { value: false })} />
 * ```
 */
export function getTextareaProps<Schema>(
	metadata: FieldMetadata<Schema, any, any>,
	options: TextareaOptions = {},
): TextareaProps {
	const props: TextareaProps = {
		...getFormControlProps(metadata, options),
		minLength: metadata.minLength,
		maxLength: metadata.maxLength,
	};

	if (typeof options.value === 'undefined' || options.value) {
		props.defaultValue = metadata.initialValue?.toString();
	}

	return simplify(props);
}

/**
 * Derives the properties of a collection of checkboxes or radio buttons based on the field metadata,
 * including common form control attributes like `key`, `id`, `name`, `form`, `autoFocus`, `aria-invalid`, `aria-describedby` and `required`.
 *
 * @see https://conform.guide/api/react/get-textarea-props
 * @example
 * ```tsx
 * <fieldset>
 *   {getCollectionProps(metadata, {
 *     type: 'checkbox',
 *     options: ['a', 'b', 'c']
 *   }).map((props) => (
 *     <div key={props.key}>
 *       <label htmlFor={props.id}>{props.value}</label>
 *       <input {...props} />
 *     </div>
 *  ))}
 * </fieldset>
 * ```
 */
export function getCollectionProps<
	Schema extends
		| Array<string | boolean>
		| string
		| boolean
		| undefined
		| unknown,
>(
	metadata: FieldMetadata<Schema, any, any>,
	options: Pretty<
		FormControlOptions & {
			/**
			 * The input type. Use `checkbox` for multiple selection or `radio` for single selection.
			 */
			type: 'checkbox' | 'radio';
			/**
			 * The `value` assigned to each input element.
			 */
			options: string[];
			/**
			 * Decide whether defaultValue should be returned. Pass `false` if you want to mange the value yourself.
			 */
			value?: boolean;
		}
	>,
): Array<InputProps & Pick<Required<InputProps>, 'type' | 'value'>> {
	return options.options.map((value) =>
		simplify({
			...getFormControlProps(metadata, options),
			key: `${metadata.key ?? ''}${value}`,
			id: `${metadata.id}-${value}`,
			type: options.type,
			value,
			defaultChecked:
				typeof options.value === 'undefined' || options.value
					? options.type === 'checkbox' && Array.isArray(metadata.initialValue)
						? metadata.initialValue.includes(value)
						: metadata.initialValue === value
					: undefined,

			// The required attribute doesn't make sense for checkbox group
			// As it would require all checkboxes to be checked instead of at least one
			// It is overriden with `undefiend` so it could be cleaned up properly
			required: options.type === 'checkbox' ? undefined : metadata.required,
		}),
	);
}
