var canvas		= null;
var shader		= null;
var model		= new Array;
var axis		= null;
var gl			= null;
var zTrans 		= 0.0;
var xRot		= 0.0;
var yRot		= 0.0;
var xSpeed		= 0.0;
var ySpeed		= 0.02;
var scale 		= 1.0;
var scale2 		= 0.5;

// camera
var cameraPos 	= new Vector3();
var cameraLook 	= new Vector3();
var cameraUp 	= new Vector3();
var FOVy		= 75.0;

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

function initAxisVertexBuffer(gl) {
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
	vColor.push(0.0);
	vColor.push(0.0);
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
	vPos.push(0.0);
	vPos.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vNormal.push(1.0);
	vNormal.push(0.0);
	vNormal.push(0.0);
	// V3
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
	// V4
	vPos.push(0.0);
	vPos.push(0.0);
	vPos.push(0.0);
	vColor.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vColor.push(1.0);
	vNormal.push(1.0);
	vNormal.push(0.0);
	vNormal.push(0.0);
	// V5
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
	lInd.push(2);	
	lInd.push(3);	
	lInd.push(4);	
	lInd.push(5);	
	
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
	console.log("#axis = " + axis.numObjects);
	
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

var TG 			= new Matrix4();
var viewMat 	= new Matrix4();
var projMat 	= new Matrix4();


	gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
    try {
    	gl.useProgram(shader);
		}
	catch(err){
        alert(err);
        console.error(err.description);
    	}

    TG.setIdentity(); 
    viewMat.setIdentity();
    projMat.setIdentity();
	
	gl.uniformMatrix4fv(shader.TGMatUniform, false, TG.elements);   		
	
	draw(gl, axis, shader, gl.LINES);	
	
	TG.translate(0.0, 0.0, 0.0);
	TG.rotate(180, 0.0, 1.0, 0.0);
	TG.scale(scale, scale, scale);

	// viewMat.translate(0.0, 0.0, -1.5);
	// viewMat.rotate(360,0.0,1.0,0.0);
		viewMat.lookAt(1.0,
				   1.0,
				   1.0,
				   0.0,
				   0.0,
				   0.0,
				   cameraUp.elements[0],
				   cameraUp.elements[1],
				   cameraUp.elements[2]);
	viewMat.translate(0.0,0.0,0.0);
	viewMat.invert();
	projMat.perspective(FOVy,1.0,0.1,25);
	

	gl.uniformMatrix4fv(shader.TGMatUniform, false, TG.elements);
    gl.uniformMatrix4fv(shader.uViewMat, false, viewMat.elements);
	gl.uniformMatrix4fv(shader.uProjMat, false, projMat.elements);

	for(var o = 0; o < model.length; o++) 
		draw(gl, model[o], shader, gl.TRIANGLES);
	
	TG.rotate(yRot, 0.0, 1.0, 0.0);
	TG.translate(5.0, 0.0, 0.0);		
	TG.rotate(180, 0.0, 1.0, 0.0);

	TG.scale(scale2, scale2, scale2);
	
   gl.uniformMatrix4fv(shader.TGMatUniform, false, TG.elements);  
	
	for(var o = 0; o < model.length; o++) 
		draw(gl, model[o], shader, gl.TRIANGLES);
}

var currentlyPressedKeys = {};
var filter = 0;

// ********************************************************
// ********************************************************
function handleKeyDown(event) {
	
	currentlyPressedKeys[event.keyCode] = true;

	if (String.fromCharCode(event.keyCode) == "F") {
		filter += 1;
		if (filter == 3) 
			filter = 0;
		}
}
    
// ********************************************************
// ********************************************************
function handleKeyUp(event) {
	
	currentlyPressedKeys[event.keyCode] = false;	
}

// ********************************************************
// ********************************************************
function animate() {
	// xRot += 1.0;
	yRot += 1.0;
	drawScene();
	requestAnimationFrame(animate, canvas);

}
    
// ********************************************************
// ********************************************************
function webGLStart() {

	canvas 				= document.getElementById("viewOBJ");
	
	gl = initGL(canvas);
	
	shader = initShaders("viewOBJ", gl);	
	
	shader.vPositionAttr 	= gl.getAttribLocation(shader, "aVertexPosition");		
	shader.vColorAttr 		= gl.getAttribLocation(shader, "aVertexColor");
	shader.TGMatUniform 	= gl.getUniformLocation(shader, "uTGMat");
	shader.uViewMat 		= gl.getUniformLocation(shader, "uViewMat");
	shader.uProjMat 		= gl.getUniformLocation(shader, "uProjMat");
	
	if (shader.vPositionAttr < 0 || shader.vColorAttr < 0 || 
		!shader.TGMatUniform     ||
		!shader.uViewMat 		 || 
		!shader.uProjMat) {
		console.log("Error getAttribLocation"); 
		return;
		}
		
	axis = initAxisVertexBuffer(gl);
	if (!axis) {
		console.log('Failed to set the AXIS vertex information');
		return;
		}
		
	readOBJFile("../../modelos/al.obj", gl, 1, true);
	
	var tick = function() {   // Start drawing
		if (g_objDoc != null && g_objDoc.isMTLComplete()) { // OBJ and all MTLs are available
			
			onReadComplete(gl);
			
			g_objDoc = null;
			cameraPos.elements[0] 	= 1.2 * g_drawingInfo.BBox.Max.x;
			cameraPos.elements[1] 	= 1.2 * g_drawingInfo.BBox.Max.y;
			cameraPos.elements[2] 	= 1.2 * g_drawingInfo.BBox.Max.z;
			cameraLook.elements[0] 	= g_drawingInfo.BBox.Center.x;
			cameraLook.elements[1] 	= g_drawingInfo.BBox.Center.y;
			cameraLook.elements[2] 	= g_drawingInfo.BBox.Center.z;
			cameraUp.elements[0] 	= 0.0;
			cameraUp.elements[1] 	= 1.0;
			cameraUp.elements[2] 	= 0.0;
			
			// console.log("BBox = (" 	+ g_drawingInfo.BBox.Min.x + " , " 
			// 						+ g_drawingInfo.BBox.Min.y + " , " 
			// 						+ g_drawingInfo.BBox.Min.z + ")");
			// console.log("		(" 	+ g_drawingInfo.BBox.Max.x + " , " 
			// 						+ g_drawingInfo.BBox.Max.y + " , " 
			// 						+ g_drawingInfo.BBox.Max.z + ")");
			// console.log("		(" 	+ g_drawingInfo.BBox.Center.x + " , " 
			// 						+ g_drawingInfo.BBox.Center.y + " , " 
			// 						+ g_drawingInfo.BBox.Center.z + ")");
			// scale = 1 / Math.max(	Math.abs(g_drawingInfo.BBox.Max.x - g_drawingInfo.BBox.Min.x),
			// 						Math.abs(g_drawingInfo.BBox.Max.y - g_drawingInfo.BBox.Min.y),
			// 						Math.abs(g_drawingInfo.BBox.Max.z - g_drawingInfo.BBox.Min.z));
			}
		if (model.length > 0) { 
			drawScene();
			animate();
			}
		else {
			requestAnimationFrame(tick, canvas);
			}
		};	
	tick();
}
