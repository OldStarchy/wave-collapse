import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import './ConnectionSelector.scss';

const connections = ['dirt', 'sand', 'grass', 'water'].map((name) => ({
	name,
	key: name,
}));

function ConnectionSelector({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string | null;
	onChange: (value: string | null) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);

	const handleChange = (value: string | null) => {
		onChange(value);
		setIsOpen(false);
	};

	return (
		<div className="ConnectionSelector">
			<div className="ConnectionSelector__Label">{label}: </div>
			<div className="ConnectionSelector__Value">
				<div
					className="ConnectionSelector__Button"
					onClick={() => setIsOpen(!isOpen)}
				>
					<input
						type="text"
						className="ConnectionSelector__Button__Text"
						value={value || ''}
						onChange={(e) => void onChange(e.target.value || null)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								setIsOpen(false);
							}
						}}
					/>

					<div className="ConnectionSelector__Button__Icon">
						{isOpen ? (
							<FontAwesomeIcon icon={solid('chevron-up')} />
						) : (
							<FontAwesomeIcon icon={solid('chevron-down')} />
						)}
					</div>
				</div>
				{isOpen && (
					<div className="ConnectionSelector__Menu">
						{connections.map(({ key, name }) => (
							<div
								key={key}
								className="ConnectionSelector__MenuItem"
								onClick={() => handleChange(key)}
							>
								{name}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default ConnectionSelector;
