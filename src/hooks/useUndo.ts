import { useCallback, useEffect, useMemo, useRef } from 'react';

export default function useUndo<TState>(
	state: TState,
	setState: (state: TState) => void
) {
	const history = useRef({ history: [] as TState[], head: 0 });

	useEffect(() => {
		if (history.current.history[history.current.head] !== state) {
			history.current.history.splice(
				history.current.head + 1,
				Infinity,
				state
			);
			history.current.head = history.current.history.length - 1;
		}
	}, [state]);

	const canUndo = useCallback(() => history.current.head > 0, []);
	const canRedo = useCallback(
		() => history.current.head < history.current.history.length - 1,
		[]
	);

	const undo = useCallback(() => {
		if (history.current.head === 0) {
			return;
		}

		history.current.head--;
		setState(history.current.history[history.current.head]);
	}, [setState]);

	const redo = useCallback(() => {
		if (history.current.head === history.current.history.length - 1) {
			return;
		}

		history.current.head++;
		setState(history.current.history[history.current.head]);
	}, [setState]);

	return useMemo(
		() => ({ canUndo, canRedo, undo, redo }),
		[canRedo, canUndo, redo, undo]
	);
}
