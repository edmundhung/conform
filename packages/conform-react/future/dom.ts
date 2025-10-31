import {
	change,
	getFieldDefaultValue,
	getValueAtPath,
	isFieldElement,
	isGlobalInstance,
	requestIntent,
	Serialize,
	updateField,
} from '@conform-to/dom/future';
import type {
	ErrorContext,
	FormRef,
	InputSnapshot,
	IntentDispatcher,
} from './types';
import { serializeIntent } from './intent';

export function getFormElement(
	formRef: FormRef | undefined,
): HTMLFormElement | null {
	if (typeof formRef === 'string') {
		return document.forms.namedItem(formRef);
	}

	const element = formRef?.current;

	if (element instanceof HTMLFormElement) {
		return element;
	}

	return element?.form ?? null;
}

export function getSubmitEvent(
	event: React.FormEvent<HTMLFormElement>,
): SubmitEvent {
	if (event.type !== 'submit') {
		throw new Error('The event is not a submit event');
	}

	return event.nativeEvent as SubmitEvent;
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

/**
 * Makes hidden form inputs focusable with visually hidden styles
 */
export function makeInputFocusable(
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

export function getInputSnapshot(
	input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): InputSnapshot {
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

/**
 * Creates an InputSnapshot based on the provided options:
 * - checkbox/radio: value / defaultChecked
 * - file inputs: defaultValue is File or FileList
 * - select multiple: defaultValue is string array
 * - others: defaultValue is string
 */
export function createDefaultSnapshot(
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

/**
 * Focuses the first field with validation errors on default form submission.
 * Does nothing if the submission was triggered with a specific intent (e.g. validate / insert)
 */
export function focusFirstInvalidField<ErrorShape>(
	ctx: ErrorContext<ErrorShape>,
) {
	if (ctx.intent) {
		return;
	}

	for (const element of ctx.formElement.elements) {
		if (
			isFieldElement(element) &&
			ctx.error.fieldErrors[element.name]?.length
		) {
			element.focus();
			break;
		}
	}
}

export function updateFormValue(
	form: HTMLFormElement,
	targetValue: Record<string, unknown>,
	serialize: Serialize,
): void {
	for (const element of form.elements) {
		if (isFieldElement(element) && element.name) {
			const fieldValue = getValueAtPath(targetValue, element.name);

			if (element.type === 'file' && typeof fieldValue === 'undefined') {
				// Do not update file inputs unless there's a target value
				continue;
			}

			const serializedValue = serialize(fieldValue);
			const value =
				typeof serializedValue !== 'undefined'
					? serializedValue
					: getFieldDefaultValue(element);

			change(element, value, {
				preventDefault: true,
			});
		}
	}
}

/**
 * Creates a proxy that dynamically generates intent dispatch functions.
 * Each property access returns a function that submits the intent to the form.
 */
export function createIntentDispatcher<FormShape extends Record<string, any>>(
	formElement: HTMLFormElement | (() => HTMLFormElement | null),
	intentName: string,
) {
	return new Proxy<IntentDispatcher<FormShape>>({} as any, {
		get(target, type, receiver) {
			if (typeof type === 'string') {
				// @ts-expect-error
				target[type] ??= (payload?: unknown) => {
					const form =
						typeof formElement === 'function' ? formElement() : formElement;

					if (!form) {
						throw new Error(
							`Dispatching "${type}" intent failed; No form element found.`,
						);
					}

					requestIntent(
						form,
						intentName,
						serializeIntent({
							type,
							payload,
						}),
					);
				};
			}

			return Reflect.get(target, type, receiver);
		},
	});
}
