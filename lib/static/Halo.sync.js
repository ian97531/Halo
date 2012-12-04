// Copyright (c) 2012 Ian White
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy 
// of this software and associated documentation files (the "Software"), to deal 
// in the Software without restriction, including without limitation the rights 
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
// copies of the Software, and to permit persons to whom the Software is 
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all 
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
// SOFTWARE.

// This software is based on Backbone.ioBind by Jake Luer and distributed
// at http://alogicalparadox.com/backbone.iobind/


(function (undefined) {
  // Common JS // require JS
  var _, Backbone, exports;
  if (typeof window === 'undefined' || typeof require === 'function') {
    _ = require('use!underscore');
    Backbone = require('use!backbone');
    exports = Backbone;
  } else {
    _ = this._;
    Backbone = this.Backbone;
    exports = this;
  }


Backbone.Model.prototype.ioBind = function (eventName, io, callback, context) {
  if (!this.url()) {
    return;
  }
  
  var ioEvents = this._ioEvents || (this._ioEvents = {})
    , globalName = this.url() + "/" + this.id + ':' + eventName
    , self = this;
  if ('function' == typeof io) {
    context = callback;
    callback = io;
    io = this.socket || window.socket || Backbone.socket;
  }
  var event = {
    name: eventName,
    global: globalName,
    cbLocal: callback,
    cbGlobal: function (data) {
      self.trigger(eventName, data);
    }
  };
  this.bind(event.name, event.cbLocal, (context || self));
  io.on(event.global, event.cbGlobal);
  if (!ioEvents[event.name]) {
    ioEvents[event.name] = [event];
  } else {
    ioEvents[event.name].push(event);
  }
  return this;
};


Backbone.Model.prototype.ioUnbind = function (eventName, io, callback) {
  var ioEvents = this._ioEvents || (this._ioEvents = {})
    , globalName = this.id + ':' + eventName;
  if ('function' == typeof io) {
    callback = io;
    io = this.socket || window.socket || Backbone.socket;
  }
  var events = ioEvents[eventName];
  if (!_.isEmpty(events)) {
    if (callback && 'function' === typeof callback) {
      for (var i = 0, l = events.length; i < l; i++) {
        if (callback == events[i].cbLocal) {
          this.unbind(events[i].name, events[i].cbLocal);
          io.removeListener(events[i].global, events[i].cbGlobal);
          events[i] = false;
        }
      }
      events = _.compact(events);
    } else {
      this.unbind(eventName);
      io.removeAllListeners(globalName);
    }
    if (events.length === 0) {
      delete ioEvents[eventName];
    }
  }
  return this;
};


Backbone.Model.prototype.ioUnbindAll = function (io) {
  var ioEvents = this._ioEvents || (this._ioEvents = {});
  if (!io) io = this.socket || window.socket || Backbone.socket;
  for (var ev in ioEvents) {
    this.ioUnbind(ev, io);
  }
  return this;
};

Backbone.Model.prototype.ioServerBind = function() {
  if (!this._boundToServer) {
    this._boundToServer = true;
    this.ioBind('serverchange', Backbone.socket, this.ioServerChange, this);
    this.ioBind('serverdestroy', Backbone.socket, this.ioServerDestroy, this);
  }
};

Backbone.Model.prototype.ioServerChange = function(changes) {
  var changed = _.clone(this.changed);
  this.set(changes);
  this.changed = changed;
};

Backbone.Model.prototype.ioServerDestroy = function() {
  this.ioUnbindAll(Backbone.socket);
  if(this)
  this.destroy();
};

Backbone.Model.prototype.disconnect = function() {
  Backbone.sync('disconnect', this);
};


Backbone.Collection.prototype.ioBind = function (eventName, io, callback, context) {
  var ioEvents = this._ioEvents || (this._ioEvents = {});
  var globalName = (this.id) ? this.url + '/' + this.id + ':' + eventName : this.url + ':' + eventName;
  var self = this;
  if ('function' == typeof io) {
    context = callback;
    callback = io;
    io = this.socket || window.socket || Backbone.socket;
  }
  var event = {
    name: eventName,
    global: globalName,
    cbLocal: callback,
    cbGlobal: function (data) {
      self.trigger(eventName, data);
    }
  };
  this.bind(event.name, event.cbLocal, context);
  io.on(event.global, event.cbGlobal);
  if (!ioEvents[event.name]) {
    ioEvents[event.name] = [event];
  } else {
    ioEvents[event.name].push(event);
  }
  return this;
};

Backbone.Collection.prototype.ioUnbind = function (eventName, io, callback) {
  var ioEvents = this._ioEvents || (this._ioEvents = {})
  var globalName = false;
  if (this.id) {
    globalName = this.url + "/" + this.id + ':' + eventName;
  }
  else {
    globalName = this.url + ':' + eventName;
  }
  
  if ('function' == typeof io) {
    callback = io;
    io = this.socket || window.socket || Backbone.socket;
  }
  var events = ioEvents[eventName];
  if (!_.isEmpty(events)) {
    if (callback && 'function' === typeof callback) {
      for (var i = 0, l = events.length; i < l; i++) {
        if (callback == events[i].cbLocal) {
          this.unbind(events[i].name, events[i].cbLocal);
          io.removeListener(events[i].global, events[i].cbGlobal);
          events[i] = false;
        }
      }
      events = _.compact(events);
    } else {
      this.unbind(eventName);
      io.removeAllListeners(globalName);
    }
    if (events.length === 0) {
      delete ioEvents[eventName];
    }
  }
  return this;
};

Backbone.Collection.prototype.ioUnbindAll = function (io) {
  var ioEvents = this._ioEvents || (this._ioEvents = {});
  if (!io) io = this.socket || window.socket || Backbone.socket;
  for (var ev in ioEvents) {
    this.ioUnbind(ev, io);
  }
  return this;
};

Backbone.Collection.prototype.ioServerBind = function() {
  _.each(this.models, function(model) {
    model.ioServerBind();
  }, this)
  this.ioBind('serveradd', Backbone.socket, this.ioServerAdd, this);
  this.ioBind('serverremove', Backbone.socket, this.ioServerRemove, this);
};

Backbone.Collection.prototype.ioServerAdd = function(models) {
  _.each(models, function(attrs) {
    var model = new this.model()
    var changed = _.clone(model.changed);
    model.set(attrs);
    model.changed = changed;
    model.ioServerBind();
    this.add(model);
  }, this);
};

Backbone.Collection.prototype.ioServerRemove = function(models) {
  this.remove(models);
  _.each(models, function(attributes) {
    var model = this.get(attributes.id)
    if (model) {
      this.remove(model);
    }
  }, this);
};

Backbone.Collection.prototype.disconnect = function() {
  Backbone.sync('disconnect', this);
};

Backbone.sync = function (method, model, options) {
  var getUrl = function (object) {
    if (object && object instanceof Backbone.Model) {
      return object.url && object.url();
    }
    else if (object) {
      return object.url;
    }
  };

  var cmd = getUrl(model).split('/')
    , namespace = (cmd[0] !== '') ? cmd[0] : cmd[1]; // if leading slash, ignore

  var params = _.extend({
    req: namespace + ':' + method
  }, options);

  params.data = model.toJSON() || {};
  
  if (model instanceof Backbone.Collection && method === 'read') {
    if (model.id) {
      params.data = (model.id) ? {id: model.id} : params.data;
    }
    else {
      method = 'list';
    }
  }

  // If your socket.io connection exists on a different var, change here:
  var io = model.socket || window.socket || Backbone.socket;
  io.emit(namespace + ':' + method, params.data, function (err, data) {
    if (err) {
      options.error(err);
    } else {
      options.success(data);
      if(method === 'read' || method === 'create' || method === 'list') {
        model.ioServerBind();
      }
    }
  });
};

})();
