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
var distanceMoonEarth = 0;

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
		model.push(groupModel);
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

	console.log(model);

	var modelMat = new Matrix4();

	gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
    try {
    	gl.useProgram(shader);
		}
	catch(err){
        alert(err);
        console.error(err.description);
    	}

    draw(axis, shader, gl.LINES);
	
	// Sun	
	var radiusSun = 1;
	
	modelMat.scale(radiusSun,radiusSun,radiusSun);

	gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
	gl.uniform1i(shader.uColor,0);

	draw(model[0], shader, gl.TRIANGLES);

	console.log(modelMat);

	// Earth
	var distanceEarthSun = 1;
	var radiusEarth = 0.5;

	// modelMat.setIdentity();
	modelMat.scale(radiusEarth, radiusEarth, radiusEarth);
	modelMat.translate(distanceEarthSun, 0.0, 0.0);
		
	var t = radiusEarth+2*radiusSun;

	modelMat.translate(t,0.0,0.0);
	modelMat.rotate(RotY, 0,1,0);
	modelMat.translate(-t,0.0,0.0);
	
	gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
	gl.uniform1i(shader.uColor,1);

	draw(model[0], shader, gl.TRIANGLES);
	
	// Moon
	distanceMoonEarth = 0.6;
	var radiusMoon = 0.3;
	var rotMoonZ = 0.0;
	var posEarth = distanceMoonEarth-radiusEarth;

	// modelMat.setIdentity();
	modelMat.translate(distanceMoonEarth,0.0,0.0);
	modelMat.scale(radiusMoon, radiusMoon, radiusMoon);
	
	//rotacionar a lua em relaÃ§Ã£o a terra
	
	t = posEarth+2*radiusEarth+radiusMoon;

	modelMat.translate(t,0.0,0.0);
	modelMat.rotate(rotMoonZ, 0,0,1);
	modelMat.translate(-t,0.0,0.0);
	
	gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
	gl.uniform1i(shader.uColor,2);
	
	draw(model[0], shader, gl.TRIANGLES);
}
    
// ********************************************************
// ********************************************************
function webGLStart() {

	document.onkeydown 	= handleKeyDown;
	document.onkeyup 	= handleKeyUp;
	document.getElementById("outRotX").innerHTML = "Rotacao X = " + RotX;
	document.getElementById("outRotY").innerHTML = "Rotacao Y = " + RotY;
	document.getElementById("outRotZ").innerHTML = "Rotacao Z = " + RotZ;
	
	canvas 				= document.getElementById("TransfGeom");
	gl 					= initGL(canvas);
	
	shader 					= initShaders("TransfGeom", gl);	
	shader.vPositionAttr 	= gl.getAttribLocation(shader, "aVertexPosition");		
	shader.vColorAttr 		= gl.getAttribLocation(shader, "aVertexColor");
	shader.uColor 			= gl.getUniformLocation(shader, "uColor");
	shader.uModelMat 		= gl.getUniformLocation(shader, "uModelMat");
	
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
		console.log("test4")
		if (g_objDoc != null && g_objDoc.isMTLComplete()) { // OBJ and all MTLs are available
			
			onReadComplete(gl);
			console.log("test3")
			g_objDoc = null;
			
			}
		if (model.length > 0) 
		{
			console.log("test")
			distanceMoonEarth+= 0.1
			drawScene();
		}
		else
		{
			console.log("test2")
			requestAnimationFrame(tick, canvas);
		}
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
		case "X"	:	if (Upper) {
							ScaleX += 0.1;
							}
						else {
							ScaleX -= 0.1;
							}
						break;

		case "Y"	:	if (Upper) {
							ScaleY += 0.1;
							}
						else {
							ScaleY -= 0.1;
							}
						break;

		case "Z"	:	if (Upper) {
							ScaleZ += 0.1;
							}
						else {
							ScaleZ -= 0.1;
							}
						break;	

		case "D"	: 	TransX += 0.1;
						break;
		case "A"	: 	TransX -= 0.1;
						break;
		case "W"	: 	TransY += 0.1;
						break;
		case "S"	: 	TransY -= 0.1;
						break;
		case "Q"	: 	TransZ += 0.1;
						break;
		case "E"	: 	TransZ -= 0.1;
						break;
		}
	drawScene();					
}

// ********************************************************
// ********************************************************
function changeRotX(v) {
	document.getElementById("outRotX").innerHTML = "Rotacao X = " + v;
	RotX = v;
	drawScene();
}
    
// ********************************************************
// ********************************************************
function changeRotY(v) {
	document.getElementById("outRotY").innerHTML = "Rotacao Y = " + v;
	RotY = v;
	drawScene();
}    

// ********************************************************
// ********************************************************
function changeRotZ(v) {
	document.getElementById("outRotZ").innerHTML = "Rotacao Z = " + v;
	RotZ = v;
	drawScene();
}
   

// ********************************************************
// ********************************************************
function resetTransfGeom() {
	document.getElementById("RotX").value = 0.0;
	document.getElementById("outRotX").innerHTML = "Rotacao X = " + 0.0;
	document.getElementById("RotY").value = 0.0;
	document.getElementById("outRotY").innerHTML = "Rotacao Y = " + 0.0;
	document.getElementById("RotZ").value = 0.0;
	document.getElementById("outRotZ").innerHTML = "Rotacao Z = " + 0.0;
}
    
  



