import { useForm, useFieldset, isFieldElement } from '@conform-to/react';
import { useRef } from 'react';

export default function ExampleForm() {
	const form = useForm({
		initialReport: 'onBlur',
		onValidate({ formData, form }) {
			for (const field of Array.from(form.elements)) {
				if (isFieldElement(field)) {
					switch (field.name) {
						case 'quantity': {
							if (field.value === '') {
								field.setCustomValidity('Quantity is required');
							} else {
								field.setCustomValidity('');
							}
							break;
						}
						case 'frequency': {
							const type = formData.get('type');

							if (type === 'subscription' && field.value === '') {
								field.setCustomValidity('Frequnecy is required');
							} else if (type === 'onetime-purchase' && field.value !== '') {
								field.setCustomValidity('Frequnecy should be blank');
							} else {
								field.setCustomValidity('');
							}
							break;
						}
					}
				}
			}

			return form.reportValidity();
		},
		onSubmit: (event, { submission }) => {
			event.preventDefault();

			console.log(submission);
		},
	});

	return (
		<div>
			<form id="product" {...form.props}>
				<fieldset>
					<legend>Product</legend>
					<select name="product">
						<option value="apple">Apple</option>
						<option value="banana">Banana</option>
						<option value="orange">Orange</option>
					</select>
				</fieldset>
			</form>
			<AnotherDOMTree />
			<button type="submit" name="type" value="subscription" form="product">
				Subscribe
			</button>
			<button type="submit" name="type" value="onetime-purchase" form="product">
				Add to cart
			</button>
		</div>
	);
}

function AnotherDOMTree() {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { quanitiy, frequency } = useFieldset(ref);

	return (
		<fieldset form="product" ref={ref}>
			<legend>Order</legend>
			<label>
				<div>Quantity</div>
				<input type="number" form="product" name="quanitiy" required />
				<div>{quanitiy.error}</div>
			</label>
			<label>
				<div>Frequency (Weeks)</div>
				<input type="text" form="product" name="frequency" />
				<div>{frequency.error}</div>
			</label>
		</fieldset>
	);
}
