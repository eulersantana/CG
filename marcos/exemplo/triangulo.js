// ********************************************************
// ********************************************************
function initGL(canvas) {
	
	var gl = canvas.getContext("webgl");
	if (!gl) {
		alert("Could not initialise WebGL, sorry :-(");
		return (null);
	}
	
	gl.viewportWidth 	= canvas.width;
	gl.viewportHeight 	= canvas.height;
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	return gl;
}

var vPosBuf;

// ********************************************************
// ********************************************************
function initBuffers(gl) {
var vPos 	= 	[  -0.5, -0.5,  0.0,
		 			0.5, -0.5,  0.0,
		 			0.0,  0.5,  0.0
				];

	vPosBuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vPosBuf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vPos), gl.STATIC_DRAW);
	vPosBuf.itemSize = 3;
	vPosBuf.numItems = 3;	
}

// ********************************************************
// ********************************************************
function drawScene(gl, shader) {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	gl.useProgram(shader);

	gl.bindBuffer(gl.ARRAY_BUFFER, vPosBuf);
	gl.enableVertexAttribArray(shader.vPosAttr);		
	//																		  offset e quantos blocos pular
	gl.vertexAttribPointer(shader.vPosAttr, vPosBuf.itemSize, gl.FLOAT, false, 0, 0);
	//A cada tr�s pontos criar um triangulo
	gl.drawArrays(gl.TRIANGLES, 0, vPosBuf.numItems);
	gl.disableVertexAttribArray(shader.vPosAttr);		
	gl.useProgram(null);
}

// ********************************************************
// ********************************************************
function webGLStart() {
	var canvas = document.getElementById("triangulo");
	
	var gl = initGL(canvas);
	
	var shader = initShaders("shader", gl);
	if (shader == null) {
		alert("Erro na iniciliza��o do shader!!"); 
		return;
	}
		
	shader.vPosAttr 	= gl.getAttribLocation(shader, "aVertexPosition");

	if (shader.vPosAttr < 0) {
		alert("Shader: atributo n�o localizado!");
		return;
		}

	initBuffers(gl);
	drawScene(gl, shader);
}
