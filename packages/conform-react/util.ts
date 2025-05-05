import { unstable_updateFieldValue as updateFieldValue } from '@conform-to/dom';

export function normalizeFieldValue(
	value: string | string[] | File | File[] | null | undefined,
): string[] | File[] | null {
	if (typeof value === 'undefined' || value === null) {
		return null;
	}

	if (Array.isArray(value)) {
		return value;
	}

	return [value] as string[] | File[];
}

export function focusable(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): void {
	if (!element.hidden) {
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

	// Make sure people won't tab to this element
	element.tabIndex = -1;

	// Set the element to be visible again so it can be focused
	element.hidden = false;
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

	if (element.type === 'checkbox' || element.type === 'radio') {
		// React set the value as empty string incorrectly when the value is undefined
		// This make sure the checkbox value falls back to the default value "on" properly
		// @see https://github.com/facebook/react/issues/17590
		element.value = options?.value ?? 'on';
	}

	const value =
		typeof options?.defaultChecked !== 'undefined'
			? options.defaultChecked
				? options.value ?? 'on'
				: null
			: options?.defaultValue ?? null;

	// Update the value of the element, including the default value
	updateFieldValue(element, value, { defaultValue: true });

	element.dataset.conform = 'initialized';
}
