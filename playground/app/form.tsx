import { z } from 'zod';
import {
	type FormControlIntent,
	combineFormControls,
	listControl,
	resetControl,
	updateControl,
	validateControl,
	resolve as baseResolve,
	deserializeIntent,
	getFormMetadata,
	getFieldset,
	report,
	isInput,
	getFieldMetadata,
} from './conform-dom';
import { type FormOptions, getFormData, useFormState } from './conform-react';
import { flattenZodErrors } from './conform-zod';
import { flushSync } from 'react-dom';
import { useRef } from 'react';

export const intentName = '__intent__';

export const control = combineFormControls([
	validateControl,
	resetControl,
	updateControl,
	listControl,
]);

export type Intent = FormControlIntent<typeof control>;

export function resolve(formData: FormData | URLSearchParams) {
	const submission = baseResolve(formData, {
		intentName,
		parseIntent(value) {
			const intent = deserializeIntent(value);

			if (control.isValid(intent)) {
				return intent;
			}

			return null;
		},
	});

	if (submission.value && submission.intent) {
		submission.value = control.updateValue(submission.value, submission.intent);
	}

	return submission;
}

export { report };

export function useForm<Schema extends Record<string, any>>(
	schema: z.ZodType<any, any, Schema>,
	options?: Omit<
		FormOptions<Schema, Intent, string[]>,
		'control' | 'intentName' | 'formRef'
	>,
) {
	const formRef = useRef<HTMLFormElement>(null);
	const { state, update, intent } = useFormState({
		...options,
		formRef,
		control,
		intentName,
	});

	return {
		form: getFormMetadata(state, {
			ref: formRef,
			onSubmit(event: React.FormEvent<HTMLFormElement>) {
				const formData = getFormData(event);
				const submission = resolve(formData);
				const parseResult = schema.safeParse(submission.value);

				if (!parseResult.success || submission.intent) {
					event.preventDefault();
				}

				const error = flattenZodErrors(parseResult, submission.fields);
				const result = report(submission, {
					formError: error.formError,
					fieldError: error.fieldError,
				});

				flushSync(() => {
					update(result);
				});
			},
			onInput(event: React.FormEvent<HTMLFormElement>) {
				if (
					isInput(event.target, formRef.current) &&
					state.touchedFields.includes(event.target.name)
				) {
					intent.submit({
						type: 'validate',
						payload: {
							name: event.target.name,
						},
					});
				}
			},
			onBlur(event: React.FocusEvent<HTMLFormElement>) {
				if (
					isInput(event.target, formRef.current) &&
					!state.touchedFields.includes(event.target.name)
				) {
					intent.submit({
						type: 'validate',
						payload: {
							name: event.target.name,
						},
					});
				}
			},
		}),
		fields: getFieldset(state, {
			metadata(state, name) {
				return getFieldMetadata(state, name);
			},
		}),
		intent,
	};
}
