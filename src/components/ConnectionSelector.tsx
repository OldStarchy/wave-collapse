import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import './ConnectionSelector.css';

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
	const [selectedConnection, setSelectedConnection] = useState<string | null>(
		value
	);

	const handleChange = (value: string | null) => {
		setSelectedConnection(value);
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
					<div className="ConnectionSelector__Button__Text">
						{selectedConnection || 'None'}
					</div>
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
								className={`ConnectionSelector__MenuItem ${
									selectedConnection === key &&
									'ConnectionSelector__MenuItem--selected'
								}`}
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
