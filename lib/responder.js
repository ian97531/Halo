"use strict";

var Origin = require('origin');
var und = require('underscore');

exports.Responder = Origin.extend({
  
  initializer: function() {
    this._responderCallbacks = {};
    this._responderBindings = [];
  },
  
  properties: {
    
    /*
       Function: on
       Registers a callback for an event. When trigger is called on this object
       and passed the same eventName, all callbacks registered using the on
       function for the eventName will be called and passed an event object.

       Parameters:
          eventName - A String event name
          callback - A function to be called when the eventName is triggered
          context - (Optional) An object to be used as the context for the callback

       Returns:
          A boolean value. True if the callback was registered, false if the callback
          already exists.
    */
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
    
    /*
       Function: on
       Removes callbacks previous registered with the on method. If a given argument
       is ommitted, all callbacks matching the provided arguments will be removed.

       Parameters:
          eventName - (Optional) A String event name
          callback - (Optional) A function to be called when the eventName is triggered
          context - (Optional) An object to be used as the context for the callback

       Returns:
          A boolean value. True if a callback was found and removed, false otherwise.
    */
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
    
    
    /*
       Function: bindTo
       Similar to the 'on' method, but called on the listening object rather
       than the triggered object. The benefit of 'bindTo' is that all callbacks
       can be removed using a single method 'unbindFromAll'. This is particularly
       useful when you're disposing of an object and want to remove all callbacks
       to that object to avoid a memory leak.

       Parameters:
          model - An object to bind to for the given event
          eventName - A String event name
          callback - A function to be called when the eventName is triggered
          context - (Optional) An object to be used as the context for the callback

       Returns:
          A boolean value. True if the callback was registered, false if the callback
          already exists.
    */
    bindTo: function(model, eventName, callback, context) {
      if (model.on(eventName, callback, context)) {
        this._responderBindings.push({model: model, eventName: eventName, callback: callback, context: context});
        return true;
      }
      return false;
    },
    
    
    /*
       Function: unbindFrom
       Removes bindings created with the bindTo method.

       Parameters:
          model - An object to remove the binding from
          eventName - A String event name
          callback - A function to be called when the eventName is triggered
          context - (Optional) An object to be used as the context for the callback

       Returns:
          A boolean value. True if the binding was removed, false otherwise.
    */
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
    
    /*
       Function: unbindFromAll
       Removes all bindings that were created using bindTo. This is particularly useful
       when disposing of an object to avoid a memory leak.

       Returns:
          Returns true once all of the bindings are removed.
    */
    unbindFromAll : function() {
      und.each(this._responderBindings, function(binding) {
        binding.model.off(binding.eventName, binding.callback, binding.context);
      });
      this._responderBindings = [];
      return true;
    },
    
    
    /*
       Function: trigger
       Triggers an event of the given name. Any listeners registered with the 'on'
       method for the same eventName will have their callbacks called.

       Parameters:
          eventName - A String event name
          eventData - Any data to be included in the event object passed to each callback.

    */
    trigger: function(eventName, eventData) {
      
      // Construct the event object
      var eventObject = {
        sender: this,
        name: eventName,
        payload: eventData
      };
      
      this.repeat(eventObject);
    },
    
    /*
       Function: repeat
       Takes an event object and will resend it to any listeners register
       with the 'on' method for the eventName specified in the event object.

       Parameters:
          event - An event object

    */
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