import { TodoForm } from '@/app/form';
import { getTodos } from '../store';

export default async function Todos() {
	const todos = await getTodos();

	return <TodoForm defaultValue={todos} />;
}
