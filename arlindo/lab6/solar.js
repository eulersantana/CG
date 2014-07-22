var canvas		= null;
var shader		= null;
var model		= new Array;
var axis		= null;
var gl			= null;
var globalScale = 1.0;
var ScaleX 		= 0.6;
var ScaleY 		= 0.6;
var ScaleZ 		= 0.6;
var ScaleXL		= 0.1;
var ScaleYL		= 0.1;
var ScaleZL		= 0.1000;
var RotX		= 0.0;
var RotY		= 0.0;
var RotZ		= 0.0;
var RotXL		= 0.0;
var RotYL		= 0.0;
var RotZL		= 0.0;
var RotXT		= 0.0;
var RotYT		= 0.0;
var RotZT		= 0.0;
var TransX		= 0.0;
var TransY		= 0.0;
var TransZ		= 0.0;
var TransXL		= 0.0;
var TransYL		= 0.0;
var TransZL		= 0.0;
var Upper		= false;
var ultimo      = 0;
var aux			= 0;
var auxR		= -1;
var auxRL		= -1;
var auxL        = 0;

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
var modelMatLua = new Matrix4();
var modelMatSol = new Matrix4();

	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
    try {
    	gl.useProgram(shader);
		}
	catch(err){
        alert(err);
        console.error(err.description);
    	}
    

	modelMatSol.setIdentity();
	
	modelMatSol.rotate(RotX, 1, 0, 0);
	modelMatSol.rotate(RotY, 0, 1, 0);
	modelMatSol.rotate(RotZ, 0, 0, 1);

	//modelMat.translate(TransX, TransY, TransZ);

	gl.uniformMatrix4fv(shader.uModelMat, false, modelMatSol.elements);
	
	modelMatSol.scale(1.1, 1.1, 1.1);
	gl.uniformMatrix4fv(shader.uModelMat, false, modelMatSol.elements);
	gl.uniform1i(shader.uColor,1);
	
	for(var o = 0; o < model.length; o++) 
		draw(model[o], shader, gl.TRIANGLES);	

    //terra
	modelMat.setIdentity();
	
	modelMat.rotate(RotXT, 1, 0, 0);
	modelMat.rotate(RotYT, 0, 1, 0);
	modelMat.rotate(RotZT, 0, 0, 1);

	modelMat.translate(TransX, TransY, TransZ);

	gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
	
	modelMat.scale(ScaleX, ScaleX, ScaleX);
	gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
	gl.uniform1i(shader.uColor,3);
	
	for(var o = 0; o < model.length; o++) 
		draw(model[o], shader, gl.TRIANGLES);

	
	

	//lua

	modelMatLua.setIdentity();
	
	modelMatLua.rotate(RotXL, 1, 0, 0);
	modelMatLua.rotate(RotYL, 0, 1, 0);
	modelMatLua.rotate(RotZL, 0, 0, 1);

	modelMatLua.translate(TransX + TransYL, TransYL, TransZL);

	gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
	
	modelMatLua.scale(ScaleXL, ScaleXL, ScaleXL);
	gl.uniformMatrix4fv(shader.uModelMat, false, modelMatLua.elements);
	gl.uniform1i(shader.uColor,2);
	
	for(var o = 0; o < model.length; o++) 
		draw(model[o], shader, gl.TRIANGLES);
	
	
	if(auxL == 1){
		modelMat.setIdentity();
	
		modelMat.rotate(RotXT, 1, 0, 0);
		modelMat.rotate(RotYT, 0, 1, 0);
		modelMat.rotate(RotZT, 0, 0, 1);

		modelMat.translate(TransX, TransY, TransZ);

		gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
		
		modelMat.scale(ScaleX, ScaleX, ScaleX);
		gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
		gl.uniform1i(shader.uColor,3);
	
	for(var o = 0; o < model.length; o++) 
		draw(model[o], shader, gl.TRIANGLES);
	}

	if(aux == 1){
		modelMatSol.setIdentity();
	
		modelMatSol.rotate(RotX, 1, 0, 0);
		modelMatSol.rotate(RotY, 0, 1, 0);
		modelMatSol.rotate(RotZ, 0, 0, 1);

		//modelMat.translate(TransX, TransY, TransZ);

		gl.uniformMatrix4fv(shader.uModelMat, false, modelMatSol.elements);
		
		modelMatSol.scale(1.1, 1.1, 1.1);
		gl.uniformMatrix4fv(shader.uModelMat, false, modelMatSol.elements);
		gl.uniform1i(shader.uColor,1);
		
		for(var o = 0; o < model.length; o++) 
			draw(model[o], shader, gl.TRIANGLES);	
	}

	
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
	shader.uScale 			= gl.getUniformLocation(shader, "uScale");
	shader.uModelMat 		= gl.getUniformLocation(shader, "uModelMat");
	shader.uColor			= gl.getUniformLocation(shader, "uColor");
	
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
		if (model.length > 0){ 
			requestAnimFrame(tick);
			drawScene();
			rotocaoY();
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
		case "X"	:	if (Upper) {
							ScaleX += 0.1;
							ScaleY += 0.1;
							ScaleZ += 0.1;
							}
						else {
							ScaleX -= 0.1;
							ScaleY -= 0.1;
							ScaleZ -= 0.1;
							}
						break;
						
		}
	drawScene();					
}

// ********************************************************
// ********************************************************
function changeRotX(v) {
	document.getElementById("outRotX").innerHTML = "Rotacao X = " + v;
}
// rotaciona em Y
function rotocaoY() {
	var agora = new Date().getTime();
  if(ultimo != 0)
  {
    var diferenca = agora-ultimo;
    
    //RotZ  += ((90*diferenca)/1000.0) % 360.0;
    //RotZL  += ((10*diferenca)/1000.0) % 360.0;

    //TransX += ((1.1*diferenca)/1000.0) % 360.0;
   // RotZ  += ((50*diferenca)/1000.0) % 360.0;
  }
  	ultimo = agora;
	translacaoX();
	drawScene();
	rotacaoZT();
	rotacaoZL();
}   
    
 function translacaoX() {
	//var agora = new Date().getTime();
  if(aux == 1) {  
  	TransX -= 0.002; 
   	if (TransX < -0.8)
  		aux = 0;
  } 
  else{
  	TransX += 0.002;
  	if (TransX > 0.8)
  		aux = 1;
  } 

  if(auxL == 1) {  
  	TransYL -= 0.002; 
   	if (TransYL < -0.1199)
  		auxL = 0;
  } 
  else{
  	TransYL += 0.002;
  	if (TransYL > 0.1199)
  		auxL = 1;
  } 
  
  		document.getElementById("outRotY").innerHTML = "Rotacao Y = "+ TransX ;
} 

 function rotacaoZT() {
	//var agora = new Date().getTime();
  	if((TransX < 0.1) && (TransX > -0.1)){
  		if((TransX < 0.0)){
  			auxR = 1;
  		}
  		if(TransX > 0.0){
  			auxR = -1
  		}
  	}
  	else{
  		if (auxR == 1){
  			ScaleX += 0.0005; 
  		}else
  			ScaleX -= 0.0005; 
  	}
  	
} 

function rotacaoZL() {
	//var agora = new Date().getTime();
  	if((TransYL < 0.005) && (TransYL > -0.005)){
  		if((TransYL < 0.0)){
  			auxRL = 1;
  		}
  		if(TransYL > 0.0){
  			auxRL = -1
  		}
  	}
  	else{
  		if (auxRL == 1){
  			ScaleXL += 0.0009; 
  		}else
  			ScaleXL -= 0.0009; 
  	}
  	
} 

// ********************************************************
// ********************************************************
function changeRotY(v) {
	document.getElementById("outRotY").innerHTML = "Rotacao Y = " + v;
}    

// ********************************************************
// ********************************************************
function changeRotZ(v) {
	document.getElementById("outRotZ").innerHTML = "Rotacao Z = " + v;
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
    
  



