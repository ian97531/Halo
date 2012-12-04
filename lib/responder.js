"use strict";

var Root = require('./root.js').Root;
var und = require('underscore');

exports.Responder = Root.extend({
  
  initializer: function() {
    this._responderCallbacks = {};
    this._responderBindings = [];
  },
  
  properties: {
  
    on: function(eventName, callback, context) {
      eventName = eventName || "all";
      
      if (callback) {
        if (!this._responderCallbacks[eventName]) {
          this._responderCallbacks[eventName] = [];
        }
        
        // Check to see if this exact callback already exists. Having duplicate callbacks
        // isn't useful.
        var callbackExists = und.find(this._responderCallbacks[eventName], function(cb) {
          return (cb.callback === callback && cb.context === context);
        });
        
        if (!callbackExists) {
          this._responderCallbacks[eventName].push({callback: callback, context: context});
          return true;
        }
        return false;
      }
      return false;
    },
  
    off: function(eventName, callback, context) {
      var removes = [];
      var success = false;
      
      if(this._responderCallbacks[eventName] && callback) {
        removes = und.filter(this._responderCallbacks[eventName], function(cb) {
          return (cb.callback === callback && cb.context === context);
        }, this);
        
        if (removes.length) {
          this._responderCallbacks[eventName] = und.difference(this._responderCallbacks[eventName], removes);
          return true;
        }
        return false;
      }
      else if (this._responderCallbacks[eventName] && !callback && context) {
        removes = und.filter(this._responderCallbacks[eventName], function(cb) {
          return (cb.context === context);
        }, this);
        
        if (removes.length) {
          this._responderCallbacks[eventName] = und.difference(this._responderCallbacks[eventName], removes);
          return true;
        }
        return false;
      }
      else if (this._responderCallbacks[eventName] && !callback) {
        delete this._responderCallbacks[eventName];
        return true;
      }
      else if (!eventName && callback) {
        und.each(this._responderCallbacks, function(cbs, eventName) {
          success = this.off(eventName, callback) || success;
        }, this);
        return success;
      }
      else if (!eventName && !callback && context) {
        und.each(this._responderCallbacks, function(cbs, eventName) {
          success = this.off(eventName, null, context) || success;
        }, this);
        return success;
      }
      else if (!eventName && !callback && !context) {
        if (und.size(this._responderCallbacks)) {
          this._responderCallbacks = {};
          return true;
        }
        return false;
      }
      return false;
    },
    
    bindTo: function(model, eventName, callback, context) {
      if (model.on(eventName, callback, context)) {
        this._responderBindings.push({model: model, eventName: eventName, callback: callback, context: context});
        return true;
      }
      return false;
    },
    
    unbindFrom : function(model, eventName, callback, context) {
      if(model.off(eventName, callback, context)) {
        var removals = [];
        und.each(this._responderBindings, function(binding) {
          if (binding.model === model && 
              binding.eventName === eventName && 
              binding.callback === callback && 
              binding.context === context) {
            removals.push(binding);
          }
        }, this);
        
        this._responderBindings = und.difference(this._responderBindings, removals);
        
        return (removals.length > 0);
      }
    },
    
    unbindFromAll : function() {
      und.each(this._responderBindings, function(binding) {
        binding.model.off(binding.eventName, binding.callback, binding.context);
      });
      this._responderBindings = [];
      return true;
    },
    
    trigger: function(eventName, eventData) {
      
      // Construct the event object
      var eventObject = {
        sender: this,
        name: eventName,
        payload: eventData
      };
      
      this.repeat(eventObject);
    },
    
    repeat : function(event) {
      var eventCallbacks = this._responderCallbacks[event.name] || [];
      var allCallbacks = this._responderCallbacks['all'] || [];
      var callbacks = und.union(eventCallbacks, allCallbacks);
      if (callbacks.length) {

        // Pass the event to each of the callbacks for this event
        und.each(callbacks, function(cb) {
          var eventClone = und.clone(event);
          if (cb.context) {
            cb.callback.call(cb.context, eventClone);
          }
          else {
            cb.callback(eventClone);
          }
        });
      }
    } 
  }
  
});