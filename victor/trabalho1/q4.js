var vertPosBuf;
var vertTextBuf;
var gl;
var shader;

var video, videoImage, videoImageContext, videoTexture;

// Intervalos entre preto e cinza medio e
// cinza medio e branco, respectivamente
var  level1, level2;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
window.URL = window.URL || window.webkitURL;

// ********************************************************
// ********************************************************
// Muda o intervalo entre preto e cinza medio
// value = Intervalo entre preto e cinza medio
// level1 = ""		""		""		""		""
function changeLevel1(value)
{
	var text = document.getElementById("range1");
	text.innerText = "Nivel 1 = " + value;
	level1 = value;
    render();
}

// ********************************************************
// ********************************************************
// Muda o intervalo entre cinza medio e o branco
// value = Intervalo entre cinza medio e o branco
// level2 = ""		""		""		""		""
function changeLevel2(value)
{
	var text = document.getElementById("range2");
	text.innerText = "Nivel 2 = " + value;
	level2 = value;
    render();
}

// ********************************************************
// ********************************************************
function gotStream(stream)  {
	if (window.URL) {   
		video.src = window.URL.createObjectURL(stream);   } 
	else {   
		video.src = stream;   
		}

	video.onerror = function(e) {   
							stream.stop();   
							};
	stream.onended = noStream;
}

// ********************************************************
// ********************************************************
function noStream(e) {
	var msg = "No camera available.";
	
	if (e.code == 1) {   
		msg = "User denied access to use camera.";   
		}
	document.getElementById("output").textContent = msg;
}

// ********************************************************
// ********************************************************
function initGL() {
	
	gl = canvas.getContext("webgl");
	if (!gl) {
		return (null);
		}


	canvas.width *= 2;
	canvas.height *= 2;
	gl.viewportWidth 	= canvas.width / 2;
	gl.viewportHeight 	= canvas.height / 2;

	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	// Inicialização dos intervalos
	level1 = 0.1;
	level2 = 0.2;

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
	vertPosBuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertPosBuf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vPos), gl.STATIC_DRAW);
	vertPosBuf.itemSize = 3;
	vertPosBuf.numItems = vPos.length/vertPosBuf.itemSize;
		
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
	vertTextBuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertTextBuf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTex), gl.STATIC_DRAW);
	vertTextBuf.itemSize = 2;
	vertTextBuf.numItems = vTex.length/vertTextBuf.itemSize;
}

// ********************************************************
// ********************************************************
function drawScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	if (!videoTexture.needsUpdate) 
		return;
	
   	gl.useProgram(shader);
   	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, videoTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoImage);
	videoTexture.needsUpdate = false;	
	gl.uniform1i(shader.SamplerUniform, 0);

	// Associa o valor do setor, com a variavel a ser passada ao fragment shader
	gl.uniform1i(shader.SectorUniform, 0);

	// Associa o valor do intervalo, com a variavel a ser passada ao fragment shader
	gl.uniform1f(shader.Level1Uniform, level1);

	// Associa o valor do intervalo, com a variavel a ser passada ao fragment shader
	gl.uniform1f(shader.Level2Uniform, level2);

	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertPosBuf);
	gl.vertexAttribPointer(shader.vertexPositionAttribute, vertPosBuf.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.enableVertexAttribArray(shader.vertexTextAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertTextBuf);
	gl.vertexAttribPointer(shader.vertexTextAttribute, vertTextBuf.itemSize, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.TRIANGLES, 0, vertPosBuf.numItems);

	// Redefine o viewport, permitindo que a imagem seja desenhada em outro setor
	gl.viewport(gl.viewportWidth, 0, gl.viewportWidth, gl.viewportHeight);
	// Associa o valor do setor, com a variavel a ser passada ao fragment shader
	gl.uniform1i(shader.SectorUniform, 1);

	gl.drawArrays(gl.TRIANGLES, 0, vertPosBuf.numItems);

	// Redefine o viewport, permitindo que a imagem seja desenhada em outro setor
	gl.viewport(0, gl.viewportHeight, gl.viewportWidth, gl.viewportHeight);
	// Associa o valor do setor, com a variavel a ser passada ao fragment shader
	gl.uniform1i(shader.SectorUniform, 2);

	gl.drawArrays(gl.TRIANGLES, 0, vertPosBuf.numItems);

	// Redefine o viewport, permitindo que a imagem seja desenhada em outro setor
	gl.viewport(gl.viewportWidth, gl.viewportHeight, gl.viewportWidth, gl.viewportHeight);
	// Associa o valor do setor, com a variavel a ser passada ao fragment shader
	gl.uniform1i(shader.SectorUniform, 3);

	gl.drawArrays(gl.TRIANGLES, 0, vertPosBuf.numItems);
}

// ********************************************************
// ********************************************************
function initTexture(gl, shader) {

	videoTexture = gl.createTexture();		
	gl.bindTexture(gl.TEXTURE_2D, videoTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	videoTexture.needsUpdate = false;
}

// ********************************************************
// ********************************************************
function webGLStart() {

	if (!navigator.getUserMedia) {
		document.getElementById("output").innerHTML = 
			"Sorry. <code>navigator.getUserMedia()</code> is not available.";
		}
	navigator.getUserMedia({video: true}, gotStream, noStream);

	// assign variables to HTML elements
	video = document.getElementById("monitor");
	videoImage = document.getElementById("videoImage");
	videoImageContext = videoImage.getContext("2d");
	
	// background color if no video present
	videoImageContext.fillStyle = "#005337";
	videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );
	
	
	canvas = document.getElementById("videoGL");
	gl = initGL();
	
	if (!gl) { 
		alert("Could not initialise WebGL, sorry :-(");
		return;
		}
		
	shader = initShaders("shader", gl);
	if (shader == null) {
		alert("Erro na inicilizacao do shader!!");
		return;
		}

	shader.vertexPositionAttribute 	= gl.getAttribLocation(shader, "aVertexPosition");
	shader.vertexTextAttribute 		= gl.getAttribLocation(shader, "aVertexTexture");
	shader.SamplerUniform	 		= gl.getUniformLocation(shader, "uSampler");

	// Criacao das variaveis a serem utilizadas no fragment shader
	shader.Level1Uniform	 		= gl.getUniformLocation(shader, "uLevel1");
	shader.Level2Uniform	 		= gl.getUniformLocation(shader, "uLevel2");
	shader.SectorUniform			= gl.getUniformLocation(shader, "uSector");

	if ( 	(shader.vertexPositionAttribute < 0) ||
			(shader.vertexTextAttribute < 0) ||
			(shader.SamplerUniform < 0)
			(shader.Level1Uniform < 0)
			(shader.Level2Uniform < 0)
			(shader.SectorUniform < 0) ) {
		alert("Shader attribute ou uniform nao localizado!");
		return;
		}

		
	initBuffers(gl);
	initTexture(gl, shader);
	animate(gl, shader);
}

function animate(gl, shader) {
    requestAnimationFrame( animate );
	render();		
}

function render() {	
	
	if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
		videoImageContext.drawImage( video, 0, 0, videoImage.width, videoImage.height);
		videoTexture.needsUpdate = true;
	}
	drawScene();
}