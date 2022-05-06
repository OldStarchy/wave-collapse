import beachImage from '../tiles/beachStraight0.png';
import exampleFile from '../tiles/example.json';
import waterImage from '../tiles/water0.png';
import Typography, * as TG from './Typography';

const blob = new Blob([JSON.stringify(exampleFile)]);
const exampleFileUrl = URL.createObjectURL(blob);

function HelpContent() {
	return (
		<div style={{ overflow: 'auto', padding: '0 1rem' }}>
			<Typography>
				<section>
					<h2>About</h2>
					<p>
						This is a simple random map generator that uses the{' '}
						<a
							href="https://robertheaton.com/2018/12/17/wavefunction-collapse-algorithm/"
							target="_blank"
							rel="noreferrer"
							title="although I haven't actually read this article yet"
						>
							wave collapse algorithm
						</a>
						.
					</p>
				</section>
				<section>
					<h2>What's New</h2>
					<p>Some stuff is new!</p>
					<ul>
						<li>
							Resizable panels! (wow)
							<p>
								Click and drag a grey bar to resize a panel,
								double click it to show/hide the panel
							</p>
						</li>
						<li>A "What's new" section</li>
					</ul>
				</section>
				<section>
					<h2>Help</h2>
					<section>
						<h3>Tile Types</h3>
						<dl>
							<dt>Create a Tile Type</dt>
							<dd>
								<p>
									Click the + button in the right panel to
									create a new tile type.
								</p>
							</dd>
							<dt>Add images</dt>
							<dd>
								<p>
									Select the tile type on the right. There are
									3 ways to add images:
									<ul>
										<li>
											click the + button in the "Images"
											section
										</li>
										<li>
											drag and drop image files into the
											"Images" section
										</li>
										<li>
											click a blank space in the "Images"
											section and paste an image from the
											clipboard
										</li>
									</ul>
								</p>
							</dd>
							<dt>Define Connections</dt>
							<dd>
								<p>
									Each side of a tile has a "connection key"
									that defines what other tiles can be
									adjacent to it.
								</p>
								<TG.Image
									src={waterImage}
									alt="Water"
									float="left"
									width={64}
								/>
								<p>
									For example, all sides of a "Water" tile
									type should be configured with the same
									connection key.
								</p>
								<TG.Image
									src={beachImage}
									alt="Beach"
									float="right"
									width={64}
								/>
								<p>
									A "Beach" tile type however should have a
									different connection key for each side. In
									this example the left side should be "water"
									and the right side should be "sand".
								</p>

								<div
									style={{
										float: 'left',
										marginRight: '1rem',
										display: 'flex',
										flexDirection: 'column',
									}}
								>
									<TG.Image
										src={beachImage}
										alt="Beach"
										style={{
											transform: 'rotate(180deg)',
										}}
										width={48}
									/>
									<TG.Image
										src={beachImage}
										alt="Beach"
										width={48}
									/>
								</div>
								<p>
									The top and bottom are a little more
									complicated, as they have both sand and
									water. The top of the beach can connect to
									the bottom of the beach, but not back to
									itself.
								</p>

								<p>
									To fix this we need to list each type of
									material along the top and bottom edges in a
									consistent order. Pick either clockwise or
									counter-clockwise (but be consistent). The
									exmaple tileset uses a counter-clockwise
									labelling convention, and so the top
									connection key should be "sand/water" and
									the bottom "water/sand".
								</p>

								<p>
									To see a working example with some more
									tiles,{' '}
									<a
										href={exampleFileUrl}
										download="example.json"
									>
										{/* TODO: make this link just open the example */}
										download the example
									</a>
									.
								</p>
							</dd>
						</dl>
					</section>
				</section>
			</Typography>
		</div>
	);
}

export default HelpContent;
