import { BrowserRouter, Link, Route, Routes } from 'react-router';
import Login from './routes/login';
import Home from './routes/home';
import Signup from './routes/signup';
import SignupAsyncSchema from './routes/signup-async-schema';
import Todos from './routes/todos';

function App() {
	return (
		<BrowserRouter>
			<main>
				<h1>React SPA Example</h1>

				<p>This example demonstrates the following features:</p>

				<ul>
					<li>
						<Link to="login">Basic form with schema validation</Link>
					</li>
					<li>
						<Link to="signup">Async validation</Link> (
						<Link to="signup-async-schema">with async schema</Link>)
					</li>
					<li>
						<Link to="todos">Dynamic form with data persistence</Link>
					</li>
				</ul>

				<hr />

				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="login" element={<Login />} />
					<Route path="signup" element={<Signup />} />
					<Route path="signup-async-schema" element={<SignupAsyncSchema />} />
					<Route path="todos" element={<Todos />} />
				</Routes>
			</main>
		</BrowserRouter>
	);
}

export default App;
