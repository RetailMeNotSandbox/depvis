# Depvis

Depvis is a language-agnostic node dependency visualization tool. Powered by d3, Node.js, and the love of a warm 80 degree sun. Currently MAJORLY ALPHA / WIP.

## A dependency visualization tool?

Yes! In plain English, that means that you can feed Depvis a dataset representing a bunch of nodes that require on other nodes and it will generate a force-directed graph allowing you to explore the network. Where I say "node", read anything from "file" to "npm package" to "person in a network". Depvis exists to make it easier to understand the relationships between complex dependencies.

Depvis is a system composed of three primary components and a CLI:

- **Visualization server** - Express server that hosts the interactive visualization application. This application consumes your graphable data and can be exposed as middleware to another Express application.
- **CLI** - A command line interface that wraps the visualization server, driven by a local `depvis.config.json` file or command line arguments.

## How many nodes can it handle?

This depends on your computer's specs. A 2014 MacBook Pro can uncomfortably display around 600 nodes and 1200 links, whereas looking at 50 - 100 is very smooth. It's recommended that you simply look at smaller subsections of your total dependencies at a time, but if you need to analyze a truly massive amounts of nodes, I recommend a tool like [Gephi](https://gephi.org/).

![](http://i.imgur.com/mHBN7lM.jpg)

[See large image](http://i.imgur.com/mHBN7lM.png)

# Getting Started

## Installation

For the CLI:

```bash
npm install -g depvis
```

For usage in your project (via its API):

```bash
npm install depvis
```

## Ways to Use It

### From the CLI

Depvis can be used pretty simply from the CLI. Here's how you would run Depvis with the AMD loader against the folder `scripts` with a RequireJS config file:

```
depvis -d depvis.config.json
```

#### CLI Options

|option|description|
|-|-|
|`-s`, `--simpleNodes`|If you're using the Simple Dependency Node format, you can specify the JSON file that contains your Simple Dependency Nodes here.|
|`-d`, `--dconfig`|If you have an existing Depvis configuration file that is not named `depvis.config.json`, or does not exist in the directory you're running `depvis` from, you can specify it here.|

### From a configuration `depvis.config.json` object

You can create a `depvis.config.json` file in your project directory and run `depvis` from the command line without any arguments to use the options in the config file.

Here's what a `depvis.config.json` should look like:

```
{
	"depvisOpts": {}, // optional - put visualization options here if you want
	"simpleDataFile": "simple.json"
}
```

#### Config File Options

|option|description|
|----|----|
|depvisOpts|Visualization-application specific options go here. See the Visualization Server Options section for more information.|
|simpleDataFile|If you're using the Simple Dependency Node format, you can specify the JSON file that contains your Simple Dependency Nodes here.|

# Depvis Visualization Server

## Interacting with the visualization view

The visualization supports many interactions.

* Hold the space bar and click and drag to pan around the view; hold the space bar and scroll to zoom in and out.
* Click on any node to see what nodes it depends on and what nodes depend on it.
* Click and drag on a node to "pin" it to a location and organize the view. Double-click the node to unpin it.
* Click "Fix All Nodes" to fix nodes into their positions. This is useful to keep them from wiggling too much.
* Click "Freeze Graph" to freeze the graph. This differs from "Fix All Nodes" in that if you move any of the nodes, the whole graph unfreezes.
* Check "Hide irrelevant files on select" to make the graph hide any nodes that aren't dependencies of, depended on by, or the selected node itself, when a node is selected. (WARNING: THIS IS VERY SLOW WITH MORE THAN ~50 NODES. Want it to be faster? Contribute a fix!)
* Checking or unchecking "highlight deep dependencies" will enable/disable nodes that indirectly depend on / are depended on by the selected node to be highlighted. This is useful for seeing the full extent of a node's usage.
* When a node is selected and the tree view is open, you can click on any of the links to the nodes that depend on or are dependencies of the selected node to select those nodes.

There are a couple different visual effects applied to tell you things about the nodes:

* Lines indicate dependencies between files. Blue arrows point the direction of the dependency (an arrow from A -> B means that A depends on B).
* When a node is selected, it will highlight green. Any nodes that are highlighted in red are nodes that depend on the selected node. Any nodes that are highlighted in blue are nodes that are dependencies of the selected node. This means that if you were to break the functionality of the selected node, the red nodes would probably break, too. If you were to break the functionality of the blue nodes, the selected node would probably break, too.
* Nodes that are slightly darker are "fixed" in position and won't move with the rest of the graph.
* Large, blue nodes are nodes that are not depended on by any other node and are considered "top-level" or "primary" nodes.

## Visualization Server Options

The visualization server can take a number of options that can be used to tweak the display of your dependency graph. You can pass this object into the function that `require( 'depvis/server' )` returns or into the `depvisOpts` property of a Depvis config file, with any of these options:

```javascript
{
		/*
		If included in another app, you may need to serve
		Depvis's static assets out of another directory.
		Set the baseUrl to indicate the route where the
		Depvis server lives.
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
			distanceModifier: 0.1,
			/*
			If set to a Number, Depvis will instantly run the number of frames
			specified of its force-directed layout. This is useful for getting a
			large, tangled Depvis graph to unravel itself instantly on-load.
			*/
			autoTick: 200,
			/*
			If set to true, this will fix every node in place immediately on
			the start of the Depvis graph. This can keep the graph from
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
			hideControls: false
		}
	};
```

## Using the visualization server programmatically

### Spinning up the visualization server as a standalone app

To run the app in standalone mode, we just need to call `listen` on the DepvisServer.

```javascript
// See the Simple Dependency Nodes section to learn more about how to pass data to Depvis
var depvisData = getDepvisData();
var server = DepvisServer( {
	depvisData: depvisData
} );
server.listen( 3001 ); // or whatever port you like

// If you wanted to automatically launch the server on startup, you can use the `open` npm package
var open = require( 'open' );
open( 'http://localhost:' + 3000, function ( err ) {
	if ( err ) throw new Error( err );
} );
```

### Integrating the visualization server with your app

In order to run the app as a route in another Express app, instead of using `server.listen` you should be able to call `use` on your own Express app and pass in the DepvisServer:

```javascript
var depvisData = getDepvisData();
var express = require( 'express' );
var myApp = express();
var depvisRoot = '/depvis-embed/';
var server = depvisServer( {
	// The route you'll be running Depvis from (required for it to pick up
	// static assets properly)
	baseUrl: depvisRoot,
	depvisData: depvisData
} );
myApp.use( depvisRoot, depvisServer );
```

Specifically, requiring the server component returns a function, which when called with options, defines its top level route to render the graphing app's view, with your given options passed along, and then returns the whole server component. You can then use the returned express app as middleware in another express-style application with app.use.

# Creating data for depvis: Simple Dependency Nodes

A Simple Dependency Node is the core data type used by depvis. You can pass these directly to the visualization tool, skipping all of the previous steps outlined above. The visualization tool needs very little data to actually work, and Depvis has a utility function that can convert an array of Simple Dependency Nodes into the data structure necessary to work with the visualization tool. Here's all you need in a Simple Dependency Node:

```javascript
[
	{
		// A nodeName (it must be unique though)
		nodeName: String,
		// An array of Strings matching nodeNames
		dependencyLinks: []
	},
	// ... more nodes ...
]
```

### Using Simple Dependency Nodes from the CLI

Define a file of Simple Dependency Nodes and then reference it using the `-s` or `--simpleNodes` option in the CLI:

```
depvis -s simple.json
```

### Using Simple Dependency Nodes from `depvis.config.json`

To automatically load Simple Dependency Nodes from your Depvis configuration file, just add the `simpleDataFile` key and the filename as the value. (NOTE: You must also *not* specify a loader to use Simple Dependency Nodes with your config. Depvis prioritizes loader options over Simple Dependency Nodes.)

```json
{
	"simpleDataFile": "simple.json"
}
```

Then run Depvis from the CLI:

```
depvis
```

###  Setting up Simple Dependency Nodes programmatically

```javascript
var Depvis = require( 'depvis' );
var DepvisServer = require( 'depvis/server' );
var formatter = require( 'depvis/lib/formatter.js' );
// You could also load this form a server
var simpleNodes = [
	{
		nodeName: 'a',
		dependencyLinks: [ 'b', 'c' ]
	},
	{
		nodeName: 'b',
		dependencyLinks: []
	},
	{
		nodeName: 'c',
		dependencyLinks: []
	}
];
var depvisData = formatter.formatSimpleNodes( simpleNodes );
var server = DepvisServer( {
	depvisData: depvisData
} );
```

NOTE: If you use the simple format, you *must* run your nodes through the `formatSimpleNodes()` function. It does some other transformations that are required by the visualization tool to function.

# Contributing

If you're interested in contributing, feel free to make a pull request. Note that depvis is still very much a work-in-progress.
