import {
	type FormControlOptions,
	type Fieldset,
	type DefaultValue,
	getMetadata,
	isInput,
	isTouched,
	useFormControl,
} from 'conform-react';
import React, { useId } from 'react';

export interface FormOptions<FormShape, ErrorShape, Value>
	extends FormControlOptions<FormShape, ErrorShape, Value> {
	id?: string;
	defaultValue?: NoInfer<DefaultValue<FormShape>>;
}

export type FormMetadata<ErrorShape> = ReturnType<
	typeof useForm<unknown, ErrorShape, unknown>
>['form'];
export type FieldMetadata<ErrorShape> =
	ReturnType<
		typeof useForm<unknown, ErrorShape, unknown>
	>['fields'] extends Fieldset<unknown, infer Metadata>
		? Metadata
		: never;

export function useForm<FormShape, ErrorShape, Value>(
	options: FormOptions<FormShape, ErrorShape, Value>,
) {
	const fallbackId = useId();
	const formId = options.id ?? `form-${fallbackId}`;
	const { state, handleSubmit, intent } = useFormControl(formId, options);
	const { form, fields } = getMetadata(state, {
		defaultValue: options.defaultValue,
		defineFormMetadata(metadata) {
			return Object.assign(metadata, {
				get props() {
					return {
						id: formId,
						onSubmit: handleSubmit,
						onBlur(event) {
							if (
								isInput(event.target) &&
								!isTouched(state, event.target.name)
							) {
								intent.validate(event.target.name);
							}
						},
						onInput(event) {
							if (
								isInput(event.target) &&
								isTouched(state, event.target.name)
							) {
								intent.validate(event.target.name);
							}
						},
						noValidate: true,
					} satisfies React.DetailedHTMLProps<
						React.FormHTMLAttributes<HTMLFormElement>,
						HTMLFormElement
					>;
				},
			});
		},
	});

	return {
		form,
		fields,
		intent,
	};
}
