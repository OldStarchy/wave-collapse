import classNames from 'classnames';
import { cloneElement } from 'react';
import './EditorWindow.scss';

function EditorWindow({
	className,
	mainContent,
	leftContent,
	rightContent,
	headerContent,
	footerContent,
	style,
}: {
	className?: string;
	mainContent?: React.ReactElement;
	leftContent?: React.ReactElement;
	rightContent?: React.ReactElement;
	headerContent?: React.ReactElement;
	footerContent?: React.ReactElement;
	style?: React.CSSProperties;
}) {
	return (
		<section
			style={style}
			className={classNames(className, 'EditorWindow')}
		>
			{mainContent &&
				cloneElement(mainContent, {
					className: classNames(
						mainContent.props.className,
						'EditorWindow__MainContent'
					),
				})}
			{headerContent &&
				cloneElement(headerContent, {
					className: classNames(
						headerContent.props.className,
						'EditorWindow__Header'
					),
				})}

			{leftContent &&
				cloneElement(leftContent, {
					className: classNames(
						leftContent.props.className,
						'EditorWindow__LeftSidebar'
					),
				})}

			{rightContent &&
				cloneElement(rightContent, {
					className: classNames(
						rightContent.props.className,
						'EditorWindow__RightSidebar'
					),
				})}

			{footerContent &&
				cloneElement(footerContent, {
					className: classNames(
						footerContent.props.className,
						'EditorWindow__Footer'
					),
				})}
		</section>
	);
}

export default EditorWindow;
