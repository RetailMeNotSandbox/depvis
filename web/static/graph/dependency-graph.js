function DependencyGraph( el, data ) {
  var me = this;
  this.container = el;
  this.data = data;
  this.spaceDown = false;
  // These store temporarily removed nodes and links
  this.nodeStash = [];
  this.linkStash = [];
  this.options = {
    hideIrrelevantNodes: false,
    showDeepDependencies: true,
    spaceMode: false
  };

  // Mark top-level nodes, AKA nodes that are depended on by nothing, as primary
  this.data.nodes.forEach( function ( node ) {
    if ( node.dependedOnBy.length === 0 ) {
      node.primary = true;
    }
  } );

  this.data.links.forEach( function ( link, index ) {
    link.id = index;
  } );

  this.initD3();
  this.bindSpace();
  this.bindSearch();
  this.initNodeFunctionality();

}
