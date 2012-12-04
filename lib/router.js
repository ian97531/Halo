"use strict";

var Responder = require('./responder.js').Responder;
var Session = require('./session.js').Session;
var und = require('underscore');
var http = require('http');
var sockets = require('socket.io');
var fs = require('fs');

var staticDir = __dirname + "/static/";


exports.SocketRouter = Responder.extend({
  initializer : function(server, views) {
    this.parent(Responder).constructor();
    
    if(server instanceof Array) {
      views = server;
      this.server = http.createServer();
    }
    else {
      this.server = server;
    }
    
    this.oldListeners = this.server.listeners('request').splice(0);
    
    var self = this;
    this.server.on('request', function (req, res) {
      self.handleRequest(req, res);
    });
    
    var io = sockets.listen(this.server);
    io.set('log level', 1);
    this.socket = io.sockets;
    
    // Compose the custom routes
    this.views = views || this.views || [];
    this.sessions = [];
  },
  
  
  properties : {
    socket : false,
    views : false,
    sessions : false,
    
    listen : function(port) {
      var self = this;
      this.socket.on('connection', function(client) {
        var session = new Session(client);
        self.sessions.push(session);
        
        und.each(self.views, function(view) {
          view.openRoutes(session);
        });
      });
      
      this.server.listen(port || 80);
    },
    
    addView : function(view) {
      this.views.push(view);
      und.each(this.sessions, function(session) {
        view.openRoutes(session);
      });
    },
    
    handleRequest : function(req, res) {
      if(req.url.indexOf('/halo/') === 0) {
        // Get the requested file and send it to client.
        fs.readFile(staticDir + req.url.substring(6),
        function (err, data) {
          if (err) {
            res.writeHead(500);
            return res.end('Error loading ' + req.url);
          }
          res.writeHead(200);
          res.end(data);
        });
      }
      else {
        und.each(this.oldListeners, function(listener) {
          listener.call(this.server, req, res);
        }, this);
        return;
      }
    }
  
  }
});






