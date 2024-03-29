/**
    A manager for all the objects in the game
    @author <a href="mailto:matthewcasperson@gmail.com">Matthew Casperson</a>
    @class
 */
function GameObjectManager()
{
  /** An array of game objects 
        @type Arary
   */
  this.gameObjects = new Array();
  
  /**
    Removes a specific object from the array
    @param object The object to remove
  */
  this.removeObject = function(object)
  {
    for (var i in this.gameObjects)
    {
        if (this.gameObjects[i] === object)
        {
            this.gameObjects.splice(i, 1);
            break;
        }
    }
  };
  
  /** The time that the last frame was rendered  
        @type Date
   */
  this.lastFrame = new Date().getTime();
  /** The global scrolling value of the x axis  
        @type Number
   */
  this.xScroll = 0;
  /** The global scrolling value of the y axis  
        @type Number
   */
  this.yScroll = 0;
  /** A reference to the canvas element  
        @type HTMLCanvasElement
   */
  this.canvas = null;
  /** A reference to the 2D context of the canvas element
        @type CanvasRenderingContext2D
   */
  this.context2D = null;
  /** A reference to the in-memory canvas used as a back buffer 
        @type HTMLCanvasElement
   */
  this.backBuffer = null;
  /** A reference to the backbuffer 2D context 
        @type CanvasRenderingContext2D
   */
  this.backBufferContext2D = null;
  /** True if the canvas element is supported, false otherwise
        @type Boolean
   */
  this.canvasSupported = false;
  /** True if the resources supplied to the ResourceManager are all loaded, false otherwise
        @type Boolean
   */
  this.resourcesLoaded = false;
  /** The current colour of the loading screen
        @type Number
   */
  this.loadingScreenCol = 0;
  /** The direction of the changes to the loading screen colour.
		1 = colour moving towards white
		-1 = colour moving topwards balck
        @type Number
   */	
  this.loadingScreenColDirection = 1;
  /** How quickly to change the loading screen colour per second
        @type Number
   */
  this.loadingScreenColSpeed = 255;

  /**
        Initialises this object
        @return A reference to the initialised object
   */
  this.startupGameObjectManager = function()
  {
    // set the global pointer to reference this object
    g_GameObjectManager = this;
    
    g_score = 0;
    g_lives = 3;
    g_level = 1;
    
    document.getElementById('game_over').style.display='none';
    
    // watch for keyboard events
    document.onkeydown = function(event){g_GameObjectManager.keyDown(event);};
    document.onkeyup = function(event){g_GameObjectManager.keyUp(event);};

    // get references to the canvas elements and their 2D contexts
    this.canvas = document.getElementById('canvas');

    // if the this.canvas.getContext function does not exist it is a safe bet that
    // the current browser does not support the canvas element.
    // in this case we don't go any further, which will save some debuggers (like
    // the IE8 debugger) from throwing up a lot of errors.
    if (this.canvas.getContext)
    {
      this.canvasSupported = true;
      this.context2D = this.canvas.getContext('2d');
      this.backBuffer = document.createElement('canvas');
      this.backBuffer.width = this.canvas.width;
      this.backBuffer.height = this.canvas.height;
      this.backBufferContext2D = this.backBuffer.getContext('2d');
    }

    // create a new ResourceManager
    new ResourceManager().startupResourceManager(g_resources);

    // use setInterval to call the draw function
    this.loop = setInterval(function(){g_GameObjectManager.draw();}, SECONDS_BETWEEN_FRAMES);

    return this;        
  };

  /**
        The render loop
   */
  this.draw = function ()
  {
    // calculate the time since the last frame
    var thisFrame = new Date().getTime();
    var dt = (thisFrame - this.lastFrame)/1000;
    this.lastFrame = thisFrame;

    if (!this.resourcesLoaded)
    {
      var numLoaded = 0;
      for (var i = 0; i < g_ResourceManager.imageProperties.length; ++i)
      {
        if (g_ResourceManager[g_ResourceManager.imageProperties[i]].complete)
          ++numLoaded;
      }

      if ( numLoaded == g_ResourceManager.imageProperties.length )
      {
        // create a new ApplicationManager
        document.getElementById('hud_bottom').style.display = 'block';
        document.getElementById('loading').style.display = 'none';
        new ApplicationManager().startupApplicationManager(this.canvas.width, this.canvas.height);
        this.resourcesLoaded = true;
      }
      else
      {
        document.getElementById('loading_count_current').innerHTML = numLoaded;
        document.getElementById('loading_count_max').innerHTML = g_ResourceManager.imageProperties.length;
        document.getElementById('loading_percent').style.width = numLoaded / g_ResourceManager.imageProperties.length * 300 + 'px';
      }
    }

    // clear the drawing contexts
    if (this.canvasSupported && this.resourcesLoaded)
    {
      this.backBufferContext2D.clearRect(0, 0, this.backBuffer.width, this.backBuffer.height);
      this.context2D.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // first update all the game objects
      for (x in this.gameObjects)
      {
        if (this.gameObjects[x] && this.gameObjects[x].update)
        {
          this.gameObjects[x].update(dt, this.backBufferContext2D, this.xScroll, this.yScroll);
        }
      }

      // then draw the game objects
      for (x in this.gameObjects)
      {
        if (this.gameObjects[x] && this.gameObjects[x].draw)
        {
          this.gameObjects[x].draw(dt, this.backBufferContext2D, this.xScroll, this.yScroll);
        }
      }

      // copy the back buffer to the displayed canvas
      this.context2D.drawImage(this.backBuffer, 0, 0);
    }        
  };

  this.endLoop = function()
  {
    clearInterval(this.loop);
  };
  
  /**
        Adds a new GameObject to the gameObjects collection
        @param gameObject The object to add
   */
  this.addGameObject = function(gameObject)
  {
    this.gameObjects.push(gameObject);
    this.gameObjects.sort(function(a,b){return a.zOrder - b.zOrder;});
  };

  /**
        Removes a GameObject from the gameObjects collection
        @param gameObject The object to remove
   */
  this.removeGameObject = function(gameObject)
  {
    this.removeObject(gameObject);
  };

  this.keyDown = function(event)
  {
    for (x in this.gameObjects)
    {
      if (this.gameObjects[x].keyDown)
      {
        this.gameObjects[x].keyDown(event);
      }
    }
  };

  this.keyUp = function(event)
  {
    for (x in this.gameObjects)
    {
      if (this.gameObjects[x].keyUp)
      {
        this.gameObjects[x].keyUp(event);
      }
    }
  };
}
