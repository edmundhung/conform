import {
	isGlobalInstance,
	unstable_updateField as updateField,
} from '@conform-to/dom';

export function focusable(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): void {
	if (!element.hidden && element.type !== 'hidden') {
		return;
	}

	// Style the element to be visually hidden
	element.style.position = 'absolute';
	element.style.width = '1px';
	element.style.height = '1px';
	element.style.padding = '0';
	element.style.margin = '-1px';
	element.style.overflow = 'hidden';
	element.style.clip = 'rect(0,0,0,0)';
	element.style.whiteSpace = 'nowrap';
	element.style.border = '0';

	// Hide the element from screen readers
	element.setAttribute('aria-hidden', 'true');

	// Make sure people won't tab to this element
	element.tabIndex = -1;

	// Set the element to be visible again so it can be focused
	if (element.hidden) {
		element.hidden = false;
	}

	if (element.type === 'hidden') {
		element.setAttribute('type', 'text');
	}
}

export function initializeField(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	options:
		| {
				defaultValue?: string | string[] | File | File[] | null;
				defaultChecked?: boolean;
				value?: string;
		  }
		| undefined,
): void {
	if (element.dataset.conform) {
		return;
	}

	const defaultValue =
		typeof options?.value === 'string' ||
		typeof options?.defaultChecked === 'boolean'
			? options.defaultChecked
				? options.value ?? 'on'
				: null
			: options?.defaultValue;

	// Update the value of the element, including the default value
	updateField(element, { value: defaultValue, defaultValue });

	element.dataset.conform = 'initialized';
}

export function getRadioGroupValue(
	inputs: Array<HTMLInputElement>,
): string | undefined {
	for (const input of inputs) {
		if (input.type === 'radio' && input.checked) {
			return input.value;
		}
	}
}

export function getCheckboxGroupValue(
	inputs: Array<HTMLInputElement>,
): string[] | undefined {
	let values: string[] | undefined;

	for (const input of inputs) {
		if (input.type === 'checkbox') {
			values ??= [];
			if (input.checked) {
				values.push(input.value);
			}
		}
	}

	return values;
}

export type InputSnapshot = {
	value?: string;
	options?: string[];
	checked?: boolean;
	files?: File[];
};

export function getInputSnapshot(
	input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
) {
	if (input instanceof HTMLInputElement) {
		switch (input.type) {
			case 'file':
				return {
					files: input.files ? Array.from(input.files) : undefined,
				};
			case 'radio':
			case 'checkbox':
				return {
					value: input.value,
					checked: input.checked,
				};
		}
	} else if (input instanceof HTMLSelectElement && input.multiple) {
		return {
			options: Array.from(input.selectedOptions).map((option) => option.value),
		};
	}

	return {
		value: input.value,
	};
}

export function getDefaultSnapshot(
	defaultValue: string | string[] | File | File[] | FileList | null | undefined,
	defaultChecked: boolean | undefined,
	value: string | undefined,
): InputSnapshot {
	if (typeof value === 'string' || typeof defaultChecked === 'boolean') {
		return {
			value: value ?? 'on',
			checked: defaultChecked,
		};
	}

	if (typeof defaultValue === 'string') {
		return { value: defaultValue };
	}

	if (Array.isArray(defaultValue)) {
		if (
			defaultValue.every((item): item is string => typeof item === 'string')
		) {
			return { options: defaultValue };
		} else {
			return { files: defaultValue };
		}
	}

	if (isGlobalInstance(defaultValue, 'File')) {
		return { files: [defaultValue] };
	}

	if (isGlobalInstance(defaultValue, 'FileList')) {
		return { files: Array.from(defaultValue) };
	}

	return {};
}
