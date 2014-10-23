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
  // We start with the worldMatrix as an Identity matrix, and keyboard/mouse controls make modifications to it.
  // At render time for each frame we multiply the (x,y,z) coordinates of our 3d model (for example a rectangle produced by the Landscape Class) by the worldMatrix
  // the resulting matrix represents the pixels for our camera perspective
  var worldMatrix = {
    1:[1,0,0,0],
    2:[0,1,0,0],
    3:[0,0,1,0],
    4:[0,0,0,1]
  };
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
      if(e.keyCode == 38) { // up
        self.movement('forward');
      } else if(e.keyCode == 40) { // down
        self.movement('back');
      } else if(e.keyCode == 37) { // r
        self.movement('right');
      } else if(e.keyCode == 39) { // l
        self.movement('left');
      }
    });
    var last_position = {};
    mousemove_ok  = true,
    mouse_timer   = setInterval(function () {
      mousemove_ok = true;
    }, 10);

    $(document).on('mousemove', function (event) {
      if (mousemove_ok) {
        mousemove_ok = false;
        //check to make sure there is data to compare against
        if (typeof(last_position.x) != 'undefined') {

          //get the change from last position to this position
          var deltaX = last_position.x - event.clientX,
            deltaY = last_position.y - event.clientY;

          //check which direction had the highest amplitude and then figure out direction by checking if the value is greater or less than zero
          if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
            //left
            self.movement('ccwRotateY');
          } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
            //right
            self.movement('cwRotateY');
          } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
            //up
            self.movement('cwRotateX');
          } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0) {
            //down
            self.movement('ccwRotateX');
          }
        }

        //set the new last position to the current for next time
        last_position = {
          x: event.clientX,
          y: event.clientY
        };
      }
    });
  }

  this.movement = function(direction) {
    if(direction === 'cwRotateX') {
      self.calculateViewMatrix([0, 0, -1],-.1,0);
    } else if(direction === 'ccwRotateX') {
      self.calculateViewMatrix([0, 0, -1],.1,0);
    } else if(direction === 'cwRotateY') {
      self.calculateViewMatrix([0, 0, -1],0,-.1);
    } else if(direction === 'ccwRotateY') {
      self.calculateViewMatrix([0, 0, -1],0,.1);
    } else if(direction === 'forward') {
      worldMatrix = {
        1:[1,0,0,0],
        2:[0,1,0,0],
        3:[0,0,1,-20],
        4:[0,0,0,1]
      };
    }  else if(direction === 'back') {
      worldMatrix = {
        1:[1,0,0,0],
        2:[0,1,0,0],
        3:[0,0,1,20],
        4:[0,0,0,1]
      };
    } else if(direction === 'left') {
      worldMatrix = {
        1:[1,0,0,-20],
        2:[0,1,0,0],
        3:[0,0,1,0],
        4:[0,0,0,1]
      };
    } else if(direction === 'right') {
      worldMatrix = {
        1:[1,0,0,20],
        2:[0,1,0,0],
        3:[0,0,1,0],
        4:[0,0,0,1]
      };
    }
  }

  this.calculateViewMatrix = function(eye, pitch, yaw) {
    var cosPitch = Math.cos(pitch);
    var sinPitch = Math.sin(pitch);
    var cosYaw = Math.cos(yaw);
    var sinYaw = Math.sin(yaw);

    var xAxis = [cosYaw, 0, -sinYaw];
    var yAxis = [sinYaw * sinPitch, cosPitch, cosYaw * sinPitch];
    var zAxis = [sinYaw * cosPitch, -sinPitch, cosPitch * cosYaw];

    viewMatrix[1] = [xAxis[0], yAxis[0], zAxis[0]];
    viewMatrix[2] = [xAxis[1], yAxis[1], zAxis[1]];
    viewMatrix[3] = [xAxis[2], yAxis[2], zAxis[2]];
    viewMatrix[4] = [-Math.dotProduct(xAxis, eye), -Math.dotProduct(yAxis, eye), -Math.dotProduct(zAxis, eye)]
  }

  this.toWorldView = function(modelPixels) {
    var worldViewPixels = [];
    // Multiply our 3d model coordinates by the View Matrix
    for(i=0; i < modelPixels.length; i++) {
      var newPixelX = modelPixels[i].x * worldMatrix[1][0] + modelPixels[i].y * worldMatrix[1][1] + modelPixels[i].z * worldMatrix[1][2] + 1 * worldMatrix[1][3];
      var newPixelY = modelPixels[i].x * worldMatrix[2][0] + modelPixels[i].y * worldMatrix[2][1] + modelPixels[i].z * worldMatrix[2][2] + 1 * worldMatrix[2][3];
      var newPixelZ = modelPixels[i].x * worldMatrix[3][0] + modelPixels[i].y * worldMatrix[3][1] + modelPixels[i].z * worldMatrix[3][2] + 1 * worldMatrix[3][3];
      worldViewPixels.push({
        x: newPixelX,
        y: newPixelY,
        z: newPixelZ,
        color: modelPixels[i].color
      })
    }
    return worldViewPixels;
  }

  this.toFPSView = function(modelPixels) {
    var FPSViewPixels = [];

    for(i=0; i < modelPixels.length; i++) {
      var newPixelX = modelPixels[i].x * viewMatrix[1][0] + modelPixels[i].y * viewMatrix[1][1] + modelPixels[i].z * viewMatrix[1][2];
      //console.log(modelPixels[i].x, viewMatrix[1][0], modelPixels[i].y, viewMatrix[1][1], modelPixels[i].z, viewMatrix[1][2], viewMatrix[1][3])
      var newPixelY = modelPixels[i].x * viewMatrix[2][0] + modelPixels[i].y * viewMatrix[2][1] + modelPixels[i].z * viewMatrix[2][2];
      var newPixelZ = modelPixels[i].x * viewMatrix[3][0] + modelPixels[i].y * viewMatrix[3][1] + modelPixels[i].z * viewMatrix[3][2];

      FPSViewPixels.push({
        x: newPixelX,
        y: newPixelY,
        z: newPixelZ,
        color: modelPixels[i].color
      })
    }

    return FPSViewPixels;
  }

  this.clearCanvas = function(canvasContext) {
    canvasContext.globalCompositeOperation = 'source-over';
    canvasContext.fillStyle = 'rgba(0,0,0,1)';
    canvasContext.fillRect(0, 0, 1, 1);
    canvasContext.clearRect(0, 0, 500, 500);
  }

  // camera.draw() accepts a 3d Model's (x,y,z) coordinates as an argument, then multiplies them by the worldMatrix
  // and draws the result inside a canvas.
  this.draw = function() {
    self.clearCanvas(self.landscapeContext);
    self.canvasData = self.landscapeContext.getImageData(0, 0, self.landscapeCanvas.width, self.landscapeCanvas.height);
    var worldViewPixels = self.toWorldView(self.modelPixels);
    var coords3d = self.toFPSView(worldViewPixels);

    var i = coords3d.length;
    while(i--){
      var pixel = coords3d[i];

      // We divide pixel.x and pixel.y by pixel.z to achieve a perspective projection of the worldspace coordinates, we add half of width and height
      // to place the origin at the center of the screen
      var x2d = 80*pixel.x/(pixel.z+250) + w/2;
      var y2d = 80*pixel.y/(pixel.z+250) + h/2;

      var idx = (Math.round(y2d) * self.canvasData.width + Math.round(x2d))*4;
      self.canvasData.data[idx + 0] = pixel.color[0];
      self.canvasData.data[idx + 1] = pixel.color[1];
      self.canvasData.data[idx + 2] = pixel.color[2];
      self.canvasData.data[idx + 3] = pixel.color[3];
    }
    self.landscapeContext.putImageData(self.canvasData, 0, 0);

    // update the camera.modelPixels equal to the current frame, so next camera.draw() multiplies our current frame by the worldMatrix
    // instead of the original model pixels
    self.modelPixels = coords3d;

    // We reset the worldMatrix to the identity matrix because camera.draw() is called in JS3D.gameLoop(), so in 10ms the worldMatrix will be multiplied
    // by our current pixel data. We want the next frame to remain identical to the current frame unless there is further user input.
    worldMatrix = {
      1:[1,0,0,0],
      2:[0,1,0,0],
      3:[0,0,1,0],
      4:[0,0,0,1]
    };
    viewMatrix = {
      1:[1,0,0,0],
      2:[0,1,0,0],
      3:[0,0,1,0],
      4:[0,0,0,1]
    }
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


//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
/////////////////// UTILITY AND MATH /////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
Math.dotProduct = function(v1, v2) {
  var result = 0;
  if(v1.length === v2.length) {
    for(i=0; i < v1.length; i++) {
      result += v1[i] * v2[i];
    }
  }
  return result;
}
