var canvas		= null;
var shader		= null;
var model		= new Array;
var axis		= null;
var gl			= null;
var Upper		= false;

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
var zoom        = 1.2;

var g_objDoc 		= null;	// The information of OBJ file
var g_drawingInfo 	= null;	// The information for drawing 3D model

// ********************************************************
// ********************************************************
function initGL(canvas) {

	gl = canvas.getContext("webgl");
	if (!gl) { 
		alert("Could not initialise WebGL, sorry :-(");
		return gl;
		}
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	
	return gl;
}

// ********************************************************
// ********************************************************
// Read a file
function readOBJFile(fileName, gl, scale, reverse) {
	var request = new XMLHttpRequest();
	
	request.onreadystatechange = function() {
		if (request.readyState === 4 && request.status !== 404) 
			onReadOBJFile(request.responseText, fileName, gl, scale, reverse);
		}
	request.open('GET', fileName, true); // Create a request to acquire the file
	request.send();                      // Send the request
}

// ********************************************************
// ********************************************************
// OBJ File has been read
function onReadOBJFile(fileString, fileName, gl, scale, reverse) {
	var objDoc = new OBJDoc(fileName);	// Create a OBJDoc object
	var result = objDoc.parse(fileString, scale, reverse);	// Parse the file
	
	if (!result) {
		g_objDoc 		= null; 
		g_drawingInfo 	= null;
		console.log("OBJ file parsing error.");
		return;
		}
		
	g_objDoc = objDoc;
}

// ********************************************************
// ********************************************************
// OBJ File has been read compleatly
function onReadComplete(gl) {
	
var groupModel = null;

	g_drawingInfo 	= g_objDoc.getDrawingInfo();
	
	for(var o = 0; o < g_drawingInfo.numObjects; o++) {
		
		groupModel = new Object();

		groupModel.vertexBuffer = gl.createBuffer();
		if (groupModel.vertexBuffer) {		
			gl.bindBuffer(gl.ARRAY_BUFFER, groupModel.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, g_drawingInfo.vertices[o], gl.STATIC_DRAW);
			}
		else
			alert("ERROR: can not create vertexBuffer");
	
		groupModel.colorBuffer = gl.createBuffer();
		if (groupModel.colorBuffer) {		
			gl.bindBuffer(gl.ARRAY_BUFFER, groupModel.colorBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, g_drawingInfo.colors[o], gl.STATIC_DRAW);
			}
		else
			alert("ERROR: can not create colorBuffer");

		groupModel.indexBuffer = gl.createBuffer();
		if (groupModel.indexBuffer) {		
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groupModel.indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g_drawingInfo.indices[o], gl.STATIC_DRAW);
			}
		else
			alert("ERROR: can not create indexBuffer");
		
		groupModel.numObjects = g_drawingInfo.indices[o].length;
		model.push(groupModel);
		}
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

	projMat.perspective(FOVy,1.0,0.01,25);
	gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
	gl.uniformMatrix4fv(shader.uViewMat, false, viewMat.elements);
	gl.uniformMatrix4fv(shader.uProjMat, false, projMat.elements);
	
	draw(gl, axis, shader, gl.LINES);

	modelMat.rotate(rotX, 1.0, 0.0, 0.0);	
	modelMat.rotate(rotY, 0.0, 1.0, 0.0);
	modelMat.rotate(rotZ, 0.0, 0.0, 1.0);

	modelMat.translate(transX, transY, transZ);
	
	gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);

	for(var o = 0; o < model.length; o++) 
		draw(gl, model[o], shader, gl.TRIANGLES);
}
    
// ********************************************************
// ********************************************************
function webGLStart() {

	document.onkeydown 	= handleKeyDown;
	document.onkeyup 	= handleKeyUp;
	
	canvas 	= document.getElementById("SistVis");
	gl 		= initGL(canvas);
	shader 	= initShaders("SistVis", gl);	
	
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
		
	readOBJFile("../../modelos/cubeMultiColor.obj", gl, 1, true);
	
	var tick = function() {   // Start drawing
		if (g_objDoc != null && g_objDoc.isMTLComplete()) { // OBJ and all MTLs are available
			
			onReadComplete(gl);
			
			g_objDoc = null;
			
			cameraPos.elements[0] 	= zoom * g_drawingInfo.BBox.Max.x;
			cameraPos.elements[1] 	= zoom * g_drawingInfo.BBox.Max.y;
			cameraPos.elements[2] 	= zoom * g_drawingInfo.BBox.Max.z;
			cameraLook.elements[0] 	= g_drawingInfo.BBox.Center.x;
			cameraLook.elements[1] 	= g_drawingInfo.BBox.Center.y;
			cameraLook.elements[2] 	= g_drawingInfo.BBox.Center.z;
			cameraUp.elements[0] 	= 0.0;
			cameraUp.elements[1] 	= 1.0;
			cameraUp.elements[2] 	= 0.0;
			
			axis = initAxisVertexBuffer(g_drawingInfo.BBox.Max);
			if (!axis) {
				console.log('Failed to set the AXIS vertex information');
				return;
				}
			}
		if (model.length > 0) 
			drawScene();
		else  
			requestAnimationFrame(tick, canvas);
		};	
	tick();
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
		case "X"	:
					cameraLook.elements[0] 	= g_drawingInfo.BBox.Center.x;
					cameraLook.elements[1] 	= 0.0
					cameraLook.elements[2] 	= 0.0;
					cameraUp.elements[0] 	= 0.0;
					cameraUp.elements[1] 	= 1.0;
					cameraUp.elements[2] 	= 0.0;
			break;
						
		case "Y"	:
					cameraLook.elements[0] 	= 0.0;
					cameraLook.elements[1] 	= g_drawingInfo.BBox.Center.y;
					cameraLook.elements[2] 	= 0.0;
					cameraUp.elements[0] 	= 0.0;
					cameraUp.elements[1] 	= 1.0;
					cameraUp.elements[2] 	= 0.0;
			break;
						
		case "Z"	:
					cameraLook.elements[0] 	= 0.0;
					cameraLook.elements[1] 	= 0.0;
					cameraLook.elements[2] 	= -g_drawingInfo.BBox.Center.z;
					cameraUp.elements[0] 	= 0.0;
					cameraUp.elements[1] 	= 1.0;
					cameraUp.elements[2] 	= 0.0;
			break;

		drawScene();
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
					break;
						
		case 33	:   transY++;	// Page Up
					break;
		case 34	:	transY--; // Page Down
					break;
		case 37	:	// Left cursor key
					break;
		case 38	:	// Up cursor key
					break;
		case 39	:	// Right cursor key
					break;
		case 40	:	// Down cursor key
					break;
		}
	drawScene();	
}

function changePSize(v){
	FOVy = v;
	drawScene();	
}

function rotateXPSize (v) {
	rotX = v;
	drawScene();
}
function rotateYPSize (v) {
	rotY = v;
	drawScene();
}
function rotateZPSize (v) {
	rotZ = v;
	drawScene();
}