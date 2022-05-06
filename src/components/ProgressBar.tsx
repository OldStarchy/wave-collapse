import './ProgressBar.scss';

function ProgressBar({
	progress,
	className,
}: {
	progress: undefined | number;
	className?: string;
}) {
	const classes = ['ProgressBar'];
	if (className) classes.push(className);
	if (progress === undefined) classes.push('ProgressBar--indeterminate');

	return (
		<div className={classes.join(' ')}>
			<div
				className="ProgressBar__Bar"
				style={{
					width:
						progress === undefined ? '100%' : `${progress * 100}%`,
				}}
			></div>
		</div>
	);
}

export default ProgressBar;
