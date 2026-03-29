import { defineAction } from 'astro:actions';
import { login } from './features/login';
import { signup } from './features/signup';
import { signupWithAsyncSchema } from './features/signup-async-schema';
import { submitTodos } from './features/todos';

export const server = {
	login: defineAction({
		accept: 'form',
		handler: login,
	}),
	signup: defineAction({
		accept: 'form',
		handler: signup,
	}),
	signupAsyncSchema: defineAction({
		accept: 'form',
		handler: signupWithAsyncSchema,
	}),
	todos: defineAction({
		accept: 'form',
		handler: submitTodos,
	}),
};
