import { type FieldElement, isFieldElement } from './dom';

export type FormObserver = {
	/**
	 * Subscribes to the event when any field element is mounted or unmounted.
	 *
	 * @param callback - Function invoked with the corresponding form element.
	 * @returns A function to unsubscribe the callback.
	 */
	onFieldMounted(callback: (formElement: HTMLFormElement) => void): () => void;

	/**
	 * Subscribes to the event when an input element's value changes.
	 * @param callback - Function invoked with the input element.
	 * @returns A function to unsubscribe the callback.
	 */
	onFieldChanged(callback: (fieldElement: FieldElement) => void): () => void;

	/**
	 * Subscribes to the event when a form's value changes.
	 *
	 * @param callback - Function invoked with the form element and its FormData.
	 * @returns A function to unsubscribe the callback.
	 */
	onFormDataChanged(
		callback: (formElement: HTMLFormElement, formData: FormData) => void,
	): () => void;

	/**
	 * Retrieves the form data for a given form element.
	 * @param formElement - The form element.
	 * @returns The FormData snapshot.
	 */
	getFormDataSnapshot(formElement: HTMLFormElement): FormData;
};

export function createFormObserver(): FormObserver {
	const snapshot = new Map<HTMLFormElement, FormData>();
	const fieldMountedCallbacks = new Set<
		Parameters<FormObserver['onFieldMounted']>[0]
	>();
	const inputChangedCallbacks = new Set<
		Parameters<FormObserver['onFieldChanged']>[0]
	>();
	const formDataChangedCallbacks = new Set<
		Parameters<FormObserver['onFormDataChanged']>[0]
	>();

	let observer: MutationObserver | null = null;

	function handleInput(event: Event) {
		const element = event.target;

		if (isFieldElement(element)) {
			emitFieldChanged(element);
			emitFormDataChanged(element.form);
		}
	}

	function handleReset(event: Event) {
		if (event.target instanceof HTMLFormElement) {
			emitFormDataChanged(event.target);
		}
	}

	function handleSubmit(event: SubmitEvent): void {
		if (event.target instanceof HTMLFormElement) {
			emitFormDataChanged(event.target, event.submitter);
		}
	}

	function getFieldElements(node: Node): FieldElement[] {
		const fieldElements: FieldElement[] = [];

		if (isFieldElement(node)) {
			fieldElements.push(node);
		} else if (node instanceof HTMLElement) {
			for (const element of node.querySelectorAll('input,select,textarea')) {
				if (isFieldElement(element)) {
					fieldElements.push(element);
				}
			}
		}

		return fieldElements;
	}

	function handleMutation(mutations: MutationRecord[]): void {
		const formDataChanged = new Set<HTMLFormElement>();
		const fieldElementMoutned = new Set<HTMLFormElement>();
		const fieldElementChanged = new Set<FieldElement>();

		for (const mutation of mutations) {
			switch (mutation.type) {
				case 'childList':
					for (const node of [
						...mutation.addedNodes,
						...mutation.removedNodes,
					]) {
						for (const fieldElement of getFieldElements(node)) {
							fieldElementMoutned.add(fieldElement.form);
							formDataChanged.add(fieldElement.form);
						}
					}
					break;
				case 'attributes':
					if (isFieldElement(mutation.target)) {
						fieldElementChanged.add(mutation.target);
						formDataChanged.add(mutation.target.form);
					}
					break;
			}
		}

		for (const formElement of formDataChanged) {
			emitFormDataChanged(formElement);
		}

		for (const fieldElement of fieldElementChanged) {
			emitFieldChanged(fieldElement);
		}

		for (const formElement of fieldElementMoutned) {
			emitFieldMounted(formElement);
		}
	}

	function emitFieldMounted(formElement: HTMLFormElement) {
		for (const callback of fieldMountedCallbacks) {
			callback(formElement);
		}
	}

	function emitFieldChanged(fieldElement: FieldElement) {
		for (const callback of inputChangedCallbacks) {
			callback(fieldElement);
		}
	}

	function emitFormDataChanged(
		formElement: HTMLFormElement,
		submitter: HTMLElement | null = null,
	) {
		const formData = new FormData(formElement, submitter);

		snapshot.set(formElement, formData);

		for (const callback of formDataChangedCallbacks) {
			callback(formElement, formData);
		}
	}

	function initialize() {
		// If there are no subscribers yet, listen for input, reset, and submit events globally
		if (
			formDataChangedCallbacks.size === 0 &&
			fieldMountedCallbacks.size === 0
		) {
			// Listen for input, reset, and submit events
			document.addEventListener('input', handleInput);
			document.addEventListener('reset', handleReset);
			// Capture submit event during the capturing pharse to ensure that the submitter is available
			document.addEventListener('submit', handleSubmit, true);

			// Observe form and input changes
			observer ??= new MutationObserver(handleMutation);
			observer.observe(document.body, {
				subtree: true,
				childList: true,
				attributeFilter: [
					// Basic attributes
					'form',
					'name',
					// Custom attributes for non-standard updates
					'data-conform',
					// Validation attributes
					'type',
					'required',
					'min',
					'max',
					'step',
					'minlength',
					'maxlength',
					'pattern',
					'multiple',
				],
			});
		}
	}

	function destroy() {
		// If there are no subscribers left, remove event listeners and disconnect the observer
		if (
			formDataChangedCallbacks.size === 0 &&
			fieldMountedCallbacks.size === 0
		) {
			document.removeEventListener('input', handleInput);
			document.removeEventListener('reset', handleReset);
			document.removeEventListener('submit', handleSubmit, true);
			observer?.disconnect();
		}
	}

	return {
		onFieldMounted(callback) {
			initialize();
			fieldMountedCallbacks.add(callback);

			return () => {
				fieldMountedCallbacks.delete(callback);
				destroy();
			};
		},
		onFieldChanged(callback) {
			initialize();
			inputChangedCallbacks.add(callback);

			return () => {
				inputChangedCallbacks.delete(callback);
				destroy();
			};
		},
		onFormDataChanged(callback) {
			initialize();
			formDataChangedCallbacks.add(callback);

			return () => {
				formDataChangedCallbacks.delete(callback);
				destroy();
			};
		},
		getFormDataSnapshot(formElement) {
			let formData = snapshot.get(formElement);

			if (!formData) {
				formData = new FormData(formElement);
				snapshot.set(formElement, formData);
			}

			return formData;
		},
	};
}
