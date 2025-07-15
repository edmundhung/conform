export type { FormValue, Submission } from '../types';
export { getFormData, isDirty } from '../formdata';
export { deepEqual } from '../util';
export {
	isFieldElement,
	isGlobalInstance,
	updateField,
	createGlobalFormsObserver,
	focus,
	change,
	blur,
} from '../dom';
