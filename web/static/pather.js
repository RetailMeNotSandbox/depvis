// Breadth-first search (AKA yeast algorithm (kidding))
// http://en.wikipedia.org/wiki/Breadth-first_search
function bfsFindPrimaryImporters( graph, rootNode ) {
	var paths;

	var queue = [];
	var set = [];
	var importerSet = [];

	set.push( rootNode );
	queue.push( rootNode );
	while ( queue.length > 0 ) {
		// Dequeue
		var workingNode = queue.shift();
		// If this is a primary node, and it is not the node we clicked on,
		// then success, we found a primary node requiring this node. Importantly,
		// make sure we haven't already looked at this one, as well.
		if ( workingNode.primary &&
			!_.contains( importerSet, workingNode ) &&
			workingNode !== rootNode ) {
			importerSet.push( workingNode );
		}

		// Get all edges (AKA things importing this node)
		for ( var i = 0; i < workingNode.importedBy.length; i++ ) {
			var u = getNodeByName( graph, workingNode.importedBy[ i ] );
			if ( !_.contains( set, u ) ) {
				set.push( u );
				queue.push( u );
			}
		}
	}
	return importerSet;
}
