import { getTodos } from '@/app/todos/_store';
import { TodoForm } from './_form';

export default async function Todos() {
	const todos = await getTodos();

	return <TodoForm defaultValue={todos} />;
}
