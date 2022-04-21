import { render, screen } from '@testing-library/react';
import App from './App';

test('renders tile with a name', () => {
	//TODO:
	render(<App />);
	const linkElement = screen.getByText(/Tilename/i);
	expect(linkElement).toBeInTheDocument();
});
