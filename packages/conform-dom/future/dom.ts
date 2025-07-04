import { requestSubmit } from '../dom';

export {
	isFieldElement,
	isInputElement,
	isSelectElement,
	isTextAreaElement,
	updateField,
	createFileList,
	createGlobalFormsObserver,
	focus,
	change,
	blur,
	getFormAction,
	getFormEncType,
	getFormMethod,
	requestSubmit,
} from '../dom';

/**
 * Creates a submit event that behaves like a real form submission.
 */
export function createSubmitEvent(submitter?: HTMLElement | null): SubmitEvent {
	return new SubmitEvent('submit', {
		bubbles: true,
		cancelable: true,
		submitter,
	});
}

/**
 * Triggers form submission with an intent value. This is achieved by
 * creating a hidden button element with the intent value and then submitting it with the form.
 */
export function requestIntent(
	formElement: HTMLFormElement,
	intentName: string,
	intentValue: string,
): void {
	const submitter = document.createElement('button');

	submitter.name = intentName;
	submitter.value = intentValue;
	submitter.hidden = true;
	submitter.formNoValidate = true;

	formElement.appendChild(submitter);
	requestSubmit(formElement, submitter);
	formElement.removeChild(submitter);
}
