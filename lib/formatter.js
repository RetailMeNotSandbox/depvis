/**
 * Used to format various Dandelion data structures to others.
 */

/**
 * Expects an array of nodes that look like this:
 *
 * {
 * 	nodeName: String,
 * 	dependencyLinks: [ Strings ]
 * }
 *
 * It'll generate a fully-formed d3 graph data object that looks like this:
 *
 * {
 * 	nodes: [
 * 		{
 * 			nodeName: String,
 * 			filepath: String (nodeName),
 * 			dependencyLinks: [
 * 				{
 * 					found: true,
 * 					dependencyName: String (nodeName),
 * 					nodeName: String,
 * 					filepath: String (nodeName)
 * 			 	},
 * 			 	// ...
 * 			],
 * 			dependedOnBy: [
 * 				{
 * 					filepath: String (nodeName),
 * 					nodeName: String (nodeName)
 * 				}
 * 			]
 * 		},
 * 		// ...
 * 	],
 * 	// d3-format links where the target and source are the indexes
 * 	// of nodes in an array
 * 	links: [
 * 		{
 * 			source: 0,
 * 			target: 1
 * 		},
 * 		// ...
 * 	],
 * 	// (empty, WIP)
 * 	tree: []
 * }
 */

var _ = require( 'lodash' );

function formatSimpleNodesForD3 ( nodes ) {
	var data = {
		nodes: nodes,
		links: [],
		tree: []
	};
	nodes.forEach( function ( node, sourceIndex ) {
		// New array because we're going to reformat the dependencyLinks
		var formattedDependencyLinks = [];
		if ( !node.dependedOnBy ) {
			node.dependedOnBy = [];
		}
		node.filepath = node.nodeName;

		node.dependencyLinks.forEach( function ( dependencyLinkNodeName ) {
			var dependencyLink = {
				dependencyName: dependencyLinkNodeName,
				nodeName: dependencyLinkNodeName,
				filepath: dependencyLinkNodeName
			};

			var targetIndex = _.findIndex( nodes, { nodeName: dependencyLinkNodeName } );
			if ( targetIndex !== -1 ) {
				dependencyLink.found = true;
				var targetNode = nodes[ targetIndex ];
				var dependedOnBy = {
					filepath: node.nodeName,
					nodeName: node.nodeName
				};

				if ( !targetNode.dependedOnBy ) {
					targetNode.dependedOnBy = [ dependedOnBy ];
				} else {
					targetNode.dependedOnBy.push( dependedOnBy );
				}

				data.links.push( {
					source: sourceIndex,
					target: targetIndex
				} )
			} else {
				dependencyLink.found = false;
				dependencyLink.dependencyName = dependencyLinkNodeName;
			}
			formattedDependencyLinks.push( dependencyLink );
		} );
		node.dependencyLinks = formattedDependencyLinks;
	} );

	return data;
}

module.exports = {
	formatSimpleNodes: formatSimpleNodesForD3
};
