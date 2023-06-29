import {
	INTENT,
	VALIDATION_UNDEFINED,
	VALIDATION_SKIPPED,
} from '@conform-to/dom';
import type { FieldConfig, Primitive } from './hooks.js';
import type { CSSProperties } from 'react';

type FormControlOptionalKeys =
	| 'id'
	| 'form'
	| 'required'
	| 'autoFocus'
	| 'tabIndex'
	| 'style'
	| 'aria-describedby'
	| 'aria-invalid'
	| 'aria-hidden';

type FormControlRequiredKeys = 'name';

type InputProps = Pick<
	React.ComponentPropsWithoutRef<'input'>,
	| FormControlOptionalKeys
	| 'type'
	| 'minLength'
	| 'maxLength'
	| 'min'
	| 'max'
	| 'step'
	| 'pattern'
	| 'multiple'
	| 'value'
	| 'defaultChecked'
	| 'defaultValue'
> &
	Required<
		Pick<React.ComponentPropsWithoutRef<'input'>, FormControlRequiredKeys>
	>;

type SelectProps = Pick<
	React.ComponentPropsWithoutRef<'select'>,
	FormControlOptionalKeys | 'defaultValue' | 'multiple'
> &
	Required<
		Pick<React.ComponentPropsWithoutRef<'select'>, FormControlRequiredKeys>
	>;

type TextareaProps = Pick<
	React.ComponentPropsWithoutRef<'textarea'>,
	FormControlOptionalKeys | 'minLength' | 'maxLength' | 'defaultValue'
> &
	Required<
		Pick<React.ComponentPropsWithoutRef<'textarea'>, FormControlRequiredKeys>
	>;

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
				id?: string;
		  }
		| {
				type?: Exclude<InputProps['type'], 'button' | 'submit' | 'hidden'>;
				value?: never;
				id?: never;
		  }
	);

function getFormControlProps<
	Schema,
	Tag extends 'input' | 'select' | 'textarea',
>(
	config: FieldConfig<Schema>,
	_tag: Tag,
	options?: BaseOptions,
): Pick<React.ComponentPropsWithoutRef<Tag>, FormControlOptionalKeys> &
	Required<Pick<React.ComponentPropsWithoutRef<Tag>, FormControlRequiredKeys>> {
	const props: Pick<
		React.ComponentPropsWithoutRef<Tag>,
		FormControlOptionalKeys
	> &
		Required<
			Pick<React.ComponentPropsWithoutRef<Tag>, FormControlRequiredKeys>
		> = {
		id: config.id,
		name: config.name,
		form: config.form,
		required: config.required,
		autoFocus:
			config.initialError && Object.keys(config.initialError).length > 0
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
		...(options?.hidden ? hiddenProps : undefined),
	};
}

function cleanup<Props extends object>(props: Props): Props {
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
): InputProps;
export function input<Schema extends File | File[]>(
	config: FieldConfig<Schema>,
	options: InputOptions & { type: 'file' },
): InputProps;
export function input<Schema extends Primitive | File | File[] | unknown>(
	config: FieldConfig<Schema>,
	options: InputOptions = {},
): InputProps {
	switch (options.type) {
		case 'checkbox':
		case 'radio': {
			const value = options.value ?? 'on';
			return cleanup({
				...getFormControlProps(config, 'input', options),
				id: options.id ?? config.id,
				defaultChecked: config.defaultValue === value,
				max: config.max,
				maxLength: config.maxLength,
				min: config.min,
				minLength: config.minLength,
				multiple: config.multiple,
				pattern: config.pattern,
				step: config.step,
				type: options.type,
				value,
			});
		}
		case 'file':
			return cleanup({
				...getFormControlProps(config, 'input', options),
				max: config.max,
				maxLength: config.maxLength,
				min: config.min,
				minLength: config.minLength,
				multiple: config.multiple,
				pattern: config.pattern,
				step: config.step,
				type: options.type,
			});
		default:
			return cleanup({
				...getFormControlProps(config, 'input', options),
				defaultValue: config.defaultValue,
				max: config.max,
				maxLength: config.maxLength,
				min: config.min,
				minLength: config.minLength,
				multiple: config.multiple,
				pattern: config.pattern,
				step: config.step,
				type: options.type,
			});
	}
}

export function select<
	Schema extends Primitive | Primitive[] | undefined | unknown,
>(config: FieldConfig<Schema>, options?: BaseOptions): SelectProps {
	return cleanup({
		...getFormControlProps(config, 'select', options),
		defaultValue: config.defaultValue,
		multiple: config.multiple,
	});
}

export function textarea<Schema extends Primitive | undefined | unknown>(
	config: FieldConfig<Schema>,
	options?: BaseOptions,
): TextareaProps {
	return cleanup({
		...getFormControlProps(config, 'textarea', options),
		defaultValue: config.defaultValue,
		minLength: config.minLength,
		maxLength: config.maxLength,
	});
}

export { INTENT, VALIDATION_UNDEFINED, VALIDATION_SKIPPED };
