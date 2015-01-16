function NodeTree ( el, tree ) {
	var me = this;
	this.$el = $( el );
	this.template = _.template( $( '#templates .node-tree' ).html() );
	this.tree = tree;

	if( !tree || tree.length === 0 ) {
		$('.js-tree-view').remove();
		return;
	}

	this.$el.html( this.template( {
		node: this.tree,
		templateFn: this.template
	} ) );

	// Set up highlight / select interactions
	this.$el.on( 'click', '.js-dependency-link', function () {
		var nodeName = $( this ).data( 'id' );
		$( document ).trigger( 'selectNode', nodeName );
	} );
}
