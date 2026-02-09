import { getTodos } from '@/app/todos/_store';
import { TodoForm } from './_form';

export default async function Todos({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { id } = await searchParams;
	const storeId = typeof id === 'string' ? id : undefined;
	const todos = await getTodos(storeId);

	return <TodoForm id={storeId} defaultValue={todos} />;
}
