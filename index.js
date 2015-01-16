#!/usr/bin/env node
var fs = require( 'fs' );
var _  = require( 'lodash' );
var path = require( 'path' );
var argv = require( 'minimist' )( process.argv.slice(2) );
var connect = require( 'connect' );
var serveStatic = require( 'serve-static' );
var open = require( 'open' );
var Depvis = require( './depvis' );
var server = require( './server' );
require( 'es6-promise' ).polyfill();

if ( require.main === module ) {
	require( './cli' )
}

module.exports = Depvis;
