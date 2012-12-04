"use strict";

var View = require('./view.js').View;
var und = require('underscore');

var ModelView = View.extend({
  initializer : function(name, model) {
    this.parent(View).constructor(name);
    
    this.model = model || this.model;
    if (!model.inheritsFrom(Model)) {
      throw "ModelViews require a model object";
    }
  },
  
  properties : {
    model : undefined,
    
    render : function(client, model, attributes) {
      return model.xport(attributes);
    }
    
  }
});

exports.ModelView = ModelView