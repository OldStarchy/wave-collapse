import { createContext } from 'react';

const DragContext = createContext<{ isDragging: boolean }>({
	isDragging: false,
});

export default DragContext;
