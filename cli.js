#!/usr/bin/env node
var fs = require( 'fs' );
var _  = require( 'lodash' );
var path = require( 'path' );
var argv = require( 'minimist' )( process.argv.slice(2) );
var open = require( 'open' );
var formatSimpleNodes = require( './lib/formatter' ).formatSimpleNodes;
var log = require( 'npmlog' );

var simpleNodesPath = argv.s || argv.simpleNodes;
var currentPath = path.resolve( process.cwd() );
var depvisConfigPath = path.resolve( currentPath, argv.d || argv.dconfig || 'depvis.config.json' );
var hasdepvisConfig = fs.existsSync( depvisConfigPath );

// Set verbosity
if ( argv.v || argv.verbose ) {
	log.level = 'verbose';
}

var done = false;
var depvisOpts;

function processSimpleNodes ( simpleNodesPath ) {
	var resolvedSimpleNodesPath = path.resolve( currentPath, simpleNodesPath );
	if ( fs.existsSync( resolvedSimpleNodesPath ) ) {
		var visData = formatSimpleNodes( JSON.parse( fs.readFileSync( resolvedSimpleNodesPath ) ) );
		done = true;
		log.info( 'fyi', 'Running server from simple nodes...' );
		runServer( visData );
	} else {
		log.error( 'uhm', 'Couldn\'t find a simple node format JSON file at %j. Exiting.', resolvedSimpleNodesPath );
		process.exit( 1 );
	}
}

function processdepvisConfig ( depvisConfig ) {
	log.info( 'fyi', 'Loading depvis config...' );
	if ( depvisConfig.depvisOpts ) {
		depvisOpts = depvisConfig.depvisOpts;
	}

	if ( depvisConfig.simpleDataFile ) {
		log.info( 'fyi', 'Found simpleDataFile option in depvis config file, running simple data visualization procedure.' );
		processSimpleNodes( depvisConfig.simpleDataFile );
		done = true;
		return;
	} else {
		throw new Error( 'Must pass a simpleDataFile option' );
	}
}

function runServer( data ) {
	return new Promise( function ( resolve, reject ) {
		log.info( 'yay', 'Got it! Creating server on http://localhost:' + port + '...' );
		var port = 3000;
		var server = require( './server' )( {
			depvisData: data,
			depvisOpts: depvisOpts
		}, function ( server ) {
			server.listen( port );
			log.info( 'yay', 'Opening your browser (disable with -o false)...' );
			open( 'http://localhost:' + port, function ( err ) {
				if ( err ) reject( err );
			} );
			log.info( 'yay', 'Use Ctrl+C to end process.' );
		} );
	} ).catch( function ( e ) {
		console.log( e.stack );
	} );
}

if ( simpleNodesPath ) {
	log.verbose( 'tmi', 'Simple nodes path option passed.' );
	processSimpleNodes( simpleNodesPath );
// If no simple nodes, check if there is a local depvis config
} else if ( hasdepvisConfig ) {
	log.verbose( 'tmi', 'Found a depvis config file at %j, processing configuration options.', depvisConfigPath );
	var depvisConfig = require( depvisConfigPath );
	processdepvisConfig( depvisConfig );
// If none of that, throw an error and be like, yo, what do you want?
} else {
	log.warn( 'uhm', 'depvis couldn\'t find a local depvis.config.json file and didn\'t receive any configuration. Exiting.' );
	process.exit( 78 );
}

// If we're done - due to simple nodes mode or some other early condition, exit
if ( done ) {
	return;
}
