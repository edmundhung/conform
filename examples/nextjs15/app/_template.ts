import {
	type SubmissionResult,
	type FormControlIntent,
	type DefaultValue,
	type SubmitHandler,
	type ValidateHandler,
	baseControl,
	getMetadata,
	isInput,
	isTouched,
	useFormControl,
} from 'conform-react';
import { useRef } from 'react';

type FormOptions<FormShape, ErrorShape, Value> = {
	lastResult?: SubmissionResult<
		FormShape,
		ErrorShape,
		FormControlIntent<typeof baseControl> | null
	> | null;
	defaultValue?: NoInfer<DefaultValue<FormShape>>;
	onSubmit?: SubmitHandler<FormShape, ErrorShape, Value>;
	onValidate?: ValidateHandler<FormShape, ErrorShape, Value>;
};

export function useForm<FormShape, ErrorShape, Value>(
	options: FormOptions<FormShape, ErrorShape, Value>,
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
				if (isInput(event.target) && !isTouched(state, event.target.name)) {
					intent.validate(event.target.name);
				}
			},
			onInput(event) {
				if (isInput(event.target) && isTouched(state, event.target.name)) {
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
