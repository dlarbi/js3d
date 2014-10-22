var Landscape = function() {
  var self = this;

  // The getAltitude and getColor methods for the Landscape Base class will generate a slightly sloped
  // landscape with a gradient that turns more green as Z increases
  this.getAltitude = function(x, y) {
    var z = x/2;
    return z;
  }

  this.getColor = function(x, y, z) {
    var rgba = [0,z*8,0,255];
    return rgba;
  }

  // Creates an (x, y, z) coordinate for each point in our terrain, so we can pass this data
  // to a camera and project it appropriately in (x, y) coordinates
  this.getPixels = function() {
    var pixels = [];
    for (var x = -150; x < 150; x+=5) {
      for (var y = -150; y < 150; y+=5) {
        pixels.push({
          x: x,
          y: y,
          z: self.getAltitude(x, y),
          color: self.getColor(x, y, self.getAltitude(x, y))
        })
      }
    }
    return pixels;
  }
}

var FractalLandscape = function() {
  var self = this;
}

FractalLandscape.prototype = new Landscape();

var Camera = function() {
  var self = this;

  // viewMatrix: The view produced by the camera.draw() function is entirely dependent on the current view matrix.
  // We start with the viewMatrix as an Identity matrix, and keyboard/mouse controls make modifications to it.
  // At render time for each frame we multiply the (x,y,z) coordinates of our 3d model (for example a rectangle produced by the Landscape Class) by the viewMatrix
  // the resulting matrix represents the pixels for our camera perspective
  var viewMatrix = {
    1:[1,0,0,0],
    2:[0,1,0,0],
    3:[0,0,1,0],
    4:[0,0,0,1]
  };

  // Defines canvas for drawing landscape upon
  self.landscapeCanvas = document.getElementById("js3d-landscape-canvas");
  self.landscapeContext = self.landscapeCanvas.getContext("2d");
  self.canvasData = self.landscapeContext.createImageData(self.landscapeCanvas.width, self.landscapeCanvas.height);
  var w = self.landscapeCanvas.width;
  var h = self.landscapeCanvas.height;

  this.init = function(modelPixels) {
    self.cameraControls();
    self.modelPixels = modelPixels;
  }

  this.cameraControls = function() {
    $("body").keydown(function(e) {
      if (e.keyCode == 37) {       // left
        self.movement('cwRotateX');
      } else if(e.keyCode == 39) { // right
        self.movement('ccwRotateX');
      } else if(e.keyCode == 73) { // i (in)
        self.movement('scaleUp');
      } else if(e.keyCode == 79) { // o (out)
        self.movement('scaleDown');
      } else if(e.keyCode == 38) { // up
        self.movement('cwRotateY');
      } else if(e.keyCode == 40) { // down
        self.movement('ccwRotateY');
      }
    });
  }

  this.movement = function(direction) {
    if(direction === 'cwRotateX') {
      viewMatrix[2][1] = Math.cos(.1);
      viewMatrix[2][2] = Math.sin(.1);
      viewMatrix[3][1] = -Math.sin(.1);
      viewMatrix[3][2] = Math.cos(.1);
    } else if(direction === 'ccwRotateX') {
      viewMatrix[2][1] = Math.cos(.1);
      viewMatrix[2][2] = -Math.sin(.1);
      viewMatrix[3][1] = Math.sin(.1);
      viewMatrix[3][2] = Math.cos(.1);
    } else if(direction === 'cwRotateY') {
      viewMatrix[1][0] = Math.cos(.1);
      viewMatrix[1][2] = -Math.sin(.1);
      viewMatrix[3][0] = Math.sin(.1);
      viewMatrix[3][2] = Math.cos(.1);
    } else if(direction === 'ccwRotateY') {
      viewMatrix[1][0] = Math.cos(.1);
      viewMatrix[1][2] = Math.sin(.1);
      viewMatrix[3][0] = -Math.sin(.1);
      viewMatrix[3][2] = Math.cos(.1);
    } else if(direction === 'scaleUp') {
      viewMatrix[1][0] = viewMatrix[1][0] + .1;
      viewMatrix[2][1] = viewMatrix[2][1] + .1;
      viewMatrix[3][2] = viewMatrix[3][2] + .1;
      viewMatrix[4][3] = viewMatrix[4][3] + .1;
    } else if(direction === 'scaleDown') {
      viewMatrix[1][0] = viewMatrix[1][0] - .1;
      viewMatrix[2][1] = viewMatrix[2][1] - .1;
      viewMatrix[3][2] = viewMatrix[3][2] - .1;
      viewMatrix[4][3] = viewMatrix[4][3] - .1;
    }
  }

  this.toWorldView = function(modelPixels) {
    var worldViewPixels = [];
    // Multiply our 3d model coordinates by the View Matrix
    for(i=0; i < modelPixels.length; i++) {
      var newPixelX = modelPixels[i].x * viewMatrix[1][0] + modelPixels[i].y * viewMatrix[1][1] + modelPixels[i].z * viewMatrix[1][2] + 1 * viewMatrix[1][3];
      var newPixelY = modelPixels[i].x * viewMatrix[2][0] + modelPixels[i].y * viewMatrix[2][1] + modelPixels[i].z * viewMatrix[2][2] + 1 * viewMatrix[2][3];
      var newPixelZ = modelPixels[i].x * viewMatrix[3][0] + modelPixels[i].y * viewMatrix[3][1] + modelPixels[i].z * viewMatrix[3][2] + 1 * viewMatrix[3][3];
      worldViewPixels.push({
        x: newPixelX,
        y: newPixelY,
        z: newPixelZ,
        color: modelPixels[i].color
      })
    }
    return worldViewPixels;
  }

  this.clearCanvas = function(canvasContext) {
    canvasContext.globalCompositeOperation = 'source-over';
    canvasContext.fillStyle = 'rgba(0,0,0,1)';
    canvasContext.fillRect(0, 0, 1, 1);
    canvasContext.clearRect(0, 0, 500, 500);
  }

  // camera.draw() accepts a 3d Model's (x,y,z) coordinates as an argument, then multiplies them by the viewMatrix
  // and draws the result inside a canvas.
  this.draw = function() {
    self.clearCanvas(self.landscapeContext);
    self.canvasData = self.landscapeContext.getImageData(0, 0, self.landscapeCanvas.width, self.landscapeCanvas.height);
    var coords3d = self.toWorldView(self.modelPixels);
    var i = coords3d.length;
    while(i--){
      var pixel = coords3d[i];
      var x2d = 80*pixel.x/(pixel.z+250)  + w/2;
      var y2d = 80*pixel.y/(pixel.z+250)  + self.landscapeCanvas.height/2;
      var idx = (Math.round(y2d) * self.canvasData.width + Math.round(x2d))*4;
      self.canvasData.data[idx + 0] = pixel.color[0];
      self.canvasData.data[idx + 1] = pixel.color[1];
      self.canvasData.data[idx + 2] = pixel.color[2];
      self.canvasData.data[idx + 3] = pixel.color[3];
    }
    self.landscapeContext.putImageData(self.canvasData, 0, 0);

    // update the camera.modelPixels equal to the current frame, so next camera.draw() multiplies our current frame by the viewMatrix
    // instead of the original model pixels
    self.modelPixels = coords3d;

    // We reset the viewMatrix to the identity matrix because camera.draw() is called in JS3D.gameLoop(), so in 10ms the viewMatrix will be multiplied
    // by our current pixel data. We want the next frame to remain identical to the current frame unless there is further user input.
    viewMatrix = {
      1:[1,0,0,0],
      2:[0,1,0,0],
      3:[0,0,1,0],
      4:[0,0,0,1]
    };
  }
}

var JS3D = function() {
  var self = this;
  this.init = function() {
    self.camera = new Camera();
    self.landscape = new FractalLandscape();
    self.camera.init(self.landscape.getPixels());
    self.startLoop();
  }

  this.startLoop = function() {
    setInterval(self.gameLoop, 10);
  }

  this.updateGame = function() {

  }

  this.drawWorld = function() {
    self.camera.draw();
  }

  this.gameLoop = function() {
    self.updateGame();
    self.drawWorld();
  }
}

var js3d = new JS3D();
js3d.init();
