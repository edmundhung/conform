import { renderToStaticMarkup } from 'react-dom/server';

export function serverRenderHook<Result>(renderCallback: () => Result): Result {
	let result: Result | undefined;

	function TestComponent() {
		result = renderCallback();
		return null;
	}

	renderToStaticMarkup(<TestComponent />);

	if (!result) {
		throw new Error('The hook did not return any value');
	}

	return result;
}
