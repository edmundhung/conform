import { connection } from 'next/server';
import { getTodos } from '@/app/todos/_store';
import { TodoForm } from './_form';

// Wait for the todos before sending the page instead of streaming them in, so
// the form is in the initial HTML and still works without JavaScript.
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
