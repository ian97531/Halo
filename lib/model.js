"use strict";

var Storable = require('./storable').Storable;
var und = require('underscore');

exports.Model = Storable.extend({
  initializer: function(attributes, options) {
    
    // For maintaining state in storage.
    this._destroyed = false;
    this.attributes = {};
    this._changes = {};
    
    // Copy the defaults into the attributes
    und.each(this.defaults, function(value, attribute) {
      this.attributes[attribute] = this.defaults[attribute];
    }, this);
    
    // If any attributes are specified, copy them over
    if (attributes) {
      und.each(attributes, function(value, attribute) {
        this.attributes[attribute] = attributes[attribute];
      }, this);
    }
    
    this.parent(Storable).constructor(options);
  },
  
  properties: {
        
    keyAttribute: "id",
    defaults: {},
    
    get: function(attribute) {
      return this.attributes[attribute];
    },
  
    set: function(values, attrs) {
      if (!this.isDestroyed() && values) {
        var updatedAttributes = [];
        und.each(values, function(value, attribute) {
          if(this.attributes[attribute] !== value && attribute !== this.keyAttribute) {
            if (!attrs || attrs.indexOf(attribute) !== -1) {
              this.attributes[attribute] = value;
              updatedAttributes.push(attribute);
            }
          }
        }, this);
        
        if (updatedAttributes.length) {
          this.trigger("change", updatedAttributes);
        }       
      }
    },
    
    has : function(attribute) {
      return this.attributes[attribute] !== undefined;
    },
    
    clear : function(attribute) {
      var values = {};
      values[attribute] = undefined;
      this.set(values);
    },
    
    test : function(attributes) {
      return Object.keys(attributes).every(function(attribute) {
        return (this.get(attribute) === attributes[attribute]);
      }, this);
    },
    
    xport : function(attributes) {
      attributes = attributes || und.keys(this.attributes);
      var values = {};
      und.each(attributes, function(key) {
        values[key] = this.attributes[key];
      }, this);
      return values;
    },
    
    resume : function() {
      this.parent(Storable).resume();
      if(und.size(this._changes)) {
        this.trigger("change", this._changes);
        this._changes = {};
      }
    },
    
    trigger : function(eventName, eventData) {
      this.parent(Storable).trigger(eventName, eventData);
      
      // For the change events, if we've been given a set of attributes,
      // blow out that dictionary and send one event for each attribute
      // in addition to the event for all attributes.
      if (eventName === "change" && eventData) {
        und.each(eventData, function(key) {
          this.trigger(eventName + ":" + key, eventData);
        },this);
      }
    }
  }
  
});
