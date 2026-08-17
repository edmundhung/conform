/// <reference types="@vitest/browser/matchers" />
import { expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from '../future';

function TestForm(props: { label: string }) {
	const formRef = useRef<HTMLFormElement>(null);
	const [submitted, setSubmitted] = useState(false);
	const { form, fields, intent } = useForm<
		{ title: string },
		string[],
		{ title: string }
	>({
		id: 'example',
		formRef,
		defaultValue: { title: 'Initial title' },
		onValidate({ payload }) {
			return {
				error: null,
				value: { title: String(payload.title ?? '') },
			};
		},
		onSubmit(event) {
			event.preventDefault();
			setSubmitted(formRef.current === event.currentTarget);
		},
	});

	return (
		<form ref={formRef} {...form.props}>
			<label>
				{props.label}
				<input
					name={fields.title.name}
					defaultValue={fields.title.defaultValue}
				/>
			</label>
			<button
				type="button"
				onClick={() =>
					intent.update({ name: fields.title.name, value: 'Updated' })
				}
			>
				Update {props.label}
			</button>
			<button>Submit {props.label}</button>
			<output aria-label={`${props.label} result`}>
				{submitted ? 'submitted' : 'pending'}
			</output>
		</form>
	);
}

test('uses a user-owned form ref inside a shadow root', async () => {
	const host = document.createElement('div');
	const shadowRoot = host.attachShadow({ mode: 'open' });
	const decoy = document.createElement('form');

	decoy.id = 'example';
	document.body.append(decoy, host);

	function ShadowPortal() {
		return createPortal(<TestForm label="Shadow title" />, shadowRoot);
	}

	const screen = render(<ShadowPortal />);
	const title = screen.getByLabelText('Shadow title', { exact: true });

	await userEvent.click(
		screen.getByRole('button', { name: 'Update Shadow title' }),
	);
	await expect.element(title).toHaveValue('Updated');

	await userEvent.click(
		screen.getByRole('button', { name: 'Submit Shadow title' }),
	);
	await expect
		.element(screen.getByLabelText('Shadow title result'))
		.toHaveTextContent('submitted');

	decoy.remove();
	host.remove();
});

test('uses a user-owned form ref inside an iframe document', async () => {
	const decoy = document.createElement('form');

	decoy.id = 'example';
	document.body.append(decoy);

	function IframePortal() {
		const [iframeDocument, setIframeDocument] = useState<Document | null>(null);
		const iframeRef = useCallback((iframe: HTMLIFrameElement | null) => {
			setIframeDocument(iframe?.contentDocument ?? null);
		}, []);

		return (
			<>
				<iframe ref={iframeRef} title="Form frame" />
				{iframeDocument
					? createPortal(<TestForm label="Iframe title" />, iframeDocument.body)
					: null}
			</>
		);
	}

	const screen = render(<IframePortal />);
	const iframe = screen.container.querySelector('iframe')!;

	await expect
		.poll(() => iframe.contentDocument?.querySelector('input'))
		.toBeTruthy();

	const iframeDocument = iframe.contentDocument!;
	const title = iframeDocument.querySelector('input')!;
	const update = Array.from(iframeDocument.querySelectorAll('button')).find(
		(button) => button.textContent === 'Update Iframe title',
	)!;
	const submit = Array.from(iframeDocument.querySelectorAll('button')).find(
		(button) => button.textContent === 'Submit Iframe title',
	)!;

	update.click();
	await expect.poll(() => title.value).toBe('Updated');

	submit.click();
	await expect
		.poll(
			() =>
				iframeDocument.querySelector('output[aria-label="Iframe title result"]')
					?.textContent,
		)
		.toBe('submitted');

	decoy.remove();
});
