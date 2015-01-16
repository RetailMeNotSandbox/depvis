var graph;
// Use Handlebars-style interpolation because <% conflicts with .ejs
_.templateSettings = {
    evaluate:    /\{\{(.+?)\}\}/g,
    interpolate: /\{\{=(.+?)\}\}/g,
    escape:      /\{\{-(.+?)\}\}/g
};
$( function () {
    var nodeInfo = new NodeInfo( '.js-node-info' );
    var nodeTree = new NodeTree( '.js-node-tree', depvisData.tree );
    graph = new DependencyGraph( '.container', depvisData );
} );
