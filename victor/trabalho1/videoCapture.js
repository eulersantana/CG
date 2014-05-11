var vertPosBuf;
var vertTextBuf;
var gl;
var shader;
var vPSize;
var vPSat;
var vCont;

var video, videoImage, videoImageContext, videoTexture;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
window.URL = window.URL || window.webkitURL;

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

function build2DGrid(nx, ny) {

var dx = 2.0/nx;
var dy = 2.0/ny;

		for (i=0 ; i <= nx ; i++) {
			for(j=0 ; j <= ny; j++) {
				

				
				
				if( (Math.pow(((-1.0+i*dx) - 0),2) + Math.pow(((-1.0+j*dx) - 0),2)) < Math.pow(0.5,2)){
					vColor.push(1.0);
					vColor.push(1.0);
					vColor.push(0.0);
					
					vPos.push(0.0);
					vPos.push(0.0);
					vPos.push(0.0);

				}else{
					vColor.push(i*dx);
					vColor.push(j*dy);
					vColor.push(0.0);

					vPos.push(-1.0+i*dx);
					vPos.push(-1.0+j*dy);
					vPos.push(0.0);
				}


				

			}			
						
		}

		
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
	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertPosBuf);
	gl.vertexAttribPointer(shader.vertexPositionAttribute, vertPosBuf.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.enableVertexAttribArray(shader.vertexTextAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertTextBuf);
	gl.vertexAttribPointer(shader.vertexTextAttribute, vertTextBuf.itemSize, gl.FLOAT, false, 0, 0);
	/*Tamanho da imagem*/
	gl.uniform1f(shader.LuzAttr, vPSize);
	gl.uniform1f(shader.SatAttr, vPSat);
	gl.uniform1f(shader.ContAttr, vCont);
	gl.uniform2f(shader.PixelSizeUniform, 1.0/gl.viewportWidth, 1.0/gl.viewportHeight);

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
	var slider = document.getElementById("pSize");
	vPSize = slider.value;

	var slid = document.getElementById("pSat");
	vPSat = slid.value;

	var slid = document.getElementById("pCont");
	vCont = slid.value;

	// assign variables to HTML elements
	video = document.getElementById("monitor");
	videoImage = document.getElementById("videoImage");
	videoImageContext = videoImage.getContext("2d");
	
	// background color if no video present
	videoImageContext.fillStyle = "#005337";
	videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );
	
	
	canvas = document.getElementById("videoGL");
	gl = initGL(canvas);
	
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
	shader.LuzAttr					= gl.getUniformLocation(shader, "luz");
	shader.SatAttr					= gl.getUniformLocation(shader, "sat");
	shader.ContAttr					= gl.getUniformLocation(shader, "cont");
	shader.PixelSizeUniform	 		= gl.getUniformLocation(shader, "uPixelSize");

	if ( 	(shader.vertexPositionAttribute < 0) ||
			(shader.vertexTextAttribute < 0) ||
			(shader.SamplerUniform < 0)||
			(shader.LuzAttr	 < 0) ){
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
		videoImageContext.drawImage( video, 0, 0, videoImage.width, videoImage.height );
		videoTexture.needsUpdate = true;
	}

	drawScene();
}

function changePSize() {
	var text = document.getElementById("output");
	var slider = document.getElementById("pSize");
	v = slider.value;
	text.innerHTML = "Brilho: " + v;
	vPSize = v / 100.0;
	render();
}
function changePSat() {
	var text = document.getElementById("outputs");
	var slider = document.getElementById("pSat");
	v = slider.value;
	text.innerHTML = "Saturação " + v;
	vPSat = v  / 100.0;
	render();
}
function changePCont() {
	var text = document.getElementById("outputc");
	var slider = document.getElementById("pCont");
	v = slider.value;
	text.innerHTML = "Contraste " + v;
	vCont = v;
	render();
}
