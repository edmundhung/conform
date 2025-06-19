import { describe, it, expect, vi } from 'vitest';
import { useControl } from '../future';
import { renderToStaticMarkup } from 'react-dom/server';

function renderHook<Result>(renderCallback: () => Result): Result {
	const result: { current: Result } = { current: undefined as any };

	function TestComponent() {
		result.current = renderCallback();
		return null;
	}

	renderToStaticMarkup(<TestComponent />);

	if (!result.current) {
		throw new Error('Hook did not return a value');
	}

	return result.current;
}

describe('future export: useControl', () => {
	const defaultResult = {
		value: undefined,
		options: undefined,
		files: undefined,
		checked: undefined,
		register: expect.any(Function),
		change: expect.any(Function),
		blur: expect.any(Function),
		focus: expect.any(Function),
	};
	const txtFile = new File(['hello world'], 'hello.txt', {
		type: 'text/plain',
	});
	const sqlFile = new File(['CREATE TABLE users;'], 'schema.sql', {
		type: 'application/sql',
	});

	it('infers initial value based on the options', async () => {
		expect(
			renderHook(() =>
				useControl({
					defaultValue: undefined,
				}),
			),
		).toEqual(defaultResult);

		expect(
			renderHook(() =>
				useControl({
					defaultValue: null,
				}),
			),
		).toEqual(defaultResult);

		expect(
			renderHook(() =>
				useControl({
					defaultValue: 'hello world',
				}),
			),
		).toEqual({
			...defaultResult,
			value: 'hello world',
		});

		expect(
			renderHook(() =>
				useControl({
					defaultValue: ['foo', 'bar'],
				}),
			),
		).toEqual({
			...defaultResult,
			options: ['foo', 'bar'],
		});

		expect(
			renderHook(() =>
				useControl({
					defaultChecked: true,
				}),
			),
		).toEqual({
			...defaultResult,
			value: 'on',
			checked: true,
		});

		expect(
			renderHook(() =>
				useControl({
					defaultChecked: false,
					value: 'yes',
				}),
			),
		).toEqual({
			...defaultResult,
			value: 'yes',
			checked: false,
		});

		expect(
			renderHook(() =>
				useControl({
					defaultValue: txtFile,
				}),
			),
		).toEqual({
			...defaultResult,
			files: [txtFile],
		});

		expect(
			renderHook(() =>
				useControl({
					defaultValue: [sqlFile, txtFile],
				}),
			),
		).toEqual({
			...defaultResult,
			files: [sqlFile, txtFile],
		});
	});

	it('works if the File or FileList class is not available on global', async () => {
		vi.stubGlobal('File', undefined);
		vi.stubGlobal('FileList', undefined);

		expect(
			renderHook(() =>
				useControl({
					defaultValue: undefined,
				}),
			),
		).toEqual(defaultResult);

		expect(
			renderHook(() =>
				useControl({
					defaultValue: null,
				}),
			),
		).toEqual(defaultResult);

		expect(
			renderHook(() =>
				useControl({
					defaultValue: 'hello world',
				}),
			),
		).toEqual({
			...defaultResult,
			value: 'hello world',
		});

		expect(
			renderHook(() =>
				useControl({
					defaultValue: ['foo', 'bar'],
				}),
			),
		).toEqual({
			...defaultResult,
			options: ['foo', 'bar'],
		});

		expect(
			renderHook(() =>
				useControl({
					defaultChecked: true,
				}),
			),
		).toEqual({
			...defaultResult,
			value: 'on',
			checked: true,
		});

		expect(
			renderHook(() =>
				useControl({
					defaultChecked: false,
					value: 'yes',
				}),
			),
		).toEqual({
			...defaultResult,
			value: 'yes',
			checked: false,
		});
	});
});
