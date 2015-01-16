#!/usr/bin/env node
/**
 * depvis/server
 *
 * This is the server component of depvis. It provides a lightewight express app as middleware
 * that mostly serves the static content containing the actual graph visualization app. You can require
 * the server component directly and pass it depvis-ready data, and then have the server listen to run
 * it standalone, or use it as middleware inside of another express app.
 *
 * Example usage in a basic Express app:
 *
 * var express = require( 'express' );
 * var myApp = express();
 * var depvisData = getDepvisData(); // You would make this function
 * var depvisopts = { ... } // See documentation of options below for what you could put here
 * // This would put the server at http://yourapp.com/embed-depvis/
 * var depvisRoot = '/embed-depvis/';
 * var depvisServer = require( '@rmn/depvis/server', {
 *     baseUrl: '/embed-depvis/',
 *     depvisData: depvisData,
 *     depvisOpts: depvisOpts
 * } );
 * myApp.use( depvisRoot, depvisServer );
 *
 * Specifically, requiring the server component returns a function, which when called with options,
 * defines its top level route to render the graphing app's view, with your given options passed along,
 * and then returns the whole server component. You can either use it as a standalone express app by
 * simply calling .listen( <port> ) on the returned express app (this is how the CLI works), or consume
 * it as middleware in another express-style application with app.use.
 */
var path = require( 'path' );
var extend = require('extend');
var express = require( 'express' );
var app = express();
app.set( 'view engine', 'ejs' );
var viewPath = path.resolve( __dirname, '../web/views' );
app.set( 'views', viewPath );
var staticPath = path.resolve( __dirname, '../web/static' );
app.use( '/static', express.static( staticPath ) );

var browserify = require('browserify');

function escapeHtml(unsafe) {
	return unsafe
		.replace( /&/g, "&amp;" )
		.replace( /</g, "&lt;" )
		.replace( />/g, "&gt;" )
		.replace( /"/g, "&quot;" )
		.replace( /'/g, "&#039;" );
}

module.exports = function ( opts, callback ) {
	var defaults = {
		/*
		If included in another app, you may need to serve
		depvis's static assets out of another directory.
		Set the baseUrl to indicate the route where the
		depvis server lives.
		*/
		baseUrl: '/',
		depvisData: {
			nodes: [
				/** {
				nodeName, // name displayed on the depvis tree
				filepath // "id" for the module
			} */],
			links: [/**
				sourceNodeIndex,
				targetNodeIndex
			*/],
			tree: []
		},
		/*
		See https://github.com/mbostock/d3/wiki/Force-Layout for
		detailed information on these settings
		*/
		depvisOpts: {
			/*
			The closest into/farthest away from the nodes you can zoom.
			Part of d3's zoom behavior.
			*/
			zoomLowerBound: 0.2,
			zoomUpperBound: 10,
			/*
			Together, these two parameters control the distance between nodes.
			Distance is calculated via this formula:

				baseDistance * nodes.length * distanceModifier
			*/
			baseDistance: 30,
			distanceModifier: 0.2,
			/*
			If set to a Number, depvis will instantly run the number of frames
			specified of its force-directed layout. This is useful for getting a
			large, tangled depvis graph to unravel itself instantly on-load.
			*/
			autoTick: 200,
			/*
			If set to true, this will fix every node in place immediately on
			the start of the depvis graph. This can keep the graph from
			being too annoying. If combined with autoTick, it will fix nodes
			-after- autoTick has run (otherwise autoTick wouldn't do anything).
			 */
			startFixed: false,
			/*
			Charge strength that indicates how repulsive/attractive nodes are
			to one another. See the d3 Force Layout wiki page on GitHub for
			more information.
			*/
			charge: -5000,
			/*
			The distance at which charge strength is calculated.
			*/
			chargeDistance: 800,
			/*
			Gravity applies a certain amount of force upon all nodes towards the
			center of the layout, keeping nodes from "escaping" the layout. Setting
			this to 0 will make it so that your nodes can run off the screen,
			something you probably don't want to happen.
			*/
			gravity: 0.1,
			/*
			When set to true, will not allow nodes to exit the bounding box of the
			visualization, specifically meaning that they cannot leave the zone
			defined by the width and height passed to the visualization. Works
			well in tandem with hideControls and noCamera.
			*/
			boundingBox: false,
			/*
			When set to true, disables the ability to pan or zoom.
			*/
			noCamera: false,
			/* Set to true to hide the controls if you don't need them. */
			hideControls: false,
			/*
			When set to true, this will make nodes that are not depended on by anything
			else visually larger by default. This is useful for determining which nodes are
			top-level nodes in a large codebase.
			*/
			emphasizePrimary: true
		}
	};

	opts = extend(true, {}, defaults, opts);

	opts.depvisData.nodes.forEach( function ( node ) {
		if ( node.contents ) {
			node.contents = escapeHtml( node.contents );
		}
	} )

	app.get( '/', function ( req, res ) {
		res.render( 'index', opts );
	} );

	// We browserify the third party modules from node modules so we avoid any legal
	// issues / audits that have to occur on account of including third party code
	var b = browserify();
	b.require(require.resolve('d3'), {
		expose: 'd3'
	});
	b.require(require.resolve('jquery'), {
		expose: 'jquery'
	});
	b.require(require.resolve('lodash'), {
		expose: 'lodash'
	});
	b.bundle( function ( err, buf ) {
		if ( err ) {
			throw err;
		} else {
			opts.thirdPartyDependencies = buf;
			callback( app );
		}
	} );
};
