import { faExternalLink } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import beachImage from '../tiles/beachStraight0.png';
import waterImage from '../tiles/water0.png';
import Typography, * as TG from './Typography';

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
							title="Wavefunction Collapse Algorithm"
						>
							wave collapse algorithm
						</a>
						.
					</p>
				</section>
				<section>
					<h2>What's New</h2>
					<p>Some stuff is new!</p>
					<dl>
						<dt>Resizable panels! (wow)</dt>
						<dd>
							<p>
								Click and drag a grey bar to resize a panel,
								double click it to show/hide the panel
							</p>
						</dd>
						<dt>A "What's new" section</dt>
						<dd>
							<p>You're lookin' at it!</p>
						</dd>
						<dt>Keybindings!</dt>
						<dd>
							<p>Hover over a button to see its keybinding</p>
						</dd>
					</dl>
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
								</p>
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
									tiles, download and load in these examples:
								</p>
								<ul>
									<li>
										<a
											href="examples/beach.json"
											download="beach.json"
										>
											{/* TODO: make this link just open the example */}
											beach.json
										</a>
									</li>
									<li>
										<a
											href="examples/codingtrain.json"
											download="codingtrain.json"
										>
											codingtrain.json
										</a>{' '}
										based on{' '}
										<a
											target="_blank"
											rel="noreferrer"
											href="https://youtu.be/rI_y2GAlQFM"
										>
											this video
											<FontAwesomeIcon
												icon={faExternalLink}
												size="xs"
											/>
										</a>
									</li>
								</ul>
							</dd>
						</dl>
					</section>
					<section>
						<h3>Map Editor</h3>
						<dl>
							<dt>Place Tiles</dt>
							<dd>
								<p>
									Select a tile type on the right and left
									click on the map.{' '}
									{/* TODO: allow rotating tiles and remove this message */}
									(You can't rotate tiles yet sorry!)
								</p>
							</dd>
							<dt>Remove Tiles</dt>
							<dd>
								<p>
									Right click a tile to clear it. This is
									kinda buggy but oh well :)
								</p>
							</dd>
							<dt>Collapse Tiles</dt>
							<dd>
								<p>
									Middle click a tile to collapse it. It will
									pick one of the (hopefully valid) possible
									configurations automatically.
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
