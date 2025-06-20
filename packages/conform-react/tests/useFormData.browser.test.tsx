/// <reference types="@vitest/browser/matchers" />
import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from '@vitest/browser/context';
import { useFormData } from '../future';
import { useRef } from 'react';
import { unstable_createGlobalFormsObserver as createGlobalFormsObserver } from '@conform-to/dom';

function useRenderCount(isStrcitMode: boolean): number {
	const ref = useRef(0);

	ref.current += 1;

	if (isStrcitMode) {
		return ref.current;
	}

	// The render count will go from 1, 3, 5, 7, ... in strict mode
	// This resolves it to 1, 2, 3, 4, ...
	return (ref.current + 1) / 2;
}

describe('future export: useFormData', () => {
	it('calls the selector when user types', async () => {
		const formObserver = createGlobalFormsObserver();
		function Form(props: {
			select: (formData: URLSearchParams | null, lastResult: any) => any;
			children?: React.ReactNode;
		}) {
			const formRef = useRef<HTMLFormElement>(null);
			const result = useFormData(formRef, props.select, {
				observer: formObserver,
			});
			const count = useRenderCount(true);

			return (
				<form ref={formRef} onSubmit={(event) => event.preventDefault()}>
					<pre data-testid="count">{count}</pre>
					<pre data-testid="result">{JSON.stringify(result)}</pre>
					{props.children}
					<button type="submit">Submit</button>
					<button type="reset">Reset</button>
				</form>
			);
		}
		const selector = vi.fn(
			(formData: URLSearchParams | null) => formData?.get('username') ?? '',
		);
		const screen = render(
			<Form select={selector}>
				<input type="text" name="username" aria-label="Username" />
			</Form>,
		);

		const result = screen.getByTestId('result');
		const renderCount = screen.getByTestId('count');
		const input = screen.getByLabelText('Username');

		expect(renderCount).toHaveTextContent(1);
		expect(result).toHaveTextContent(JSON.stringify(''));
		await userEvent.type(input, 'f');
		expect(renderCount).toHaveTextContent(2);
		expect(result).toHaveTextContent(JSON.stringify('f'));
		expect(input).toHaveValue('f');
		await userEvent.type(input, 'o');
		expect(renderCount).toHaveTextContent(3);
		expect(result).toHaveTextContent(JSON.stringify('fo'));
		expect(input).toHaveValue('fo');
		await userEvent.type(input, 'o');
		expect(renderCount).toHaveTextContent(4);
		expect(result).toHaveTextContent(JSON.stringify('foo'));
		expect(input).toHaveValue('foo');

		screen.rerender(<Form select={selector} />);

		expect(renderCount).toHaveTextContent(5);
		expect(input).not.toBeInTheDocument();
		expect(result).toHaveTextContent(JSON.stringify(''));
	});
});
