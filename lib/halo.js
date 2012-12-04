"use strict";

exports.Responder = require('./responder.js').Responder;
exports.Collection = require('./collection.js').Collection;
exports.Model = require('./model.js').Model;
exports.Router = require('./router.js').SocketRouter;

exports.views = {};
exports.views.View = require('./views/view.js').View;
exports.views.Model = require('./views/model.js').ModelView;
exports.views.Collection = require('./views/collection.js').CollectionView;

exports.views.socket = {};
exports.views.socket.Socket = require('./views/socket.js').SocketView;
exports.views.socket.Model = require('./views/socketmodel.js').SocketModelView;
exports.views.socket.Collection = require('./views/socketcollection.js').SocketCollectionView;