var Landscape = function() {
  var self = this;

  // Defines canvas for drawing landscape upon
  self.landscapeCanvas = document.getElementById("js3d-landscape-canvas");
  self.landscapeContext = self.landscapeCanvas.getContext("2d");

  // Creates first array of pixels, which we later modify in subclasses using getImageData() and then putImageData() in the render() function
  self.canvasData = self.landscapeContext.createImageData(self.landscapeCanvas.width, self.landscapeCanvas.height);

  // Our getAltitude and getColor methods for the Landscape Base class will generate a slightly sloped
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
    self.pixels = [];
    for (var x = -150; x < 150; x++) {
      for (var y = -150; y < 150; y++) {
        self.pixels.push({
          x: x,
          y: y,
          z: self.getAltitude(x, y),
          color: self.getColor(x, y, self.getAltitude(x, y))
        })
      }
    }
  }

  this.draw = function() {
    self.canvasData = self.landscapeContext.getImageData(0, 0, self.landscapeCanvas.width, self.landscapeCanvas.height);
    self.getPixels();
    var i = self.pixels.length;
    while(i--){
      var pixel = self.pixels[i];
      var scale = 100/(100+pixel.z);
      var x2d = 80*pixel.x/(pixel.z+250)  + self.landscapeCanvas.width/2;
      var y2d = 80*pixel.y/(pixel.z+250)  + self.landscapeCanvas.height/2;
      var idx = (Math.round(y2d) * self.canvasData.width + Math.round(x2d))*4;
      self.canvasData.data[idx + 0] = pixel.color[0];
      self.canvasData.data[idx + 1] = pixel.color[1];
      self.canvasData.data[idx + 2] = pixel.color[2];
      self.canvasData.data[idx + 3] = pixel.color[3];

    }
    self.landscapeContext.putImageData(self.canvasData, 0, 0);
  }
}

var FractalLandscape = function() {
  var self = this;
}

FractalLandscape.prototype = new Landscape();

var JS3D = function() {
  var self = this;
  this.init = function() {
    self.landscape = new FractalLandscape();
    self.startLoop();
  }

  this.startLoop = function() {
    setInterval(self.gameLoop, 100);
  }

  this.updateGame = function() {

  }

  this.drawWorld = function() {
    self.landscape.draw();
  }

  this.gameLoop = function() {
    self.updateGame();
    self.drawWorld();
  }
}

var js3d = new JS3D();
js3d.init();





