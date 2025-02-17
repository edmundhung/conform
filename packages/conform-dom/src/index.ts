export {
	createSubmitEvent,
	isInput,
	getFormData,
	getFormAction,
	getFormEncType,
	getFormMethod,
	requestSubmit,
	requestIntent,
} from './dom';
export { parseSubmission, report, restoreResult } from './submission';
export { getPaths, formatPaths, getValue, setValue } from './formdata';
export { isPlainObject } from './util';
export type {
	Submission,
	SubmissionResult,
	FormValue,
	FormError,
	ValidationAttributes,
	Constraint,
} from './type';
