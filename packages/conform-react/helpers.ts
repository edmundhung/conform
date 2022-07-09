import { type FieldConfig } from '@conform-to/dom';
import {
	type InputHTMLAttributes,
	type SelectHTMLAttributes,
	type TextareaHTMLAttributes,
} from 'react';

export function input<
	Type extends string | number | Date | boolean | undefined,
>(
	config: FieldConfig<Type>,
	{ type, value }: { type?: string; value?: string } = {},
): InputHTMLAttributes<HTMLInputElement> {
	const isCheckboxOrRadio = type === 'checkbox' || type === 'radio';
	const attributes: InputHTMLAttributes<HTMLInputElement> = {
		type,
		name: config.name,
		form: config.form,
		required: config.constraint?.required,
		minLength: config.constraint?.minLength,
		maxLength: config.constraint?.maxLength,
		min: config.constraint?.min,
		max: config.constraint?.max,
		step: config.constraint?.step,
		pattern: config.constraint?.pattern,
		multiple: config.constraint?.multiple,
	};

	if (isCheckboxOrRadio) {
		attributes.value = value ?? 'on';
		attributes.defaultChecked = config.initialValue === attributes.value;
	} else {
		attributes.defaultValue = `${config.initialValue ?? ''}`;
	}

	return attributes;
}

export function select<T extends any>(
	config: FieldConfig<T>,
): SelectHTMLAttributes<HTMLSelectElement> {
	return {
		name: config.name,
		form: config.form,
		defaultValue: `${config.initialValue ?? ''}`,
		required: config.constraint?.required,
		multiple: config.constraint?.multiple,
	};
}

export function textarea<T extends string | undefined>(
	config: FieldConfig<T>,
): TextareaHTMLAttributes<HTMLTextAreaElement> {
	return {
		name: config.name,
		form: config.form,
		defaultValue: `${config.initialValue ?? ''}`,
		required: config.constraint?.required,
		minLength: config.constraint?.minLength,
		maxLength: config.constraint?.maxLength,
	};
}
