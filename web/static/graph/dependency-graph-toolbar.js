DependencyGraph.prototype.bindSearch = function () {
  var me = this;
  // Collapse buttons
  $( '.js-collapse' ).on( 'click', function () {
    var $this = $( this );
    var targetId = $this.data( 'target' );
    var direction = $this.data( 'direction' );
    var $target = $( '.js-collapse-target[data-id="' + targetId + '"]' );
    var collapsed = $target.hasClass( 'collapsed' );
    $target.toggleClass( 'collapsed', !collapsed );
    var buttonString;
    if ( direction == 'left' ) {
      buttonString = collapsed ? '<' : '>';
    } else {
      buttonString = collapsed ? '>' : '<';
    }
    $( this ).text( buttonString );
  } );

  // Real functionality
  $( '.js-submit', '.js-content-search' ).on( 'click', function ( e ) {
    e.preventDefault();
    var val = $( '.js-input', '.js-content-search' ).val();
    var foundNodes = me.getNodes( function ( node ) {
      if ( node.contents ) {
        return node.contents.indexOf( val ) !== -1;
      } else {
        return false;
      }
    } );
    me.removeStateHighlights();

    me.fadeNotTheseNodes( foundNodes );

    foundNodes.forEach( function ( n ) {
      me.applyNodeClass( n, 'highlight', true );
    } );
  } );
  $( '.js-input', '.js-space-mode' ).on( 'click', function ( e ) {
    me.spaceMode( !me.options.spaceMode );
  } );

  $( '.js-input', '.js-title-search' ).on( 'keyup change', function ( e ) {
    var val = $( '.js-input', '.js-title-search' ).val();

    if ( val.length == 0 ) {
      me.removeStateHighlights();
      return;
    } else {
      me.titleSearch( val );
    }
  } );
  $( '.js-input', '.js-hide-irrelevant' ).on( 'change', function ( e ) {
    var checked = $( this ).prop( 'checked' );
    me.options.hideIrrelevantNodes = checked;
    me.restoreHiddenNodes();
  } );
  $( '.js-input', '.js-deep-dependencies' ).on( 'change', function ( e ) {
    var checked = $( this ).prop( 'checked' );
    me.options.showDeepDependencies = checked;
    me.reselectNode();
  } );

  $( '.js-submit', '.js-freeze' ).on( 'click', function ( e ) {
    e.preventDefault();
    if ( me.frozen ) {
      me.force.start();
      me.frozen = false;
      $( this ).text( 'Freeze Graph' );
    } else {
      me.force.stop();
      me.frozen = true;
      $( this ).text( 'Unfreeze Graph' );
    }
  } );
  $( '.js-submit', '.js-fix' ).on( 'click', function ( e ) {
    e.preventDefault();
    if ( me.allFixed ) {
      me.unfixAllNodes();
      $( this ).text( 'Fix All Nodes' );
    } else {
      me.fixAllNodes();
      $( this ).text( 'Unfix All Nodes' );
    }
  } );
  $( '.js-input', '.js-gravity' ).on( 'change keyup', function ( e ) {
    me.setGravity( parseFloat( $( this ).val(), 10 ) );
  } );
  $( '.js-input-charge', '.js-charge' ).on( 'change keyup', function ( e ) {
    me.setCharge( parseFloat( $( this ).val(), 10 ) );
  } );
  $( '.js-input-distance', '.js-charge' ).on( 'change keyup', function ( e ) {
    me.setChargeDistance( parseFloat( $( this ).val(), 10 ) );
  } );
  $( '.js-input-base', '.js-distance' ).on( 'change keyup', function ( e ) {
    me.setBaseDistance( parseFloat( $( this ).val(), 10 ) );
  } );
  $( '.js-input-modifier', '.js-distance' ).on( 'change keyup', function ( e ) {
    me.setDistanceModifier( parseFloat( $( this ).val(), 10 ) );
  } );
  $( '.js-radio', '.js-radius' ).on( 'change', function ( e ) {
    var option = $( this ).val();
    if ( option === 'depended-on-by' ) {
      me.setRadiusByDependedOnBy( 'dependedOnBy' );
    } else if ( option === 'content-size' ) {
      me.setRadiusByContentLength();
    }
  } );
};

DependencyGraph.prototype.titleSearch = _.debounce( function ( val ) {
  var me = this;
  var foundNodes = this.getNodes( function ( node ) {
    return node.filepath.indexOf( val ) !== -1;
  } );

  this.removeStateHighlights();

  this.fadeNotTheseNodes( foundNodes );
  foundNodes.forEach( function ( n ) {
    me.applyNodeClass( n, 'highlight', true );
  } );
}, 300 );
