import { useForm, useFieldset } from '@conform-to/react';
import { useRef } from 'react';

export default function RandomForm() {
	const formProps = useForm({
		initialReport: 'onBlur',
		onSubmit: (event) => {
			event.preventDefault();

			const formData = new FormData(event.currentTarget);
			const result = Object.fromEntries(formData);

			console.log(result);
		},
	});

	return (
		<div>
			<form id="product" {...formProps}>
				<input type="hidden" name="product" value="example-product" />
			</form>
			<AnotherDOMTree />
		</div>
	);
}

function AnotherDOMTree() {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { quanitiy } = useFieldset(ref);

	return (
		<fieldset form="product" ref={ref}>
			<label>
				<input type="number" form="product" name="quanitiy" required min={1} />
				<div>{quanitiy.error}</div>
			</label>
			<button type="submit" form="product">
				Add to cart
			</button>
		</fieldset>
	);
}
