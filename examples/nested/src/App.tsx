import { useForm, useFieldset } from '@conform-to/react';

interface Payment {
	account: string;
	amount: {
		currency: string;
		value: number;
	};
	reference?: string;
}

export default function PaymentForm() {
	const form = useForm<Payment>({
		onSubmit(event, { submission }) {
			event.preventDefault();

			switch (submission.type) {
				case 'validate':
					break;
				default:
					console.log(submission);
					break;
			}
		},
	});
	const { account, amount, reference } = useFieldset(form.ref, form.config);
	const { currency, value } = useFieldset(form.ref, amount.config);

	return (
		<form {...form.props}>
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
