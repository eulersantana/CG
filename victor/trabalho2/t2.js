var canvas		= null;
var shader		= null;
var model		= new Array;
var axis		= null;
var gl			= null;
var Upper		= false;

var triangleVertexPositionBuffer;
var triangleTextureBuffer;
var triangleColorBuffer;
var triangleIndexFaceBuffer;
var texture=null;

var cameraPos 	= new Vector3();
var cameraLook 	= new Vector3();
var cameraUp 	= new Vector3();
var transX		= 0.0;
var transY		= 0.0; 
var transZ		= 0.0;
var rotX		= 0.0;
var rotY		= 0.0; 
var rotZ		= 0.0;
var FOVy		= 75.0;

// ********************************************************
// ********************************************************
function initGL(canvas) {

	gl = canvas.getContext("webgl");
	if (!gl) { 
		alert("Could not initialise WebGL, sorry :-(");
		return gl;
		}
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	return gl;
}

// ********************************************************
// ********************************************************
function initTexture() {

	texture = gl.createTexture();
	
	var image = new Image();
	image.onload = function(){
		var canvas 			= document.getElementById("t2");
		canvas.width 		= image.width;
		canvas.height 		= image.width;
		gl.viewportWidth 	= canvas.width;
		gl.viewportHeight 	= canvas.width;
		
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.bindTexture(gl.TEXTURE_2D, null);
		drawScene(gl, shader);
	}
	image.src = "../../images/lena.png";
}

// ********************************************************
// ********************************************************
function initBuffers() {
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

function initAxisVertexBuffer(max) {

	var axis	= new Object(); // Utilize Object object to return multiple buffer objects
	var vPos 	= new Array;
	var vColor 	= new Array;
	var lInd 	= new Array;

	// X Axis
	// V0
	vPos.push(0.0);
	vPos.push(0.0);
	vPos.push(0.0);
	vColor.push(1.0);
	vColor.push(1.0);
	vColor.push(1.0);
	vColor.push(1.0);
	// V1
	vPos.push(1.5 * max.x);
	vPos.push(0.0);
	vPos.push(0.0);
	vColor.push(1.0);
	vColor.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);

	// Y Axis
	// V2
	vPos.push(0.0);
	vPos.push(1.5 * max.y);
	vPos.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vColor.push(0.0);
	vColor.push(1.0);

	// Z Axis
	// V3
	vPos.push(0.0);
	vPos.push(0.0);
	vPos.push(1.5 * max.z);
	vColor.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vColor.push(1.0);
	
	lInd.push(0);	
	lInd.push(1);	
	lInd.push(0);	
	lInd.push(2);	
	lInd.push(0);	
	lInd.push(3);	
	
	axis.vertexBuffer = gl.createBuffer();
	if (axis.vertexBuffer) {		
		gl.bindBuffer(gl.ARRAY_BUFFER, axis.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vPos), gl.STATIC_DRAW);
		}
	else
		alert("ERROR: can not create vertexBuffer");
	
	axis.colorBuffer = gl.createBuffer();
	if (axis.colorBuffer) {		
		gl.bindBuffer(gl.ARRAY_BUFFER, axis.colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vColor), gl.STATIC_DRAW);
		}
	else
		alert("ERROR: can not create colorBuffer");

	axis.indexBuffer = gl.createBuffer();
	if (axis.indexBuffer) {		
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, axis.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lInd), gl.STATIC_DRAW);
		}
	else
		alert("ERROR: can not create indexBuffer");
	
	axis.numObjects = lInd.length;
	
	return axis;
}

// ********************************************************
// ********************************************************
function draw(gl, o, shaderProgram, primitive) {

	if (o.vertexBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, o.vertexBuffer);
		gl.vertexAttribPointer(shaderProgram.vPositionAttr, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shaderProgram.vPositionAttr);  
		}
	else
		alert("o.vertexBuffer == null");

	if (o.colorBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, o.colorBuffer);
		gl.vertexAttribPointer(shaderProgram.vColorAttr, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shaderProgram.vColorAttr);
		}
	else
		alert("o.colorBuffer == null");

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

	gl.drawElements(primitive, o.numObjects, gl.UNSIGNED_SHORT, 0);
}

// ********************************************************
// ********************************************************
function drawScene() {

	var modelMat 	= new Matrix4();
	var viewMat 	= new Matrix4();
	var projMat 	= new Matrix4();

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
    try {
    	gl.useProgram(shader);
		}
	catch(err){
        alert(err);
        console.error(err.description);
    	}

    gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(shader.SamplerCor, 0);

	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
	gl.vertexAttribPointer(shader.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.enableVertexAttribArray(shader.vertexTextAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleTextureBuffer);
	gl.vertexAttribPointer(shader.vertexTextAttribute, triangleTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
    	
	modelMat.setIdentity();
	viewMat.setIdentity();
	projMat.setIdentity();

	viewMat.lookAt(cameraPos.elements[0],
				   cameraPos.elements[1],
				   cameraPos.elements[2],
				   cameraLook.elements[0],
				   cameraLook.elements[1],
				   cameraLook.elements[2],
				   cameraUp.elements[0],
				   cameraUp.elements[1],
				   cameraUp.elements[2]);

	projMat.perspective(FOVy, 1.0, 0.01, 25);

	gl.uniformMatrix4fv(shader.uViewMat, false, viewMat.elements);
	//gl.uniformMatrix4fv(shader.uProjMat, false, projMat.elements);
	
	draw(gl, axis, shader, gl.LINES);

	modelMat.translate(transX, transY, transZ);
	modelMat.rotate(rotX, 1.0, 0.0, 0.0);	
	modelMat.rotate(rotY, 0.0, 1.0, 0.0);
	modelMat.rotate(rotZ, 0.0, 0.0, 1.0);
	
	//gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);

	for(var o = 0; o < model.length; o++) 
		draw(gl, model[o], shader, gl.TRIANGLES);
}
    
// ********************************************************
// ********************************************************
function webGLStart() {

	document.onkeydown 	= handleKeyDown;
	document.onkeyup 	= handleKeyUp;
	
	canvas 	= document.getElementById("t2");
	gl 		= initGL(canvas);
	shader 	= initShaders("t2", gl);	
	initBuffers();
	initTexture();
	
	shader.vPositionAttr 	= gl.getAttribLocation(shader, "aVertexPosition");		
	shader.vColorAttr 		= gl.getAttribLocation(shader, "aVertexColor");
	shader.uModelMat 		= gl.getUniformLocation(shader, "uModelMat");
	shader.uViewMat 		= gl.getUniformLocation(shader, "uViewMat");
	shader.uProjMat 		= gl.getUniformLocation(shader, "uProjMat");
	
	if (shader.vPositionAttr < 0 	|| 
		shader.vColorAttr < 0 		|| 
		!shader.uModelMat 			|| 
		!shader.uViewMat 			|| 
		!shader.uProjMat) {
		console.log("Error getAttribLocation"); 
		return;
		}

	cameraPos.elements[0] 	= 1.2 * g_drawingInfo.BBox.Max.x;
	cameraPos.elements[1] 	= 1.2 * g_drawingInfo.BBox.Max.y;
	cameraPos.elements[2] 	= 0;
	cameraLook.elements[0] 	= 0;
	cameraLook.elements[1] 	= 0;
	cameraLook.elements[2] 	= 0;
	cameraUp.elements[0] 	= 0.0;
	cameraUp.elements[1] 	= 1.0;
	cameraUp.elements[2] 	= 0.0;

	drawScene();	
}


// ********************************************************
// ********************************************************
function handleKeyUp(event) {
	
	var keyunicode = event.charCode || event.keyCode;
	if (keyunicode == 16)
		Upper = false;
}	

// ********************************************************
// ********************************************************
function handleKeyDown(event) {
	
	var keyunicode = event.charCode || event.keyCode;
	
	if (keyunicode == 16) 
		Upper = true;

	switch (String.fromCharCode(keyunicode)) {
		case "X"	:	cameraPos.elements[0] 	= 1.5 * g_drawingInfo.BBox.Max.x;
						cameraPos.elements[1] 	= 0;
						cameraPos.elements[2] 	= 0;
						transX		= 0.0;
						transY		= 0.0; 
						transZ		= 0.0;
						rotX		= 0.0;
						rotY		= 0.0; 
						rotZ		= 0.0;
						FOVy 		= 75;
						break;
						
		case "Y"	:	cameraPos.elements[0] 	= 0;
						cameraPos.elements[1] 	= g_drawingInfo.BBox.Max.y;
						cameraPos.elements[2] 	= 0;
						transX		= 0.0;
						transY		= 0.0; 
						transZ		= 0.0;
						rotX		= 0.0;
						rotY		= 0.0; 
						rotZ		= 0.0;
						FOVy 		= 75;
						break;
						
		case "Z"	:	cameraPos.elements[0] 	= 0;
						cameraPos.elements[1] 	= 0;
						cameraPos.elements[2] 	= 1.5 * g_drawingInfo.BBox.Max.z;
						transX		= 0.0;
						transY		= 0.0; 
						transZ		= 0.0;
						rotX		= 0.0;
						rotY		= 0.0; 
						rotZ		= 0.0;
						FOVy 		= 75;
						break;

		case "A"	: 	transX-= 0.1;
						break;

		case "D"	: 	transX+= 0.1;
						break;

		case "W"	: 	transY+= 0.1;
						break;

		case "S"	: 	transY-= 0.1;
						break;

		case "Q"	: 	transZ-= 0.1;
						break;

		case "E"	: 	transZ+= 0.1;
						break;
		}
		
	switch (keyunicode) {
		case 27	:	// ESC			
					cameraPos.elements[0] 	= 1.2 * g_drawingInfo.BBox.Max.x;
					cameraPos.elements[1] 	= 1.2 * g_drawingInfo.BBox.Max.y;
					cameraPos.elements[2] 	= 1.2 * g_drawingInfo.BBox.Max.z;
					cameraLook.elements[0] 	= g_drawingInfo.BBox.Center.x;
					cameraLook.elements[1] 	= g_drawingInfo.BBox.Center.y;
					cameraLook.elements[2] 	= g_drawingInfo.BBox.Center.z;
					cameraUp.elements[0] 	= 0.0;
					cameraUp.elements[1] 	= 1.0;
					cameraUp.elements[2] 	= 0.0;
					transX		= 0.0;
					transY		= 0.0; 
					transZ		= 0.0;
					rotX		= 0.0;
					rotY		= 0.0; 
					rotZ		= 0.0;
					FOVy 		= 75;
					break;
						
		case 33	:	// Page Up
					FOVy -= 10;
					break;
		case 34	:	// Page Down
					FOVy += 10;
					break;
		case 37	:	// Left cursor key
					rotX -= 1.5;
					break;
		case 38	:	// Up cursor key
					rotY -= 1.5;
					break;
		case 39	:	// Right cursor key
					rotX += 1.5;
					break;
		case 40	:	// Down cursor key
					rotY += 1.5;
					break;
		}
	drawScene();	
}