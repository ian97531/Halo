Halo
=============


This library makes it quick and easy to build a real-time node backend for Backbone.js clients using Socket.io as the communication protocol.

Installation
------------

    npm install halo

Quick Start/Example
-----------

    // Get the Halo library
    var Halo = require('halo');
    
    // Create a new model
    var MyModel = Halo.Model.extend({
      initializer : function(options) {
        // Call the parent pseudo-class's constructor.
        this.parent(Halo.Model).constructor(options);
        
        // Initialize your model
      },

      properties : {
        defaults : {
          someProperty : "a default value"
        },

        someMethod : function() {
          // Do some stuff
        },
        
        someOtherMethod : function() {
          // Do some other stuff
        }
      }
    });
    
    // Create a collection to hold the instances of MyModel
    MyModel.collection = new Halo.Collection({contains: MyModel});    
    
    // Create a view model. This determines how your model can be
    // viewed and interacted with by clients
    var MyModelView = Halo.views.socket.Model.extend({
      properties : {
        
        // The name string should be used as your Backbone.js Model's URL.
        name : "MyModels", 
        obj : MyModel,
        
        // This dictionary defines what your front-end clients have 
        // permission to do. Possible values include: 
        // create, read, update, destroy, list
        routes : {
          'create'  : 'create',
          'read'    : 'read',
          'update'  : 'update',
          'list'    : 'list'
        },

        // If you have custom logic for a given action, just
        // provide a function with the name of the action.
        update : function(client, data) {
          
          var myModel = MyModel.collection.get(data.id);

          if (!myModel.get('someProperty' !== "a default value")) {
            
            // When setting properties on a model, you can pass in
            // an array limiting the names of the properties to set.
            myModel.set(data, ['someProperty']);
          }
          return this.render(client, myModel, data);
        }
      }
    });

    var voteView = new VoteView();
    
    // Create a router object and add the views that you'd like
    // external clients to be able to access.
    var router = new Halo.Router();
    router.addView(voteView);
    router.listen(80);

    // Now you can create a Backbone model and collection for the MyModel
    // with the URL property set to "MyModels". Any time a any client saves
    // a change to a model, that change will get pushed to all other clients
    // who have a copy of that instance of MyModel. Creating new MyModels
    // will add that new instance to any Backbone collection connected to
    // MyModels.


Attribution/Credits
-------------------

The code for Halo.sync was heavily borrowed from Backbone.ioBind, created by Jake Luer,
and distributed under the MIT license. You can find his original library at 
http://alogicalparadox.com/backbone.iobind/
https://github.com/logicalparadox/backbone.iobind

License
-------------------

Released under the MIT license.  See file called LICENSE for more
details.
