import {
	change,
	focus,
	getPathValue,
	isFieldElement,
	isGlobalInstance,
	requestIntent,
	Serialize,
	setPathValue,
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
				defaultValue?: string | string[] | File | File[] | null | undefined;
				defaultChecked?: boolean | undefined;
				value?: string | undefined;
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

	// Use change helper to set value and dispatch events
	// This syncs React's internal value tracker so subsequent
	// programmatic changes will properly trigger onChange
	if (defaultValue !== undefined) {
		change(element, defaultValue, {
			// To avoid triggering validation on initialization
			preventDefault: true,
		});
	}

	// Set the default value after change to preserve it for form reset
	updateField(element, { defaultValue });

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

export function getInputSnapshot(
	input:
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| HTMLFieldSetElement,
): InputSnapshot {
	if (input instanceof HTMLInputElement) {
		switch (input.type) {
			case 'file': {
				const files = input.files ? Array.from(input.files) : undefined;

				return {
					files,
					payload: files,
				};
			}
			case 'radio':
			case 'checkbox':
				return {
					value: input.value,
					checked: input.checked,
					payload: input.checked ? input.value : null,
				};
		}
	} else if (input instanceof HTMLSelectElement && input.multiple) {
		const options = Array.from(input.selectedOptions).map(
			(option) => option.value,
		);
		return {
			options,
			payload: options,
		};
	} else if (input instanceof HTMLFieldSetElement) {
		const result = {};

		for (const element of input.elements) {
			if (isFieldElement(element) && !element.disabled) {
				setPathValue(result, element.name, getInputSnapshot(element).payload);
			}
		}

		return {
			payload: getPathValue(result, input.name),
		};
	}

	return {
		value: input.value,
		payload: input.value,
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
			payload: defaultChecked ? value ?? 'on' : null,
		};
	}

	if (typeof defaultValue === 'string') {
		return { value: defaultValue, payload: defaultValue };
	}

	if (Array.isArray(defaultValue)) {
		if (
			defaultValue.every((item): item is string => typeof item === 'string')
		) {
			return { options: defaultValue, payload: defaultValue };
		} else {
			return { files: defaultValue, payload: defaultValue };
		}
	}

	if (isGlobalInstance(defaultValue, 'File')) {
		const files = [defaultValue];
		return { files, payload: files };
	}

	if (isGlobalInstance(defaultValue, 'FileList')) {
		const files = Array.from(defaultValue);
		return { files, payload: files };
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
			if (element.hidden || element.type === 'hidden') {
				focus(element);
			} else {
				element.focus();
			}
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
		if (isFieldElement(element) && element.name && element.type !== 'hidden') {
			const fieldValue = getPathValue(targetValue, element.name);

			if (element.type === 'file' && fieldValue === undefined) {
				// Do not update file inputs unless there's a target value
				continue;
			}

			const value = serialize(fieldValue);

			// Treat undefined as null to clear the field value
			change(element, value !== undefined ? value : null, {
				preventDefault: true,
			});
		}
	}
}

export function resetFormValue(
	form: HTMLFormElement,
	defaultValue: Record<string, unknown>,
	serialize: Serialize,
): void {
	for (const element of form.elements) {
		if (
			isFieldElement(element) &&
			element.name &&
			element.type !== 'hidden' &&
			element.type !== 'file'
		) {
			const fieldValue = getPathValue(defaultValue, element.name);
			const value = serialize(fieldValue);

			updateField(element, {
				defaultValue: value !== undefined ? value : null,
			});
		}
	}

	form.reset();
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

const PERSIST_ATTR = 'data-conform-persist';
const containerCache = new WeakMap<HTMLFormElement, HTMLDivElement>();

/**
 * Gets or creates a hidden container for persisted inputs.
 * Using a container div instead of appending directly to <form> provides ~10x
 * better performance (form.elements bookkeeping is expensive at scale).
 */
function getPersistContainer(form: HTMLFormElement): HTMLDivElement {
	let container = containerCache.get(form);

	// Verify container is still attached to the form
	if (container && container.parentNode !== form) {
		container = undefined;
	}

	if (!container) {
		container = form.ownerDocument.createElement('div');
		container.setAttribute(PERSIST_ATTR, '');
		container.hidden = true;
		form.appendChild(container);
		containerCache.set(form, container);
	}

	return container;
}

/**
 * Restores values from preserved inputs and removes them.
 * Called when PreserveBoundary mounts.
 */
export function cleanupPreservedInputs(
	boundary: HTMLElement,
	form: HTMLFormElement,
	name?: string,
): void {
	const inputs = boundary.querySelectorAll<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
	>('input,select,textarea');
	const container = getPersistContainer(form);

	for (const input of inputs) {
		if (!isFieldElement(input) || !input.name) {
			continue;
		}

		// For checkbox/radio, match by field name + value (+ boundary name if provided)
		// For other inputs, match by field name only (+ boundary name if provided)
		const isCheckboxOrRadio =
			input.type === 'checkbox' || input.type === 'radio';

		// Query the persist container, not the whole form
		const boundarySelector = name ? `[${PERSIST_ATTR}="${name}"]` : '';
		const selector = isCheckboxOrRadio
			? `${boundarySelector}[name="${input.name}"][value="${input.value}"]`
			: `${boundarySelector}[name="${input.name}"]`;

		const persisted = container.querySelector<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>(selector);

		if (persisted) {
			if (
				input instanceof HTMLInputElement &&
				persisted instanceof HTMLInputElement
			) {
				if (isCheckboxOrRadio) {
					input.checked = persisted.checked;
				} else if (input.type === 'file') {
					// Restore files from the persisted input (may be empty)
					input.files = persisted.files;
				} else {
					input.value = persisted.value;
				}
			} else if (
				input instanceof HTMLSelectElement &&
				persisted instanceof HTMLSelectElement
			) {
				for (const option of input.options) {
					const persistedOption = Array.from(persisted.options).find(
						(o) => o.value === option.value,
					);
					option.selected = persistedOption?.selected ?? false;
				}
			} else if (
				input instanceof HTMLTextAreaElement &&
				persisted instanceof HTMLTextAreaElement
			) {
				input.value = persisted.value;
			}

			persisted.remove();
		}
	}

	// If name is provided, remove any remaining persisted inputs with this name
	// (handles the case where inputs were removed from the boundary)
	if (name) {
		const remainingPersisted = container.querySelectorAll(
			`[${PERSIST_ATTR}="${name}"]`,
		);
		remainingPersisted.forEach((el) => el.remove());
	}
}

/**
 * Clones inputs as hidden elements to preserve their values.
 * Called when PreserveBoundary unmounts.
 */
export function preserveInputs(
	inputs: Iterable<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
	form: HTMLFormElement,
	name?: string,
): void {
	// Get the persist container once, outside the loop
	const container = getPersistContainer(form);

	for (const input of inputs) {
		if (!isFieldElement(input) || !input.name) {
			continue;
		}

		// Skip unchecked checkbox/radio (they don't contribute to FormData)
		if (
			input instanceof HTMLInputElement &&
			(input.type === 'checkbox' || input.type === 'radio') &&
			!input.checked
		) {
			continue;
		}

		// Clone the input element
		const clone = input.cloneNode(true) as typeof input;

		// Mark with name if provided, and hide it
		if (name) {
			clone.setAttribute(PERSIST_ATTR, name);
		}

		clone.hidden = true;

		// Copy dynamic state that cloneNode doesn't preserve
		if (input instanceof HTMLSelectElement) {
			// cloneNode doesn't copy selected state for options
			for (let i = 0; i < input.options.length; i++) {
				const inputOption = input.options[i];
				const cloneOption = (clone as HTMLSelectElement).options[i];
				if (inputOption && cloneOption) {
					cloneOption.selected = inputOption.selected;
				}
			}
		} else if (input instanceof HTMLInputElement && input.type === 'file') {
			// cloneNode doesn't copy files
			(clone as HTMLInputElement).files = input.files;
		}

		// Append to persist container (faster than appending directly to form)
		container.appendChild(clone);
	}
}
