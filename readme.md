# Halo


This library makes it quick and easy to build a real-time node backend for Backbone.js clients using Socket.io as the communication protocol.

## Installation
  
```bash
npm install halo
```

## Quick Start/Example

### Back-end

First, require halo

```js
var Halo = require("halo");
```

Next, create a model by calling the extend method on Halo.model.
You can give it an any properties and classProperties you'd like.
You can also give it a constructor (called an initializer). If you
override the default constructor of Halo.model, make sure to call
the parent constructor using this.parent(Halo.Model).constructor
somewhere in your function.

```js    
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
```

Assign a collection to the new model class. Anytime this model is instantiated,
that instance will be added to the collection you specify here.

```js
MyModel.collection = new Halo.Collection({contains: MyModel});    
```

Next, create a View for this model. The View specifies how your model is
represented to front-end clients and how those clients are permitted to 
interact with the model.

```js
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
```

To allow front-end clients to interact with the view, you must create a router
and register the view with it.

```js
var router = new Halo.Router();
router.addView(new MyModelView());
router.listen(80);
```

### Front-end

In your front-end app, include Socket.io and the Halo.sync.js Backbone extension using
the following URLs. These URLs are automatically made available once router.listen() is
invoked.

```html
<script src="/socket.io/socket.io.js"></script>
<script src="/halo/halo.sync.js"></script>
```

Now your Backbone models and collections can be bound to any Halo models or collection
that have view objects registered with the Halo router.

```js
var MyBackboneModel = Backbone.Model.extend({
  url: function() { return "MyModels"; }
});
```

For example, if you created a Backbone model that returned "MyModels" as the URL,
which corresponds to the "name" property of the MyModelView, any time a client saved
a change to a MyModel instance, that change will get pushed to all other clients
who have a copy of that instance of MyModel. Similarly, creating new MyModels
will add that new instance to any Backbone collection connected to MyModels.


## Attribution/Credits

The code for Halo.sync was heavily borrowed from Backbone.ioBind, created by Jake Luer,
and distributed under the MIT license. You can find his original library at 
http://alogicalparadox.com/backbone.iobind/
https://github.com/logicalparadox/backbone.iobind

## License

Released under the MIT license.  See file called LICENSE for more
details.
