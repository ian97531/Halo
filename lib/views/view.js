"use strict";

var Responder = require('../responder.js').Responder;
var Model = require('../model.js').Model;
var Collection = require('../collection').Collection;
var und = require('underscore');


var View = Responder.extend({
  initializer : function(name) {
    this.parent(Responder).constructor(name);
    this.name = name || this.name;
    if (!this.name) {
      throw "All Views must be have the name property set.";
    }
  },
  properties : { 
    name : undefined,
    
    render : function() {
      return false;
    },
    
    id : function() {
      return this.name;
    }
  }
});

exports.View = View;
