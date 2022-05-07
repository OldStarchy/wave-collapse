import classNames from 'classnames';
import React, { cloneElement, useState } from 'react';
import Button from './Button';
import './TabbedPanel.scss';

function TabbedPanel<
	TTabs extends Record<string, React.ReactElement<{ className?: string }>>
>({
	children,
	defaultTab,
	className,
}: {
	children: TTabs;
	defaultTab: keyof TTabs;
	className?: string;
}) {
	const [activeTab, setActiveTab] = useState<keyof TTabs>(defaultTab);

	return (
		<div className={classNames('TabbedPanel', className)}>
			<div className="TabbedPanel__Tabs">
				{Object.keys(children).map((tab) => (
					<Button
						className={classNames('TabbedPanel__Tab', {
							'TabbedPanel__Tab--active': tab === activeTab,
						})}
						key={tab}
						onClick={() => setActiveTab(tab as keyof TTabs)}
						title={undefined}
					>
						{tab}
					</Button>
				))}
			</div>

			{cloneElement(children[activeTab], {
				className: children[activeTab].props.className
					? `${children[activeTab].props.className} TabbedPanel__Content`
					: 'TabbedPanel__Content',
			})}
		</div>
	);
}

export default TabbedPanel;
