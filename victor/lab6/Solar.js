var canvas		= null;
var shader		= null;
var model		= new Array;
var axis		= null;
var gl			= null;
var globalScale = 1.0;
var ScaleX 		= 1.0;
var ScaleY 		= 1.0;
var ScaleZ 		= 1.0;
var RotX		= 0.0;
var RotY		= 0.0;
var RotZ		= 0.0;
var TransX		= 0.0;
var TransY		= 0.0;
var TransZ		= 0.0;
var Upper		= false;
var cameraPos 	= new Vector3();
var cameraLook 	= new Vector3();
var cameraUp 	= new Vector3();

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

function initAxisVertexBuffer() {

	var axis	= new Object(); // Utilize Object object to return multiple buffer objects
	var vPos 	= new Array;
	var vColor 	= new Array;
	var vNormal	= new Array;
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
	vNormal.push(1.0);
	vNormal.push(0.0);
	vNormal.push(0.0);
	// V1
	vPos.push(1.0);
	vPos.push(0.0);
	vPos.push(0.0);
	vColor.push(1.0);
	vColor.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vNormal.push(1.0);
	vNormal.push(0.0);
	vNormal.push(0.0);

	// Y Axis
	// V2
	vPos.push(0.0);
	vPos.push(1.0);
	vPos.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vNormal.push(1.0);
	vNormal.push(0.0);
	vNormal.push(0.0);

	// Z Axis
	// V3
	vPos.push(0.0);
	vPos.push(0.0);
	vPos.push(1.0);
	vColor.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vColor.push(1.0);
	vNormal.push(1.0);
	vNormal.push(0.0);
	vNormal.push(0.0);
	
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
function draw(o, shaderProgram, primitive) {

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

	var modelMat = new Matrix4();
	var viewMat  = new Matrix4();
	var projMat  = new Matrix4();

	gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);

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

	projMat.perspective(75, 1.0, 0.01, 25);

	gl.uniformMatrix4fv(shader.uViewMat, false, viewMat.elements);
	gl.uniformMatrix4fv(shader.uProjMat, false, projMat.elements);

    // Sun	
	var radiusSun = 1;
	RotY += 0.5;

	modelMat.scale(radiusSun,radiusSun,radiusSun);
	modelMat.rotate(RotY, 0, 1, 0);

	gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
	gl.uniform1i(shader.uColor,0);

	draw(model[0], shader, gl.TRIANGLES);

	// Earth
	var distanceEarthSun = 1.25;
	var radiusEarth = 0.5;

	//modelMat.setIdentity();	

	modelMat.scale(radiusEarth, radiusEarth, radiusEarth);
	modelMat.translate(distanceEarthSun, 0.0, 0.0);
	
	modelMat.rotate(RotX, 1,0,0);

	gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
	gl.uniform1i(shader.uColor,1);

	draw(model[0], shader, gl.TRIANGLES);

	//modelMat.rotate(RotX, 1,0,0);
	//modelMat.rotate(RotY, 0, 1, 0);

	// Moon
	var distanceMoonEarth = 0.4;
	var radiusMoon = 0.3;
	var posEarth = distanceMoonEarth-radiusEarth;

	modelMat.translate(0,distanceMoonEarth,0);
	modelMat.scale(radiusMoon, radiusMoon, radiusMoon);
	
	gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
	gl.uniform1i(shader.uColor,2);
	
	draw(model[0], shader, gl.TRIANGLES);

	// Axis
	modelMat.setIdentity();
	gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
	gl.uniform1i(shader.uColor,0);

	draw(axis, shader, gl.LINES);
}
    
// ********************************************************
// ********************************************************
function webGLStart() {

	document.onkeydown 	= handleKeyDown;
	document.onkeyup 	= handleKeyUp;
	
	canvas 				= document.getElementById("TransfGeom");
	gl 					= initGL(canvas);
	
	shader 					= initShaders("TransfGeom", gl);	
	shader.vPositionAttr 	= gl.getAttribLocation(shader, "aVertexPosition");		
	shader.vColorAttr 		= gl.getAttribLocation(shader, "aVertexColor");
	shader.uColor 			= gl.getUniformLocation(shader, "uColor");
	shader.uModelMat 		= gl.getUniformLocation(shader, "uModelMat");
	shader.uViewMat 		= gl.getUniformLocation(shader, "uViewMat");
	shader.uProjMat 		= gl.getUniformLocation(shader, "uProjMat");

	if (shader.vPositionAttr < 0 || shader.vColorAttr < 0 || 
		!shader.uModelMat) {
		console.log("Error getAttribLocation"); 
		return;
		}
		
	axis = initAxisVertexBuffer(gl);
	if (!axis) {
		console.log('Failed to set the AXIS vertex information');
		return;
		}
		
	readOBJFile("../../modelos/sphere.obj", gl, 1, true);
	
	var tick = function() {   // Start drawing
		if (g_objDoc != null && g_objDoc.isMTLComplete()) { // OBJ and all MTLs are available
			onReadComplete(gl);
			g_objDoc = null;

			cameraPos.elements[0] 	= 3 * g_drawingInfo.BBox.Max.x;
			cameraPos.elements[1] 	= 4 * g_drawingInfo.BBox.Max.y ;
			cameraPos.elements[2] 	= g_drawingInfo.BBox.Max.z;
			cameraLook.elements[0] 	= g_drawingInfo.BBox.Center.x;
			cameraLook.elements[1] 	= g_drawingInfo.BBox.Center.y;
			cameraLook.elements[2] 	= g_drawingInfo.BBox.Center.z;
			cameraUp.elements[0] 	= 0.0;
			cameraUp.elements[1] 	= 1.0;
			cameraUp.elements[2] 	= 0.0;

		}
		if (model.length > 0) 
		{
			RotX += 2; 
			drawScene();
			requestAnimationFrame(tick, canvas);
		}
		else
			requestAnimationFrame(tick, canvas);
		};

	tick();	
}

// ********************************************************
// ********************************************************
function handleKeyUp(event) {
	
	var e = window.event || event;
	var keyunicode = e.charCode || e.keyCode;
	if (keyunicode == 16)
		Upper = false;
}	

// ********************************************************
// ********************************************************
function handleKeyDown(event) {
	
	var e = window.event || event;
	var keyunicode = event.charCode || event.keyCode;
	
	if (keyunicode == 16) 
		Upper = true;

	switch (String.fromCharCode(keyunicode)) {
		case "X"	:	cameraPos.elements[0] = 3 * g_drawingInfo.BBox.Max.x;
						cameraPos.elements[1] = 0;
						cameraPos.elements[2] = 0;
						break;

		case "Y"	:	cameraPos.elements[0] = 0;
						cameraPos.elements[1] = 3 * g_drawingInfo.BBox.Max.y;
						cameraPos.elements[2] = 0;
						break;

		case "Z"	:	cameraPos.elements[0] = 0;
						cameraPos.elements[1] = 0;
						cameraPos.elements[2] = 5 * g_drawingInfo.BBox.Max.z;
						break;
		}
	
	switch (keyunicode) {
		case 27		:	// ESC			
						cameraPos.elements[0] = 3 * g_drawingInfo.BBox.Max.x;
						cameraPos.elements[1] = 4 * g_drawingInfo.BBox.Max.y;
						cameraPos.elements[2] = g_drawingInfo.BBox.Max.z;
						break;
					}
	drawScene();					
}