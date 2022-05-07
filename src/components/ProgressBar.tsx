import classNames from 'classnames';
import './ProgressBar.scss';

function ProgressBar({
	progress,
	className,
}: {
	progress: undefined | number;
	className?: string;
}) {
	//TODO: test or remove "indeterminate" mode
	return (
		<div
			className={classNames(
				'ProgressBar',
				{
					'ProgressBar--indeterminate': progress === undefined,
				},
				className
			)}
		>
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
