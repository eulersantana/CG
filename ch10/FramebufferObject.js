// FramebufferObject.js (c) matsuda and kanda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
  '}\n';

// Size of off screen
var OFFSCREEN_WIDTH = 256;
var OFFSCREEN_HEIGHT = 256;
var a = new Float32Array();
var texture, plane;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of attribute variables and uniform variables
  var program = gl.program; // Get program object
  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  program.a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
  program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
  if (program.a_Position < 0 || program.a_TexCoord < 0 || !program.u_MvpMatrix) {
    console.log('Failed to get the storage location of a_Position, a_TexCoord, u_MvpMatrix');
    return;
  }


  // Set texture
  initTextures(gl);
  if (!texture) {
    console.log('Failed to intialize the texture.');
    return;
  }

  // Set the vertex information
  var cube = initVertexBuffersForCube(gl);
  // var plane = initVertexBuffersForPlane(gl);
  if (!cube /*|| !plane*/) {
    console.log('Failed to set the vertex information');
    return;
  }


  // Initialize framebuffer object (FBO)
  var fbo = initFramebufferObject(gl);
  if (!fbo) {
    console.log('Failed to intialize the framebuffer object (FBO)');
    return;
  }

  // Enable depth test
  gl.enable(gl.DEPTH_TEST);   //  gl.enable(gl.CULL_FACE);

  var viewProjMatrix = new Matrix4();   // Prepare view projection matrix for color buffer
  viewProjMatrix.setPerspective(30, canvas.width/canvas.height, 1.0, 100.0);
  viewProjMatrix.lookAt(0.0, 0.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  var viewProjMatrixFBO = new Matrix4();   // Prepare view projection matrix for FBO
  viewProjMatrixFBO.setPerspective(30.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 100.0);
  viewProjMatrixFBO.lookAt(0.0, 2.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  // Start drawing
  var currentAngle = 0.0; // Current rotation angle (degrees)
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update current rotation angle
    if(plane){
      draw(gl, canvas, fbo, plane, cube, currentAngle, texture, viewProjMatrix, viewProjMatrixFBO);
    }
    window.requestAnimationFrame(tick, canvas);
  };
  tick();
}

function initVertexBuffersForCube(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  // Vertex coordinates
  var vertices = new Float32Array([
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
  ]);

  // Texture coordinates
  var texCoords = new Float32Array([
      1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
      0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
      1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
      1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
      0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
      0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ])

  var o = new Object();  // Create the "Object" object to return multiple objects.

  // Write vertex information to buffer object
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
  if (!o.vertexBuffer || !o.texCoordBuffer || !o.indexBuffer) return null; 

  o.numIndices = indices.length;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

function print(array){
  for (var i = 0; i < array.length; i+=(3)) {
    console.log("["+(i/3)+"]: "+array[i]+","+array[i+1]+","+array[i+2]);
  };
}

function initVertexBuffersForPlane(gl) {
  // Create face
  //  v1------v0
  //  |        | 
  //  |        |
  //  |        |
  //  v2------v3
  // Vertex coordinates
  var w = texture.image.width/8;
  var h = texture.image.height/8;

  var mesh = generatorMeshArray(texture,w,h,8);

  console.log("w: "+w+" h: "+h);
  console.log("i: "+(mesh.indices.length/3));

  var vertices = new Float32Array(mesh.vertex);
  // Texture coordinates
  var texCoords = new Float32Array(mesh.vertexCoord);
  // Indices of the vertices
  var indices = new Uint8Array(mesh.indices);
/*
  var vertices = new Float32Array([
  -1.0, 0.0, -1.0,  // 
   1.0, 0.0, -1.0,  //
  -1.0, 0.0,  1.0,  //
   1.0, 0.0,  1.0,  //  
  ]);

  // Texture coordinates
  var texCoords = new Float32Array([0.0, 0.0,   1.0, 0.0,   0.0, 1.0,   1.0, 1.0]);

  // Indices of the vertices
  var indices = new Uint8Array([0, 1, 2,  1, 2, 3]);
*/
  var o = new Object(); // Create the "Object" object to return multiple objects.

  // Write vertex information to buffer object
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
  if (!o.vertexBuffer || !o.texCoordBuffer || !o.indexBuffer) return null; 

  o.numIndices = indices.length;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

var Ponto = function(x,y){
  this.x    = x;
  this.y    = y;
}

var normalize = function(a){
  return (a + 1) / 2;
}

var normalizeToMapBitPosition = function(x,y,w,h){
  return Math.floor(normalize(x) * w * normalize(y) * h);
}

var generatorMeshArray = function(texture, w , h, bits){
  var segmentosX = w / bits, segmentosY = h / bits;
  var passoX = 2 / segmentosX, passoY = 2 / segmentosY;
  var base = new Ponto(-1,-1);
  var vertex = new Array(), vertexCoord = new Array(), indices = new Array();
  var i = 0, j = 0, a = 0, b = 0, cont = 0;
  do{
    base.x = -1 + i * passoX;
    base.y = -1 + j * passoY;
    vertex.push(base.x);
    vertex.push(texture.imageHeightData[normalizeToMapBitPosition(base.x,base.y,w,h)]);
    vertex.push(base.y);
    vertexCoord.push(normalize(base.x));
    vertexCoord.push(normalize(base.y));
    i++;
    cont += 4;
    if(i == segmentosX + 1){
      j++;
      i=0;
    }
  }while(i <= segmentosX && j <= segmentosY);
  var colunas = Math.sqrt(vertex.length / 3);
  var linhas =  colunas;
  i = 0, j = 0;
  var novaLinha = 3 * linhas;
  for(var l = 0; l < linhas; l++) {
    for(var c = 0;c < colunas; c++){
      i+=3;
      // var pontoAtual = [vertex[i++],vertex[i++],vertex[i++]];
      // var pontoAbaixoAtual = [vertex[p],vertex[p+1],vertex[p+2]]; //só para visualizar
      // var pontoAbaixoProx = [vertex[p+3],vertex[p+4],vertex[p+5]]; //Só para visualizar
      var prox = l + 1;
      var p = i + prox * novaLinha;
      var pontoProx = [];
      if(i + 2 < novaLinha * prox){
        pontoProx = [vertex[i],vertex[i+1],vertex[i+2]];
      }
      if(pontoProx.length > 0){
        var max = colunas * linhas;
        if((i / 3 + colunas) <  max){
          indices.push(i/3-1);
          indices.push(i/3);
          indices.push(i/3+colunas-1);
          indices.push(i/3+colunas-1);
          indices.push(i/3);
          indices.push(i/3+colunas);
        }
      }
    }
  }
  return {vertex: vertex, vertexCoord: vertexCoord, indices: indices};
}

var readPixels = function(texture){
  var x = 0;
  var y = 0;
  var canvas = document.createElement('canvas');
  canvas.width = texture.image.width;
  canvas.height = texture.image.height;
  var context = canvas.getContext('2d');
  context.drawImage(texture.image,0,0);
  var size = canvas.width * canvas.height;
  var data = new Float32Array(size);
  var imageData = context.getImageData(x, y, canvas.width, canvas.height);
  texture.imageData = imageData;
  var pix = imageData.data;
  var j=0, all = 0;
  var max = 1;//20;
  //Calculando a altura baseado no pixel da imagem;
  for (var i = 0, n = pix.length; i < n; all = pix[i] / 255 * max, data[j++] = all,i += (4));// pix[i]+pix[i+1]+pix[i+2];
  texture.imageHeightData = data;
}

function initArrayBufferForLaterUse(gl, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Store the necessary information to assign the object to the attribute variable later
  buffer.num = num;
  buffer.type = type;
  return buffer;
}

function initElementArrayBufferForLaterUse(gl, data, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

  buffer.type = type;

  return buffer;
}

function initTextures(gl) {
  texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the Texture object');
    return null;
  }

  // Get storage location of u_Sampler
  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return null;
  }

  texture.image = new Image();  // Create image object
  if (!texture.image) {
    console.log('Failed to create the Image object');
    return null;
  }

  // Register the event handler to be called when image loading is completed
  texture.image.onload = function() {
    // Write image data to texture object
    var canvas = document.getElementById('webgl');
    canvas.width  = texture.image.width;
    canvas.height = texture.image.width; 
    
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    // Pass the texure unit 0 to u_Sampler
    gl.uniform1i(u_Sampler, 0);
    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture object
    readPixels(texture);
    plane = initVertexBuffersForPlane(gl);
  };

  // Tell the browser to load an Image  
  // texture.image.src = '../cg/perlin_heightmap.png';
  texture.image.src = '../cg/terrain.png';
}

function getHeightData(img) {
    var x = 0;
    var y = 0;
    var canvas = document.createElement( 'canvas' );
    canvas.width = 2;
    canvas.height = 2;
    var context = canvas.getContext( '2d' );
    var size = canvas.width * canvas.height, data = new Float32Array( size );
    context.drawImage(img,0,0);
    for ( var i = 0; i < size; i ++ ) {
        data[i] = 0;
    }
    var imgd = context.getImageData(x, y, canvas.width, canvas.height);
    var pix = imgd.data;
    var j=0;
    var max = 1;//20;
    for (var i = 0, n = pix.length; i < n; i += (4)) {
        var all = pix[i] + max; // pix[i]+pix[i+1]+pix[i+2];
        data[j++] = all;
    }
    return data;
}

function initFramebufferObject(gl) {
  var framebuffer, texture, depthBuffer;

  // Define the error handling function
  var error = function() {
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    if (texture) gl.deleteTexture(texture);
    if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
    return null;
  }

  // Create a frame buffer object (FBO)
  framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    console.log('Failed to create frame buffer object');
    return error();
  }

  // Create a texture object and set its size and parameters
  texture = gl.createTexture(); // Create a texture object
  if (!texture) {
    console.log('Failed to create texture object');
    return error();
  }
  gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the object to target
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  framebuffer.texture = texture; // Store the texture object

  // Create a renderbuffer object and Set its size and parameters
  depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
  if (!depthBuffer) {
    console.log('Failed to create renderbuffer object');
    return error();
  }
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

  // Attach the texture and the renderbuffer object to the FBO
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

  // Check if FBO is configured correctly
  var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (gl.FRAMEBUFFER_COMPLETE !== e) {
    console.log('Frame buffer object is incomplete: ' + e.toString());
    return error();
  }

  // Unbind the buffer object
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);


  return framebuffer;
}
function draw(gl, canvas, fbo, plane, cube, angle, texture, viewProjMatrix, viewProjMatrixFBO) {
    /*gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);              // Change the drawing destination to FBO
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); // Set a viewport for FBO

    gl.clearColor(0.2, 0.2, 0.4, 1.0); // Set clear color (the color is slightly changed)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear FBO

    drawTexturedCube(gl, gl.program, cube, angle, texture, viewProjMatrixFBO);   // Draw the cube
*/
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);        // Change the drawing destination to color buffer
  gl.viewport(0, 0, canvas.width, canvas.height);  // Set the size of viewport back to that of <canvas>

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the color buffer

  drawTexturedPlane(gl, gl.program, plane, angle, texture, viewProjMatrix);  // Draw the plane
}

// Coordinate transformation matrix
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();

function drawTexturedCube(gl, program, o, angle, texture, viewProjMatrix) {
  // Calculate a model matrix
  g_modelMatrix.setRotate(20.0, 1.0, 0.0, 0.0);
  g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);

  // Calculate the model view project matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

  drawTexturedObject(gl, program, o, texture);
}

function drawTexturedPlane(gl, program, o, angle, texture, viewProjMatrix) {
  // Calculate a model matrix
  g_modelMatrix.setTranslate(0, 0, 0);
  g_modelMatrix.rotate(45, 1.0, 0.0, 0.0);
  g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);
  g_modelMatrix.scale(1.0, 1.0, 1.0);
  diamond(g_modelMatrix,60,10);

  // Calculate the model view project matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

  drawTexturedObject(gl, program, o, texture);
}

function drawTexturedObject(gl, program, o, texture) {
  // Assign the buffer objects and enable the assignment
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer);    // Vertex coordinates
  initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer);  // Texture coordinates

  // Bind the texture object to the target
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Draw
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);
  gl.drawElements(gl.LINES, o.numIndices, o.indexBuffer.type, 0);
  // gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);
}

// Assign the buffer objects and enable the assignment
function initAttributeVariable(gl, a_attribute, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}
 
function drawTexturedCube2(gl, o, angle, texture, viewpProjMatrix, u_MvpMatrix) {
  // Calculate a model matrix
  g_modelMatrix.rotate(20.0, 1.0, 0.0, 0.0);
  g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);
  g_modelMatrix.scale(1, 1, 1);

  // Calculate the model view project matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(vpMatrix);

  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);

  drawTexturedObject(gl, o, texture);
}

var ANGLE_STEP = 30;   // The increments of rotation angle (degrees)

var last = Date.now(); // Last time that this function was called
function animate(angle) {
  var now = Date.now();   // Calculate the elapsed time
  var elapsed = now - last;
  last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle % 360;
}
