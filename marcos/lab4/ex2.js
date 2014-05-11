var triangleVertexPositionBuffer;
var triangleTextureBuffer;
var triangleColorBuffer;
var triangleIndexFaceBuffer;
var texture=null;

var options = {
	"3x3":[3],
	"5x5":[5],
	"7x7":[7],
	"9x9":[9],
	"11x11":[11]
};

var selecionado = "3x3";
var image;

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
		
	vTex.push( 0.0); 	// V0
	vTex.push( 0.0);
	
	vTex.push( 1.0);	// V1
	vTex.push( 0.0);
	
	vTex.push( 1.0);	// V2
	vTex.push( 1.0);
	
	vTex.push( 0.0); 	// V0
	vTex.push( 0.0);
	
	vTex.push( 1.0);	// V2
	vTex.push( 1.0);

	vTex.push( 0.0);	// V3
	vTex.push( 1.0);
	
	triangleTextureBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleTextureBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTex), gl.STATIC_DRAW);
	triangleTextureBuffer.itemSize = 2;
	triangleTextureBuffer.numItems = vTex.length/triangleTextureBuffer.itemSize;
}

// ********************************************************
// ********************************************************
function drawScene(gl, shader) {

	gl.viewport(0,0, gl.viewportWidth, gl.viewportHeight);
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

	gl.uniform1i(shader.selecionado, options[selecionado]);
	gl.uniform2f(shader.textureSize,image.width,image.height);

	gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);

	
}

// ********************************************************
// ********************************************************
function initTexture(gl, shader) {

	texture = gl.createTexture();
	
	image = new Image();
	image.onload = function(){
		var canvas              = document.getElementById("imagem");
		canvas.width 		= image.width;
		canvas.height 		= image.height;
		gl.viewportWidth 	= canvas.width;
		gl.viewportHeight 	= canvas.height;
		
		createSelect();

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		drawScene(gl, shader);
	}	
	image.src = document.getElementById("img").src;
}

// ********************************************************
// ********************************************************
function webGLStart() {

	var canvas = document.getElementById("imagem");
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

	shader.vertexPositionAttribute 	= gl.getAttribLocation(shader,  "aVertexPosition");
	shader.vertexTextAttribute 		= gl.getAttribLocation(shader,  "aVertexTexture");
	shader.SamplerUniform	 		= gl.getUniformLocation(shader, "uSampler");
	shader.textureSize 				= gl.getUniformLocation(shader, "uTextureSize");
	shader.selecionado 				= gl.getUniformLocation(shader,	"uSelecionado");
	
	if( (shader.vertexPositionAttribute < 0) ||
		(shader.vertexTextAttribute < 0) ||
		(shader.SamplerUniform < 0) 
		) {
			alert("Shader attribute ou uniform nao localizado!");
		return;
	}

	initBuffers(gl);
	initTexture(gl, shader);
};

function createSelect(){
	var ui = document.getElementById("ui");
	var select = document.createElement("select")
	for (var name in options) {
		var option = document.createElement("option");
		option.value = name;
		if (name == selecionado) {
		  option.selected = true;
		}
		option.appendChild(document.createTextNode(name));
		select.appendChild(option);
	}
	select.onchange = function(event) {
		drawScene(gl, shader, this.options[this.selectedIndex].value,image);
	};
	ui.appendChild(select);
}
