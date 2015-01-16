// WARNING: WET CODE AHEAD. WET LIKE A SWAMP.

DependencyGraph.prototype.initNodeFunctionality = function () {
  var me = this;
  $( document ).on( 'selectNode', function ( e, node ) {
    me.selectNode( node );
  } );
};

// Light indicates that this item is more than one step away from the source node be given a 'light' class.
// `stack` is the stack of all nodes we've highlighted - we keep this around and return all of the highlighted
// nodes so that we can fade out all the -other- nodes.
DependencyGraph.prototype.highlightNodeDependenciesRecursive = function ( node, prevNode, stack ) {
  if ( node.recursed || ( !node.isImmediateDependency && !this.options.showDeepDependencies ) ) {
    return;
  }

  stack.push( node );
  node.recursed = true;

  this.applyNodeClass( node, 'dependency', true );
  if ( !node.isImmediateDependency ) {
    this.applyNodeClass( node, 'light', true );
  }

  this.highlightNodeLink( prevNode, node, 'dependency' );
  if ( !node.isImmediateDependency ) {
    this.highlightNodeLink( prevNode, node, 'light' );
  }

  for ( var i = 0; i < node.dependencyLinks.length; i++ ) {
    var dependencyNode = this.getNodeByName( node.dependencyLinks[ i ].nodeName );
    // The dependencyNode may be missing, if so just ignore it
    if ( !dependencyNode ) continue;
    this.highlightNodeDependenciesRecursive( dependencyNode, node, stack );
  }
  return stack;
};
DependencyGraph.prototype.highlightNodesDependedOnByRecursive = function ( node, prevNode, stack ) {
  if ( node.recursed || ( !node.isImmediateDependency && !this.options.showDeepDependencies ) ) {
    return;
  }
  stack.push( node );
  node.recursed = true;

  this.applyNodeClass( node, 'depended-on-by', true );
  if ( !node.isImmediateDependency ) {
    this.applyNodeClass( node, 'light', true );
  }

  // In this function, dependencyNode and node are switched since this is a depended-on-by
  // relationship, meanining that the link exists but it goes in the opposite direction to
  // when we're grabbing what a node depends on
  this.highlightNodeLink( node, prevNode, 'depended-on-by' );
  if ( !node.isImmediateDependency ) {
    this.highlightNodeLink( node, prevNode, 'light' );
  }

  for ( var i = 0; i < node.dependedOnBy.length; i++ ) {
    var dependencyNode = this.getNodeByName( node.dependedOnBy[ i ].nodeName );
    this.highlightNodesDependedOnByRecursive( dependencyNode, node, stack );
  }
  return stack;
};
DependencyGraph.prototype.highlightNodeLink = function ( sourceNode, targetNode, className ) {
  var d3link = this.selectD3LinkByNodes( sourceNode, targetNode );
  d3link.classed( className, true );
};
DependencyGraph.prototype.removeNodeLinkHighlights = function () {
  var me = this;
  var d3links = d3.selectAll( 'line.link' );
  d3links.classed( 'dependency', false );
  d3links.classed( 'depended-on-by', false );
  d3links.classed( 'light', false );
};
DependencyGraph.prototype.reselectNode = function () {
  var node = this.selectedNode;
  if ( node ) {
    this.deselectNode();
    this.selectNode( node );
  }
};
DependencyGraph.prototype.selectNode = function ( node ) {
  this.deselectNode();
  var nextNode;
  if ( typeof node === 'string' ) {
    nextNode = this.getNodeByName( node );
  } else {
    nextNode = node;
  }
  this.selectedNode = nextNode;
  this.applyNodeClass( this.selectedNode, 'selected', true );

  // We include the selectedNode because it's selected, and as a result is in fact
  // already highlighted. If we don't, then it'll get faded (or hidden) with the rest of the
  // other nodes depending on whether the hideIrrelevantNodes option is true.
  var highlightedDependencyNodes = [ this.selectedNode ];
  // We can have missing files in the dependency links, so return only notes that exist
  var existingDependencyNodes = this.selectedNode.dependencyLinks.map( function ( dependencyLink ) {
    return this.getNodeByName( dependencyLink.nodeName );
  }.bind( this ) ).filter( function ( dependencyNode ) {
    // THIS ONE WEIRD TRICK... we're mapping over the original links to return existing nodes,
    // and if there is no such node it will be undefined, so this will filter it out
    return dependencyNode;
  } );

  existingDependencyNodes.forEach( function ( dependencyNode ) {
    // We set these as immediate dependencies so that when our recursive function is running
    // around trying to apply classes to things, we won't apply a "light" class to this.
    dependencyNode.isImmediateDependency = true;
  } );
  // OK, -now- we highlight them.
  existingDependencyNodes.forEach( function ( dependencyNode ) {
    this.highlightNodeDependenciesRecursive( dependencyNode, this.selectedNode, highlightedDependencyNodes );
  }.bind( this ) );

  // We need to reset the recursed state after highlighting dependency nodes, otherwise nodes
  // that are already dependencies of the select node will block the dependedOnBy recursive
  // highlighting.
  this.resetRecursedState();

  var highlightedDependedOnBy = [];
  // dependedOnBy never has missing nodes because it makes no sense for a node that doesn't
  // exist to depend on this node, so we can just map the results back immediately
  var existingDependedOnByNodes = this.selectedNode.dependedOnBy.map( function ( dependencyLink ) {
    return this.getNodeByName( dependencyLink.nodeName );
  }.bind( this ) );
  // Set immediate dependencies
  existingDependedOnByNodes.forEach( function ( dependencyNode )  {
    dependencyNode.isImmediateDependency = true;
  } );
  // Actually highlight
  existingDependedOnByNodes.forEach( function ( dependencyNode ) {
    this.highlightNodesDependedOnByRecursive( dependencyNode, this.selectedNode, highlightedDependedOnBy );
  }.bind( this ) );

  var highlightedNodes = highlightedDependencyNodes.concat( highlightedDependedOnBy );
  // Remove immediate dependency flags
  highlightedNodes.forEach( function ( node ) {
    node.isImmediateDependency = false;
  } );

  // Either hide or fade out nodes that weren't highlighted
  if ( this.options.hideIrrelevantNodes ) {
    var otherNodes = this.getOtherNodes( highlightedNodes );
    this.removeNodes( otherNodes );
  } else {
    this.fadeNotTheseNodes( highlightedNodes );
  }

  // Inform other components that we've selected a node
  $( document ).trigger( 'selectedNode', this.selectedNode );
};

DependencyGraph.prototype.removeNodes = function ( nodes ) {
  this.force.stop();
  nodes.forEach( this.removeNode.bind( this ) );
  this.runLayout();
};

DependencyGraph.prototype.removeNode = function ( node, runLayout ) {
  if ( runLayout ) {
    this.force.stop();
  }
  var i = 0;
  var removedLinks = _.remove( this.data.links, function ( link, runLayout ) {
    return link.source === node || link.target === node;
  } );
  this.linkStash = this.linkStash.concat( removedLinks );

  var index = _.indexOf( this.data.nodes, node );
  if ( index !== -1 ) {
    var removedNode = _.pullAt( this.data.nodes, index );
    this.nodeStash = this.nodeStash.concat( removedNode );
  }
  if ( runLayout ) {
    this.runLayout();
  }
};
DependencyGraph.prototype.spaceMode = function ( state ) {
  if ( state ) {
    this.linkStash = [].concat( this.data.links );
    this.data.links.length = 0;
  } else {
    this.restoreHiddenNodes();
  }
  this.options.spaceMode = state;
  this.runLayout();
};
DependencyGraph.prototype.restoreHiddenNodes = function () {
  this.force.stop();
  this.linkStash.forEach( function ( l ) {
    this.data.links.push( l );
  }.bind( this ) );
  this.nodeStash.forEach( function ( n ) {
    this.data.nodes.push( n );
  }.bind( this ) );
  this.linkStash.length = 0;
  this.nodeStash.length = 0;
  this.runLayout();
};

DependencyGraph.prototype.deselectNode = function () {
  this.removeStateHighlights();
  // If we have any stashed nodes or links, restore them
  if ( this.linkStash.length > 0 || this.nodeStash.length > 0 ) {
    this.restoreHiddenNodes();
  }
  if ( this.selectedNode ) {
    this.applyNodeClass( this.selectedNode, 'selected', false );
  }
  $( document ).trigger( 'deselectedNode' );
};

DependencyGraph.prototype.getNodeByName = function ( nodeName ) {
  return this.getNode( function ( currentNode ) {
    return currentNode.nodeName === nodeName;
  } );
};
DependencyGraph.prototype.getNode = function ( condition ) {
  if ( !condition ) {
    return undefined;
  } else {
    return _.find( this.data.nodes, condition );
  }
};

// Returns every node that is not in the set of nodes passed
DependencyGraph.prototype.getOtherNodes = function ( nodes ) {
  var otherNodes = [];
  return this.data.nodes.filter( function ( node ) {
    return !_.contains( nodes, node );
  } );
};

DependencyGraph.prototype.getNodes = function ( condition ) {
  if ( !condition ) {
    return this.data;
  } else {
    return _.filter( this.data.nodes, condition );
  }
};

DependencyGraph.prototype.fadeNodes = function ( nodes ) {
  if ( !_.isArray( nodes ) ) nodes = [ nodes ];
  // todo this
};

DependencyGraph.prototype.applyNodeClass = function ( node, classes, conditions ) {
  if ( !_.isArray( classes ) ) {
    classes = [ classes ];
  }
  if ( !_.isArray( conditions ) ) {
    conditions = [ conditions ];
  }

  var d3Node = this.selectD3Node( node );
  if ( d3Node ) {
    for ( var i = 0; i < classes.length; i++ ) {
      d3Node.classed( classes[ i ], conditions[ i ] );
    }
  }
};

DependencyGraph.prototype.sanitizeId = function ( string ) {
  string = string.replace( /\//g, '\\/' );
  return string.replace( /\./g, '\\.' );
}
;
DependencyGraph.prototype.selectD3Node = function ( node ) {
  var d3Node;
  if ( typeof node === 'string' ) {
    node = this.getNodeByName( node );
  }
  try {
    d3Node = d3.select( '#' + this.sanitizeId( node.filepath ) );
  } catch ( e ) {
    console.log( e, 'but who cares' );
  }
  return d3Node;
};
// Horribly inconsistent with selectD3Node
DependencyGraph.prototype.selectD3Link = function ( link ) {
  var d3Link;
  try {
    var selector = '#link-' + link.id;
    d3Link = d3.select( selector );
  } catch ( e ) {
    console.log( e, 'but who cares' );
  }
  return d3Link;
};
DependencyGraph.prototype.selectD3LinkByNodes = function ( sourceNode, targetNode ) {
  var link = _.find( this.data.links, function ( link ) {
    return link.source === sourceNode && link.target === targetNode;
  } );
  var d3Link;
  try {
    var selector = '#link-' + link.id;
    d3Link = d3.select( selector );
  } catch ( e ) {
    console.log( e, 'but who cares' );
  }
  return d3Link;
};


DependencyGraph.prototype.fadeNotTheseNodes = function ( theseNodes ) {
  var me = this;
  this.getNodes( function () {
    return true;
  }).forEach( function ( n ) {
    if ( !_.contains( theseNodes, n ) ) {
      me.applyNodeClass( n, 'fade', true );
    }
  } );
};
DependencyGraph.prototype.fixAllNodes = function ( node ) {
  var me = this;
  this.data.nodes.forEach( function ( n ) {
    me.fixNode( n );
  } );
  this.allFixed = true;
};
DependencyGraph.prototype.unfixAllNodes = function ( node ) {
  var me = this;
  this.data.nodes.forEach( function ( n ) {
    me.unfixNode( n );
  } );
  this.allFixed = false;
};
DependencyGraph.prototype.fixNode = function ( node ) {
  node.fixed = true;
  this.applyNodeClass( node, 'fixed', true );
};
DependencyGraph.prototype.unfixNode = function ( node ) {
  node.fixed = false;
  this.applyNodeClass( node, 'fixed', false );
};

DependencyGraph.prototype.highlightNode = function ( node ) {
  this.applyNodeClass( node, [ 'highlight' ], [ true ] );
};

// Remove all possible highlights for various states
DependencyGraph.prototype.removeStateHighlights = function () {
  var me = this;
  this.removeNodeLinkHighlights();
  this.data.nodes.forEach(function ( n ) {
    me.applyNodeClass( n,
      [ 'highlight', 'dependency', 'depended-on-by', 'light', 'fade' ],
      [ false, false, false, false, false ] );
  } );
  this.resetRecursedState();
};
DependencyGraph.prototype.resetRecursedState = function () {
  this.data.nodes.forEach(function ( n ) {
    n.recursed = false;
  } );
};
