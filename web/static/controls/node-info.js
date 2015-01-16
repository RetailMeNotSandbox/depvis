function NodeInfo ( el ) {
	var me = this;
	this.$el = $( el );
	this.template = _.template( $( '#templates .node-info' ).html() );
	$( document ).on( 'selectedNode', function ( e, node ) {
		me.node = node;
		me.displayNodeInfo( node );
	} );
	$( document ).on( 'deselectedNode', function () {
		me.node = undefined;
		me.hideNodeInfo();
	} );

	// Set up highlight / select interactions
	this.$el.on( 'click', '.js-dependency-link', function () {
		var nodeName = $( this ).data( 'id' );
		$( document ).trigger( 'selectNode', nodeName );
	} );
	this.$el.on( 'click', '.js-highlight-depends-on-deep', function () {
		$( document ).trigger( 'highlightNodeDependenciesDeep', me.node );
	} );
}
NodeInfo.prototype.displayNodeInfo = function ( node ) {
	this.$el.html( this.template( _.extend( {
		contents: false
	}, node ) ) );
	this.$el.addClass( 'show' );
};
NodeInfo.prototype.hideNodeInfo = function () {
	this.$el.removeClass( 'show' );
};
