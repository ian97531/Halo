"use strict";

var Responder = require('./responder.js').Responder;
var und = require('underscore');


var Session = Responder.extend({
  initializer: function(socket) {
    this.parent(Responder).constructor();
    this.client = socket;
    this.id = this.client.id;
    this._objectBindings = {};
    
    var self = this;
    this.client.on('disconnect', function() {
      self.unbindFromAll();
    });
  },
  
  properties : {
    client : false,
    id: false,
    
    onMessage : function(eventName, callback, context) {
      var self = this;
      
      this.client.on(eventName, function(data, cb) {
        var reply = callback.apply(context, [self, data]);
        
        if (reply instanceof Error) {
          cb(reply.message, false);
        }
        else if (reply){
          cb(false, reply);
        }
        
      });
    },
    
    bindOnce: function(model, eventName, callback, context, name) {
      var id = model.id || name;
      
      if (!id) {
        throw "Unable to bindOnce using an object that has no id when no name is provided.";
      }
      
      id = id + "_" + eventName;
      if(!this._objectBindings[id]) {
        this._objectBindings[id] = {cb: callback, ctx: context};
        return this.bindTo(model, eventName, callback, context);
      }
      
      return false;
      
    },
    
    unbindOnce: function(model, eventName, name) {
      var id = model.id || name;
      
      if (!id) {
        throw "Unable to unbindOnce using an object that has no id when no name is provided.";
      }
      
      if(this._objectBindings[id]) {
        var binding = this._objectBindings[id];
        var result = this.unbindFrom(model, eventName, binding.cb, binding.ctx);
        if (result) {
          delete this._objectBindings[id];
        }
        
        return result;
      }
    },
    
    emit : function(eventName, payload) {
      this.client.emit(eventName, payload);
    }
  }
});

exports.Session = Session;