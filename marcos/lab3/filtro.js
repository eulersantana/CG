var triangleVertexPositionBuffer;
var triangleTextureBuffer;
var triangleColorBuffer;
var triangleIndexFaceBuffer;
var texture=null;

// ********************************************************
// ********************************************************
function initGL(canvas) {	
	var gl = canvas.getContext("webgl");
	
	if (!gl) {
		return (null);
	}

	gl.viewportWidth 	= canvas.width;
	gl.viewportHeight 	= canvas.height;
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	return gl;
}

// ********************************************************
// ********************************************************
function initBuffers(gl) {
	var vPos = new Array;
	var vTex = new Array;

	vPos.push(-1.0); 	// V0
	vPos.push(-1.0);
	vPos.push( 0.0);
	
	vPos.push( 1.0);	// V1
	vPos.push(-1.0);
	vPos.push( 0.0);
	
	vPos.push( 1.0);	// V2
	vPos.push( 1.0);
	vPos.push( 0.0);
	
	vPos.push(-1.0); 	// V0
	vPos.push(-1.0);
	vPos.push( 0.0);
	
	vPos.push( 1.0);	// V2
	vPos.push( 1.0);
	vPos.push( 0.0);
	
	vPos.push(-1.0);	// V3
	vPos.push( 1.0);
	vPos.push( 0.0);
	
	triangleVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vPos), gl.STATIC_DRAW);
	triangleVertexPositionBuffer.itemSize = 3;
	triangleVertexPositionBuffer.numItems = vPos.length/triangleVertexPositionBuffer.itemSize;
	/* 
	Sistemas de coordenadas s e t.
	O tamanho do s e t depende do tamanho da imagem.
	Normalizo.
	Para manter a relação de proporção é só normalizar pela coordenada maior.
	*/
	vTex.push(0.0); // V0
	vTex.push(0.0);

	vTex.push(1.0);	// V1
	vTex.push(0.0);
	
	vTex.push(1.0);	// V2
	vTex.push(1.0);
	
	vTex.push(0.0); // V0
	vTex.push(0.0);
	
	vTex.push(1.0);	// V2
	vTex.push(1.0);
	
	vTex.push(0.0);	// V3
	vTex.push(1.0);
	
	//buffer de textura
	triangleTextureBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleTextureBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTex), gl.STATIC_DRAW);
	triangleTextureBuffer.itemSize = 2;
	triangleTextureBuffer.numItems = vTex.length/triangleTextureBuffer.itemSize;
}

var initialSelection = 'normal';
var kernels = {
normal: [
  0, 0, 0,
  0, 1, 0,
  0, 0, 0
],
gaussianBlur: [
  0.045, 0.122, 0.045,
  0.122, 0.332, 0.122,
  0.045, 0.122, 0.045
],
gaussianBlur2: [
  1, 2, 1,
  2, 4, 2,
  1, 2, 1
],
gaussianBlur3: [
  0, 1, 0,
  1, 1, 1,
  0, 1, 0
],
unsharpen: [
  -1, -1, -1,
  -1,  9, -1,
  -1, -1, -1
],
sharpness: [
   0,-1, 0,
  -1, 5,-1,
   0,-1, 0
],
sharpen: [
   -1, -1, -1,
   -1, 16, -1,
   -1, -1, -1
],
edgeDetect: [
   -0.125, -0.125, -0.125,
   -0.125,  1,     -0.125,
   -0.125, -0.125, -0.125
],
edgeDetect2: [
   -1, -1, -1,
   -1,  8, -1,
   -1, -1, -1
],
edgeDetect3: [
   -5, 0, 0,
    0, 0, 0,
    0, 0, 5
],
edgeDetect4: [
   -1, -1, -1,
    0,  0,  0,
    1,  1,  1
],
edgeDetect5: [
   -1, -1, -1,
    2,  2,  2,
   -1, -1, -1
],
edgeDetect6: [
   -5, -5, -5,
   -5, 39, -5,
   -5, -5, -5
],
sobelHorizontal: [
    1,  2,  1,
    0,  0,  0,
   -1, -2, -1
],
sobelVertical: [
    1,  0, -1,
    2,  0, -2,
    1,  0, -1
],
previtHorizontal: [
    1,  1,  1,
    0,  0,  0,
   -1, -1, -1
],
previtVertical: [
    1,  0, -1,
    1,  0, -1,
    1,  0, -1
],
boxBlur: [
    0.111, 0.111, 0.111,
    0.111, 0.111, 0.111,
    0.111, 0.111, 0.111
],
triangleBlur: [
    0.0625, 0.125, 0.0625,
    0.125,  0.25,  0.125,
    0.0625, 0.125, 0.0625
],
emboss: [
   -2, -1,  0,
   -1,  1,  1,
    0,  1,  2
]
};

// ********************************************************
// ********************************************************
function drawScene(gl, shader, efeito, image) {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
   	gl.useProgram(shader);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(shader.SamplerUniform, 0);

	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
	gl.vertexAttribPointer(shader.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.enableVertexAttribArray(shader.vertexTextAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleTextureBuffer);
	gl.vertexAttribPointer(shader.vertexTextAttribute, triangleTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
   	
	var kernelLocation = gl.getUniformLocation(shader,"uKernel[0]");
	gl.uniform1fv(kernelLocation, kernels[efeito]);
	var textureSizeLocation = gl.getUniformLocation(shader,"uTextureSize");
	gl.uniform2f(textureSizeLocation,image.width,image.height);

	gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
}

// ********************************************************
// ********************************************************
function initTexture(gl, shader,i) {

	texture = gl.createTexture();
	
	var image = new Image();
	image.onload = function(){
		var canvas 			= document.getElementById("imagem_"+i);
		var text 			= document.getElementById("output");
		canvas.width 		= image.width;
		canvas.height 		= image.height;
		gl.viewportWidth 	= canvas.width;
		gl.viewportHeight 	= canvas.height;
		text.innerHTML 		= 	"Imagem :" + image.src + 
								"<br/> Dimensao = " + image.height +
								" <i>x</i> " + image.width;		

		// Setup UI to pick kernels.
		var ui = document.getElementById("ui");
		var select = document.createElement("select")
		for (var name in kernels) {
			var option = document.createElement("option");
			option.value = name;
			if (name == initialSelection) {
			  option.selected = true;
			}
			option.appendChild(document.createTextNode(name));
			select.appendChild(option);
		}
		select.onchange = function(event) {
			drawScene(gl, shader, this.options[this.selectedIndex].value,image);
		};
		ui.appendChild(select);

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.bindTexture(gl.TEXTURE_2D, null);
  		
  		drawScene(gl, shader,initialSelection,image);
	}
	image.src = "../../images/monarch.png";
	
}

var gl_array = new Array();
var shader_array = new Array();
var img_array = new Array();

function createCanvas(n){
	for(var i = 0; i < n; i++){
		var div = document.getElementById("canvas");
		div.innerHTML += '<canvas id="imagem_'+i+'" style="border: none;" width="500" height="500"></canvas><br/>';
	}
}

// ********************************************************
// ********************************************************
function webGLStart() {

	var n = 1;

	createCanvas(n);
	
	for(var i = 0; i < n ; i++){

		var canvas = document.getElementById("imagem_"+i);
		var gl = initGL(canvas);	
		if (!gl) { 
			alert("Could not initialise WebGL, sorry :-(");
			return;
		}

		var shader = initShaders("shader", gl);
		if (shader == null) {
			alert("Erro na inicilizacao do shader!!");
			return;
		}

		shader.vertexPositionAttribute 	= gl.getAttribLocation(shader, "aVertexPosition");
		shader.vertexTextAttribute 		= gl.getAttribLocation(shader, "aVertexTexture");
		shader.SamplerUniform	 		= gl.getUniformLocation(shader, "uSampler");

		if ( 	(shader.vertexPositionAttribute < 0) ||
				(shader.vertexTextAttribute < 0) ||
				(shader.SamplerUniform < 0) ) {
			alert("Shader attribute ou uniform nao localizado!");
			return;
		}

		initBuffers(gl);
		initTexture(gl,shader,i);

	}

}
