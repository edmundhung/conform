import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { TestModal } from './test-modal.tsx';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		{window.location.pathname === '/modal' ? <TestModal /> : <App />}
	</StrictMode>,
);
