import { connection } from 'next/server';
import { getTodos } from '@/app/todos/_store';
import { TodoForm } from './_form';

// Wait for the todos before sending the page, so the form is in the initial
// HTML and works without JavaScript. If you don't need that, remove this line
// and move the code below into a component rendered inside <Suspense>, as the
// index page does.
export const instant = false;

export default async function Todos({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { id } = await searchParams;
	const storeId = typeof id === 'string' ? id : undefined;
	// The demo store waits a random time, which must happen at request time.
	await connection();
	const todos = await getTodos(storeId);

	return <TodoForm id={storeId} defaultValue={todos} />;
}
