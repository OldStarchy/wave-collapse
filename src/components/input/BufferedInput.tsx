import {solid} from '@fortawesome/fontawesome-svg-core/import.macro';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import {InputHTMLAttributes, useCallback, useEffect, useState} from 'react';
import './BufferedInput.scss';

function BufferedInput({
	value,
	onChange,
	validator,
	className,
	...props
}: {
	value: string;
	onChange: (value: string) => void;
	validator: (value: string) => string | null;
} & Omit<
	InputHTMLAttributes<HTMLInputElement>,
	'onChange' | 'value' | 'type'
>) {
	const [buffer, setBuffer] = useState(value);
	const [error, setError] = useState<string | null>(null);

	const validate = useCallback(
		(value: string) => {
			const error = validator(value);
			setError(error);
			return error === null;
		},
		[validator]
	);

	useEffect(() => {
		setBuffer(value);
	}, [value]);

	return (
		<div className={classNames('BufferedInput', className)}>
			{error && (
				<div className="BufferedInput__Error" title={error}>
					<FontAwesomeIcon icon={solid('exclamation-triangle')} />
				</div>
			)}
			<input
				{...props}
				className="BufferedInput__Input"
				type="text"
				value={buffer}
				onInput={(e) => {
					setBuffer((e.target as HTMLInputElement).value);
					if (error) {
						validate((e.target as HTMLInputElement).value);
					}
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						if (validate(buffer)) {
							onChange(buffer);
						}
					} else if (e.key === 'Escape') {
						setBuffer(value);
					}
				}}
				onBlur={() => {
					if (validate(buffer)) {
						onChange(buffer);
					}
				}}
			/>
		</div>
	);
}

export default BufferedInput;
