"use strict";

var SocketView = require('./socket.js').SocketView;
var Model = require('../model.js').Model;
var und = require('underscore');

var SocketModelView = SocketView.extend({
  initializer : function(name, model, routes) {
    this.parent(SocketView).constructor(model, name, routes);
    
    if (!this.obj.inheritsFrom(Model)) {
      throw "ModelViews require a model object";
    }
  },
  
  properties : {
    
    routes : {
      create    : 'create', 
      read      : 'read', 
      update    : 'update', 
      destroy   : 'destroy', 
      list      : 'list', 
    },

    render : function(client, model, attributes) {
      return model.xport(attributes)
    },
    
    update : function(client, data) {
      var model = this.container.get(data.id);
      model.set(data);
      return this.render(client, model, data);
    }
  }
});

exports.SocketModelView = SocketModelView;
