import {
	type SubmissionResult,
	type FormControlIntent,
	type DefaultValue,
	type SubmitHandler,
	type ValidateHandler,
	baseControl,
	getMetadata,
	isInput,
	useFormControl,
} from 'conform-react';
import { useRef } from 'react';

type FormOptions<Schema, ErrorShape, Value> = {
	lastResult?: SubmissionResult<
		Schema,
		ErrorShape,
		FormControlIntent<typeof baseControl> | null
	> | null;
	defaultValue?: NoInfer<DefaultValue<Schema>>;
	onSubmit?: SubmitHandler<
		Schema,
		ErrorShape,
		FormControlIntent<typeof baseControl>,
		Value
	>;
	onValidate?: ValidateHandler<Schema, ErrorShape, Value>;
};

export function useForm<Schema, ErrorShape, Value>(
	options: FormOptions<Schema, ErrorShape, Value>,
) {
	const formRef = useRef<HTMLFormElement>(null);
	const { state, handleSubmit, intent } = useFormControl(formRef, {
		lastResult: options.lastResult,
		onValidate: options.onValidate,
		onSubmit: options.onSubmit,
	});
	const { form, fields } = getMetadata(state, {
		defaultValue: options.defaultValue,
		formProps: {
			ref: formRef,
			onSubmit: handleSubmit,
			onBlur(event) {
				if (
					isInput(event.target) &&
					!state.touchedFields.includes(event.target.name)
				) {
					intent.validate(event.target.name);
				}
			},
			onInput(event) {
				if (
					isInput(event.target) &&
					state.touchedFields.includes(event.target.name)
				) {
					intent.validate(event.target.name);
				}
			},
			noValidate: true,
		},
	});

	return {
		form,
		fields,
		intent,
	};
}
