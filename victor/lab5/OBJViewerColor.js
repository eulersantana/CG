var canvas		= null;
var shader		= null;
var model		= new Array;
var axis		= null;
var gl			= null;
var scale 		= 0.5;

var g_objDoc 		= null;	// The information of OBJ file
var g_drawingInfo 	= null;	// The information for drawing 3D model

function changeScale(value)
{
	scale = value;
	var text = document.getElementById("outputS");
	text.innerHTML = "Scale = " + scale;
}

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

function initAxisVertexBuffer(gl) {
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
function drawScene(gl) {

	gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    try {
    	gl.useProgram(shader);
		}
	catch(err){
        alert(err);
        console.error(err.description);
    	}
    		
	gl.uniform1f(shader.uScale, scale);
	gl.uniform3f(shader.uCenter, g_drawingInfo.BBox.Center.x, g_drawingInfo.BBox.Center.y, g_drawingInfo.BBox.Center.z);

	for(var o = 0; o < model.length; o++) 
		draw(gl, model[o], shader, gl.TRIANGLES);
}
    
// ********************************************************
// ********************************************************
function webGLStart() {

	canvas 	= document.getElementById("viewOBJ");
	gl 		= initGL(canvas);
	shader 	= initShaders("viewOBJ", gl);	
	
	shader.vPositionAttr 	= gl.getAttribLocation(shader, "aVertexPosition");		
	shader.vColorAttr 		= gl.getAttribLocation(shader, "aVertexColor");
	shader.uScale 			= gl.getUniformLocation(shader, "uScale");
	shader.uCenter 			= gl.getUniformLocation(shader, "uCenter");
	
	if (shader.vPositionAttr < 0 || shader.vColorAttr < 0 || 
		!shader.uScale) {
		console.log("Error getAttribLocation"); 
		return;
		}
		
	readOBJFile("../../modelos/cubo.obj", gl, 1, true);
	
	var tick = function() {   // Start drawing
		if (g_objDoc != null && g_objDoc.isMTLComplete()) { // OBJ and all MTLs are available
			
			onReadComplete(gl);
			
			g_objDoc = null;
			
			console.log("BBox = (" 	+ g_drawingInfo.BBox.Min.x + " , " 
									+ g_drawingInfo.BBox.Min.y + " , " 
									+ g_drawingInfo.BBox.Min.z + ")");
			console.log("		(" 	+ g_drawingInfo.BBox.Max.x + " , " 
									+ g_drawingInfo.BBox.Max.y + " , " 
									+ g_drawingInfo.BBox.Max.z + ")");
			console.log("		(" 	+ g_drawingInfo.BBox.Center.x + " , " 
									+ g_drawingInfo.BBox.Center.y + " , " 
									+ g_drawingInfo.BBox.Center.z + ")");
			}
		requestAnimationFrame(tick, canvas);
		if (model.length > 0) 
			drawScene(gl);
		};	
	tick();
}


