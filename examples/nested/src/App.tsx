import { useForm, useFieldset, createSubmission } from '@conform-to/react';

interface Payment {
	account: string;
	amount: {
		currency: string;
		value: number;
	};
	reference?: string;
}

export default function PaymentForm() {
	const formProps = useForm({
		onSubmit(event) {
			event.preventDefault();

			const formData = new FormData(event.currentTarget);
			const submission = createSubmission(formData);

			console.log(submission);
		},
	});
	const { account, amount, reference } = useFieldset<Payment>(formProps.ref);
	const { currency, value } = useFieldset(formProps.ref, amount.config);

	return (
		<form {...formProps}>
			<label>
				<div>Account Number</div>
				<input type="text" name={account.config.name} required />
				<div>{account.error}</div>
			</label>
			<label>
				<div>Amount</div>
				<input
					type="number"
					name={value.config.name}
					required
					min={10}
					step={0.1}
				/>
				<div>{value.error}</div>
			</label>
			<label>
				<div>Currency</div>
				<select name={currency.config.name} required>
					<option value="">Please select</option>
					<option value="USD">USD</option>
					<option value="EUR">EUR</option>
					<option value="HKD">HKD</option>
				</select>
				<div>{currency.error}</div>
			</label>
			<label>
				<div>Reference</div>
				<textarea name={reference.config.name} minLength={5} />
				<div>{reference.error}</div>
			</label>
			<button type="submit">Transfer</button>
		</form>
	);
}
