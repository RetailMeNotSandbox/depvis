DependencyGraph.prototype.initD3 = function () {
  var me = this;
  this.svg = d3.select( this.container ).append('svg');

  this.zoom = d3.behavior.zoom()
        .scaleExtent( [ depvisOpts.zoomLowerBound, depvisOpts.zoomUpperBound ] )
        .on( "zoom", function () {
          if ( this.spaceDown && !depvisOpts.noCamera ) {
            this.container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
          }
        }.bind( this ) );

  this.drag = d3.behavior.drag()
      .origin( function ( d ) { return d; } )
      .on( "dragstart", dragstarted.bind( this ) )
      .on( "drag", dragged.bind( this ) )
      .on( "dragend", dragended.bind( this ) );

  this.margin = { top: -5, right: -5, bottom: -5, left: -5};
  this.width = window.innerWidth + this.margin.right;
  this.height = window.innerHeight + this.margin.bottom;

  this.radiusFunction = this.radiusFunctions.dependedOnBy.bind( this );

  this.buildFrame();
  this.buildNodes();
  this.runLayout();
  if ( depvisOpts.autoTick ) {
    for ( var i = 0; i < depvisOpts.autoTick; i++ ) {
      this.force.tick();
    }
  }
  if ( depvisOpts.startFixed ) {
    this.fixAllNodes();
    $( '.js-submit', '.js-fix' ).text( 'Unfix All Nodes' );
  }
};

DependencyGraph.prototype.buildFrame = function () {
  this.svg
      .attr('id', 'box')
      .attr("width", this.width + this.margin.left + this.margin.right )
      .attr("height", this.height + this.margin.top + this.margin.bottom )

  this.g = this.svg.append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.right + ")")
      .call( this.zoom );

  this.rect = this.g.append("rect")
      .attr("width", this.width)
      .attr("height", this.height)
      // Deselect event
      .on( 'click', function () {
        var titleSearchActive = false;
        var $titleSearchInput = $( '.js-input', '.js-title-search' );
        if ( $titleSearchInput.length > 0 ) {
          if ( $titleSearchInput.val().length > 0 ) {
            titleSearchActive = true;
          }
        }

        if ( !this.spaceDown && !titleSearchActive && !this.options.spaceMode ) {
          this.deselectNode();
        }
      }.bind( this ) )
      .style("fill", "none")
      .style("pointer-events", "all");

  this.container = this.g.append("g");
  this.force = d3.layout.force();
  this.force
      .gravity( depvisOpts.gravity )
      .linkDistance( this._linkDistanceCalc.bind( this ) )
      .charge( depvisOpts.charge )
      // .chargeDistance( depvisOpts.chargeDistance )
      .size( [ this.width, this.height ] );

  this.force
      .nodes( this.data.nodes )
      .links( this.data.links );

  this.link = this.container.selectAll('.link');
  this.node = this.container.selectAll('.node');
};

DependencyGraph.prototype._linkDistanceCalc = function () {
  var dist = ( depvisOpts.baseDistance * this.data.nodes.length * depvisOpts.distanceModifier ) + 1;
  return dist;
};

DependencyGraph.prototype.freezeDoUnfreeze = function ( callback, value ) {
  this.force.stop();
  callback.call( this, value );
  this.force.start();
};

DependencyGraph.prototype.setGravity = function ( value ) {
  this.freezeDoUnfreeze( function () {
    this.force.gravity( value );
  } );
};
DependencyGraph.prototype.setBaseDistance = function ( value ) {
  this.freezeDoUnfreeze( function () {
    depvisOpts.baseDistance = value;
    this.force.linkDistance( this._linkDistanceCalc.bind( this ) );
  } );
};
DependencyGraph.prototype.setDistanceModifier = function ( value ) {
  console.log( this._linkDistanceCalc() );
  this.freezeDoUnfreeze( function () {
    depvisOpts.distanceModifier = value;
    this.force.linkDistance( this._linkDistanceCalc.bind( this ) );
  } );
};
DependencyGraph.prototype.setCharge = function ( value ) {
  this.freezeDoUnfreeze( function () {
    this.force.charge( value );
  } );
};
DependencyGraph.prototype.setChargeDistance = function ( value ) {
  this.freezeDoUnfreeze( function () {
    this.force.chargeDistance( value );
  } );
};

DependencyGraph.prototype.buildNodes = function () {
  this.g.append("defs").selectAll("marker")
      .data( [ "suit", "licensing", "resolved" ] )
    .enter().append("marker")
      .attr("id", function( d ) { return d; })
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
      .style("stroke", "#4679BD")
      .style("opacity", "1");
};

DependencyGraph.prototype.bindSpace = function () {
  // If camera isn't allowed, just ignore this entirely
  if ( depvisOpts.noCamera ) {
    return;
  }
  var me = this;
  $( document ).on( 'keydown', function ( e ) {
    if ( e.keyCode == 32 ) {
      e.preventDefault();
      me.force.stop();
      me.spaceDown = true;
    }
  } );
  $( document ).on( 'keyup', function ( e ) {
    if ( e.keyCode == 32 ) {
      e.preventDefault();
      me.spaceDown = false;
      if ( !me.frozen ) {
        me.force.resume();
      }
    }
  } );
};

DependencyGraph.prototype.defaultRadius = 15;

DependencyGraph.prototype.radiusFunctions = {
  dependedOnBy: function ( d ) {
    if ( d.primary && depvisOpts.emphasizePrimary ) {
      return 100;
    } else {
      return this.defaultRadius + d.dependedOnBy.length * 3;
    }
  },
  contentLength: function ( d ) {
    if ( !d.contents ) {
      return this.defaultRadius;
    } else {
      var radius = d.contents.length;
      if ( !radius ) return this.defaultRadius;

      return this.defaultRadius + radius * 0.005;
    }
  }
}

DependencyGraph.prototype.setRadiusByDependedOnBy = function () {
  this.radiusFunction = this.radiusFunctions.dependedOnBy.bind( this );
  this.runLayout();
};
DependencyGraph.prototype.setRadiusByContentLength = function () {
  this.radiusFunction = this.radiusFunctions.contentLength.bind( this );
  this.runLayout();
};

DependencyGraph.prototype.runLayout = function () {
  var me = this;

  this.link = this.link.data( this.force.links(), function ( d ) {
    return d.id;
  } );

  this.link.enter().append('line')
      .attr('class', 'link')
      .attr( 'id', function ( d ) {
        return 'link-' + d.id;
      } )
      .style("marker-end",  "url(#suit)"); // Modified line

  this.link.exit().remove();

  function textBoxWidth( d ) {
    return ( d.nodeName.length || d.filepath.length ) * 10;
  }

  this.node = this.node.data( this.force.nodes(), function ( d ) {
    return d.filepath;
  } );

  var group = this.node.enter().append( 'g' )
      .attr( 'id', function ( d ) {
        return d.filepath;
      } )
      .attr( 'class', 'node' )
      .on( "click", clicked.bind( this ) )
      .classed( 'primary', function ( d ) {
        return d.primary;
      } )
      .classed( 'fixed', function ( d ) {
        return d.fixed;
      } )
      // Releases nodes
      .on('dblclick', this.pinNode.releasenode.bind( this ) )
      // Moves and pins nodes
      .call( this.pinBehavior() );

  // Circles that represent the size / usage of dependency
  group.append('circle')
      .attr( 'class', 'node' )
      .attr('r', this.radiusFunction );

  // Handle select moments
  this.node.select( 'circle.node' ).attr( 'r', this.radiusFunction );

  // Text boxes
  group.append('rect')
      .attr('class', 'text-box')
      .attr( 'y', -10 )
      .attr( 'x', function ( d ) {
        return -textBoxWidth( d ) / 2;
      } )
      .attr( 'width', function ( d ) {
        return textBoxWidth( d );
      } )
      .attr( 'height', 20 )
      .attr( 'border-radius', '2px')

  // Actual text
  group.append('text')
      .attr('dx', 12)
      .attr('dy', 15)
      .attr( 'y', -10 )
      .attr( 'x', function ( d ) {
        return -textBoxWidth( d ) / 2;
      } )
      .text(function(d) { return d.nodeName });
  this.node.exit().remove();

  // Force calculations
  this.force.on('tick', function() {
    me.link.attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });
    if ( depvisOpts.boundingBox ) {
      me.node.attr("cx", function( d ) {
            var radius = me.radiusFunction( d );
            return d.x = Math.max(radius, Math.min( me.width - radius, d.x));
          } )
          .attr("cy", function(d) {
            var radius = me.radiusFunction( d );
            return d.y = Math.max(radius, Math.min( me.height - radius, d.y));
          } );
    }

    me.node.attr( 'transform', function( d ) { return 'translate(' + d.x + ',' + d.y + ')'; });
    // Collision separation
    // me.node.each( me.collide( 0.5 ) );
  });

  this.force.start();
};

DependencyGraph.prototype.pinNode = {
  dragstart: function (d, i) {
    if ( this.spaceDown || this.options.spaceMode ) {
      // Don't do anything while the user is trying to drag around the map - or if they're in spacemode!
      return;
    }
    this.selectNode( d );
    this.force.stop() // stops the force auto positioning before you start dragging
    d.fixed |= 2;
  },
  dragmove: function (d, i) {
    if ( this.spaceDown ) {
      return;
    }
    d.px = d3.event.x;
    d.py = d3.event.y;
    d.x += d3.event.dx;
    d.y += d3.event.dy;
    this.force.resume();
  },
  dragend: function (d, i) {
    if ( this.spaceDown || this.options.spaceMode ) {
      return;
    }
    this.fixNode( d );
    if ( !this.frozen ) {
      this.force.resume();
    } else {
      this.force.tick();
      this.force.stop();
    }
  },
  releasenode: function (d) {
    this.unfixNode( d );
  }
};
DependencyGraph.prototype.pinBehavior = function () {
  return d3.behavior.drag()
    .on( "dragstart", DependencyGraph.prototype.pinNode.dragstart.bind( this ) )
    .on( "drag", DependencyGraph.prototype.pinNode.dragmove.bind( this ) )
    .on( "dragend", DependencyGraph.prototype.pinNode.dragend.bind( this ) );
};

DependencyGraph.prototype.collide = function ( alpha ) {
  var padding = 30;
  var quadtree = d3.geom.quadtree( this.data.nodes );
  return function(d) {
    var rb = ( 15 + d.dependedOnBy.length * 3 ) + padding,
        nx1 = d.x - rb,
        nx2 = d.x + rb,
        ny1 = d.y - rb,
        ny2 = d.y + rb;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y);
          if (l < rb) {
          l = (l - rb) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
};

function clicked( d ) {
  if ( !this.spaceDown && !this.options.spaceMode ) {
    this.selectNode( d );
  }
}

function dragstarted ( d ) {
  if ( !this.spaceDown && !this.frozen ) {
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("dragging", true);
  }
}

function dragged ( d ) {
  if ( !this.spaceDown && !this.frozen ) {
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
  }
}

function dragended ( d ) {
  if ( !this.spaceDown && !this.frozen ) {
    d3.select(this).classed("dragging", false);
  }
}
