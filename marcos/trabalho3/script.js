var canvas			= null;
var simpleShader	= null;
var textShader		= null;
var model			= new Array;
var material		= new Array;
var axis			= null;
var gl				= null;
var cameraPos 		= new Vector3();
var cameraLook 		= new Vector3();
var cameraUp 		= new Vector3();
var lightPos 		= new Vector3();
var modelRotMat		= new Matrix4();
var mouseDown 		= false;
var delta			= 1.0;

var texture			= new Array;
var textureOK 		= 0;

var g_objDoc 		= null;	// The information of OBJ file
var g_drawingInfo 	= null;	// The information for drawing 3D model

var lente 			= {distanciaDoObservador: [], tipos: ["convexas","concavas"], raio1: 1, raio2: 1};
var densidade		= {env: 1, lens: 0.985}; // indice de refracao do meio(env) = 1(AR)  e de incidencia da lente(lens)

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
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CW);

	return gl;
}

// ********************************************************
// ********************************************************
var images = [];

function initTexturesInOrder(){
	for(var i = 0 ; i < g_drawingInfo.mtl.length ; i++) {
		var m = g_drawingInfo.mtl[i];
		for(var j = 0 ; j < m.materials.length ; j++) {
			if (m.materials[j].mapKd != "") {
				images.push(m.materials[j].mapKd);
			}
		}
	}
	loadImage(0);
}

function loadImage(index){

	if(index >= images.length){
		drawScene();
		return;
	}

	var image = new Image();
	image.onload = function() {
		var t = gl.createTexture();

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.bindTexture(gl.TEXTURE_2D, t);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.generateMipmap(gl.TEXTURE_2D);		
		gl.bindTexture(gl.TEXTURE_2D, null);

		texture.push(t);
		textureOK++;
		loadImage(index + 1);
	}
	image.src = images[index];
}

function initTextures() {
	for(var i = 0 ; i < g_drawingInfo.mtl.length ; i++) {
		var m = g_drawingInfo.mtl[i];
		for(var j = 0 ; j < m.materials.length ; j++) {
			if (m.materials[j].mapKd != "") {
				initTexture(m.materials[j].mapKd);
			}
		}
	}
}

// ********************************************************
// ********************************************************
function initTexture(filename) {
	var image = new Image();
	
	image.onload = function() {
		var t = gl.createTexture();

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.bindTexture(gl.TEXTURE_2D, t);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.generateMipmap(gl.TEXTURE_2D);		
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		texture.push(t);
		textureOK++;
	}
	image.src = filename;
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
	
		groupModel.normalBuffer = gl.createBuffer();
		if (groupModel.normalBuffer) {		
			gl.bindBuffer(gl.ARRAY_BUFFER, groupModel.normalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, g_drawingInfo.normals[o], gl.STATIC_DRAW);
			}
		else
			alert("ERROR: can not create normalBuffer");
		
		groupModel.texCoordBuffer = gl.createBuffer();
		if (groupModel.texCoordBuffer) {		
			gl.bindBuffer(gl.ARRAY_BUFFER, groupModel.texCoordBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, g_drawingInfo.textCoords[o], gl.STATIC_DRAW);
			}
		else
			alert("ERROR: can not create texCoordBuffer");

		groupModel.indexBuffer = gl.createBuffer();
		if (groupModel.indexBuffer) {		
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groupModel.indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g_drawingInfo.indices[o], gl.STATIC_DRAW);
			}
		else
			alert("ERROR: can not create indexBuffer");
		
		groupModel.numObjects 	= g_drawingInfo.indices[o].length;
		groupModel.Material 	= g_drawingInfo.materials[o];
		
		model.push(groupModel);
	}
		
  	for(var i = 0; i < g_drawingInfo.mtl.length; i++) 
		for(var j = 0; j < g_drawingInfo.mtl[i].materials.length; j++) 
			material.push(g_drawingInfo.mtl[i].materials[j]);

	initTexturesInOrder();
}

// ********************************************************
// ********************************************************

function initAxisVertexBuffer(gl, max) {
	var axis	= new Object(); // Utilize Object object to return multiple buffer objects
	var vPos 	= new Array;
	var vColor	= new Array;
	var lInd 	= new Array;

	// X Axis
	// V0
	vPos.push(0.0);
	vPos.push(0.0);
	vPos.push(0.0);
	vColor.push(1.0);
	vColor.push(1.0);
	vColor.push(1.0);
	// V1
	vPos.push(max.x);
	vPos.push(0.0);
	vPos.push(0.0);
	vColor.push(1.0);
	vColor.push(0.0);
	vColor.push(0.0);

	// Y Axis
	// V2
	vPos.push(0.0);
	vPos.push(max.y);
	vPos.push(0.0);
	vColor.push(0.0);
	vColor.push(1.0);
	vColor.push(0.0);

	// Z Axis
	// V3
	vPos.push(0.0);
	vPos.push(0.0);
	vPos.push(max.z);
	vColor.push(0.0);
	vColor.push(0.0);
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
	axis.Material	= null;
	
	return axis;
}

// ********************************************************
// ********************************************************
function drawAxis(gl, o, shaderProgram, primitive) {

	if (o.vertexBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, o.vertexBuffer);
		gl.vertexAttribPointer(shaderProgram.vPositionAttr, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shaderProgram.vPositionAttr);  
		}
	else
		alert("o.vertexBuffer == null");

	if (o.colorBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, o.colorBuffer);
		gl.vertexAttribPointer(shaderProgram.vColorAttr, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shaderProgram.vColorAttr);
		}
	else
		alert("o.colorBuffer == null");

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

	gl.drawElements(primitive, o.numObjects, gl.UNSIGNED_SHORT, 0);
}
		
// ********************************************************
// ********************************************************
function draw(gl, o, shaderProgram, primitive) {

	var matAmb		= new Vector4();
	var matDif		= new Vector4();
	var matSpec		= new Vector4();
	var Ns;

	if (texture[o.Material] != null) {   	
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture[[o.Material]]);
	}
		
	if (o.Material != -1) {
		matAmb.elements[0] = material[o.Material].Ka.r;
		matAmb.elements[1] = material[o.Material].Ka.g;
		matAmb.elements[2] = material[o.Material].Ka.b;
		matAmb.elements[3] = material[o.Material].Ka.a;
	
		matDif.elements[0] = material[o.Material].Kd.r;
		matDif.elements[1] = material[o.Material].Kd.g;
		matDif.elements[2] = material[o.Material].Kd.b;
		matDif.elements[3] = material[o.Material].Kd.a;
	
		matSpec.elements[0] = material[o.Material].Ks.r;
		matSpec.elements[1] = material[o.Material].Ks.g;
		matSpec.elements[2] = material[o.Material].Ks.b;
		matSpec.elements[3] = material[o.Material].Ks.a;
		
		Ns 					= material[o.Material].Ns;
	}else {
		matAmb.elements[0] = 
		matAmb.elements[1] = 
		matAmb.elements[2] = 0.2;
		matAmb.elements[3] = 1.0;
	
		matDif.elements[0] = 
		matDif.elements[1] = 
		matDif.elements[2] = 0.8;
		matDif.elements[3] = 1.0;
	
		matSpec.elements[0] = 
		matSpec.elements[1] = 
		matSpec.elements[2] = 0.5;
		matSpec.elements[3] = 1.0;
		
		Ns 					= 100.0;
	}

	gl.uniform4fv(shaderProgram.uMatAmb, matAmb.elements);
	gl.uniform4fv(shaderProgram.uMatDif, matDif.elements);
	gl.uniform4fv(shaderProgram.uMatSpec, matSpec.elements);
	gl.uniform1f(shaderProgram.uExpSpec, Ns);
	gl.uniform1i(textShader.uSampler, 0);
	
	if (o.vertexBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, o.vertexBuffer);
		gl.vertexAttribPointer(shaderProgram.vPositionAttr, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shaderProgram.vPositionAttr);  
	}
	else
		alert("o.vertexBuffer == null");

	if (o.normalBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, o.normalBuffer);
		gl.vertexAttribPointer(shaderProgram.vNormalAttr, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shaderProgram.vNormalAttr);
	}
	else
		alert("o.normalBuffer == null");
	
	if (o.texCoordBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, o.texCoordBuffer);
		gl.vertexAttribPointer(shaderProgram.vTexCoordAttr, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(shaderProgram.vTexCoordAttr);
	}
	else
		alert("o.texCoordBuffer == null");

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

	gl.drawElements(primitive, o.numObjects, gl.UNSIGNED_SHORT, 0);
		
	gl.bindTexture(gl.TEXTURE_2D, null);
}

// ********************************************************
// ********************************************************
function drawScene() {

	var modelMat 	= new Matrix4();
	var ViewMat 	= new Matrix4();
	var ProjMat 	= new Matrix4();
	var NormMat 	= new Matrix4();
	var mvpMat		= new Matrix4();
	var lightColor	= new Vector4();

	lightColor.elements[0] = 1.0;
	lightColor.elements[1] = 1.0;
	lightColor.elements[2] = 1.0;
	lightColor.elements[3] = 1.0;

	modelMat.setIdentity();
	ViewMat.setIdentity();
	ProjMat.setIdentity();
	NormMat.setIdentity();
	mvpMat.setIdentity();

	gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	
    try {
    	gl.useProgram(simpleShader);
		}
	catch(err){
        alert(err);
        console.error(err.description);
    	}
    		
    ViewMat.setLookAt(	cameraPos.elements[0], 
    					cameraPos.elements[1], 
    					cameraPos.elements[2], 
    					cameraLook.elements[0], 
    					cameraLook.elements[1], 
    					cameraLook.elements[2], 
    					cameraUp.elements[0], 
    					cameraUp.elements[1], 
    					cameraUp.elements[2] 
    				);
    
    ProjMat.setPerspective( 75.0, gl.viewportWidth / gl.viewportHeight, 0.1, 1200.0);
    		
	mvpMat.multiply(ProjMat);
	mvpMat.multiply(ViewMat);
	mvpMat.multiply(modelMat);	
	gl.uniformMatrix4fv(simpleShader.MVPMatUniform, false, mvpMat.elements);

	drawAxis(gl, axis, simpleShader, gl.LINES);	

    try {
    	gl.useProgram(textShader);
	}catch(err){
        alert(err);
        console.error(err.description);
	}

		
	modelMat.multiply(modelRotMat);
	NormMat.setInverseOf(modelMat);
	NormMat.transpose();
			
	gl.uniformMatrix4fv(textShader.uModelMat, false, modelMat.elements);
	gl.uniformMatrix4fv(textShader.uViewMat, false, ViewMat.elements);
	gl.uniformMatrix4fv(textShader.uProjMat, false, ProjMat.elements);
	gl.uniformMatrix4fv(textShader.uNormMat, false, NormMat.elements);
	gl.uniform3fv(textShader.uCamPos, cameraPos.elements);
	gl.uniform4fv(textShader.uLightColor, lightColor.elements);
	gl.uniform3fv(textShader.uLightPos, lightPos.elements);
	gl.uniform3fv(textShader.uCamPos, cameraPos.elements);
	
	for(var o = 0; o < model.length; o++) 
		draw(gl, model[o], textShader, gl.TRIANGLES);
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
	
	switch (keyunicode) {
		case 39	:	// Right cursor key
					break;						
		case 37	:	// Left cursor key
					break;			
					
		case 27	:	// Esc
					cameraPos.elements[0] 	= 2.0 * g_drawingInfo.BBox.Max.x;
					cameraPos.elements[1] 	= 2.0 * g_drawingInfo.BBox.Max.y;
					cameraPos.elements[2] 	= 2.0 * g_drawingInfo.BBox.Max.z;
					// cameraLook.elements[0] 	= g_drawingInfo.BBox.Center.x;
					cameraLook.elements[0] 	= g_drawingInfo.BBox.Center.x;
					cameraLook.elements[1] 	= g_drawingInfo.BBox.Center.y;
					cameraLook.elements[2] 	= g_drawingInfo.BBox.Center.z;

					cameraUp.elements[0] 	= 0.0;
					cameraUp.elements[1] 	= 1.0;
					cameraUp.elements[2] 	= 0.0;					
					
					lightPos.elements[0]	= 0.0;
					lightPos.elements[1]	= 0.0 * g_drawingInfo.BBox.Max.y;
					lightPos.elements[2]	= 0.0 * g_drawingInfo.BBox.Max.z;
					modelRotMat.setIdentity();
					break;
						
		case 38	:	// Up cursor key
					cameraPos.elements[0] += delta; 
					cameraPos.elements[1] += delta;
					cameraPos.elements[2] += delta;
					break;
						
		case 40	:	// Down cursor key
					cameraPos.elements[0] -= delta; 
					cameraPos.elements[1] -= delta;
					cameraPos.elements[2] -= delta;
					break;						
		}
	drawScene();					
}
        
// ********************************************************
// ********************************************************
function webGLStart() {

	document.onkeydown 		= handleKeyDown;
	document.onkeyup 		= handleKeyUp;
	document.onmouseup 		= handleMouseUp;
	document.onmousemove 	= handleMouseMove;
	
	canvas					= document.getElementById("skyBox");
	canvas.onmousedown 		= handleMouseDown;
	gl 						= initGL(canvas);
	
	simpleShader = initShaders("simple", gl);
	if (!simpleShader) {
		console.log("ERROR: create simpleShader");
		return;
	}

	simpleShader.vPositionAttr 	= gl.getAttribLocation(simpleShader, "aVPosition");		
	simpleShader.vColorAttr 	= gl.getAttribLocation(simpleShader, "aVColor");
	simpleShader.MVPMatUniform 	= gl.getUniformLocation(simpleShader, "uMVPMat");
	if (simpleShader.vPositionAttr < 0 	|| 
		simpleShader.vColorAttr < 0 		|| 
		!simpleShader.MVPMatUniform  ) {
		console.log("Error getAttribLocation simpleShader"); 
		return;
	}
	
	textShader = initShaders("skyBox", gl);	
	if (!textShader) {
		console.log("ERROR: create textShader");
		return;
	}
	textShader.vPositionAttr 	= gl.getAttribLocation(textShader, "aVPosition");		
	textShader.vNormalAttr 		= gl.getAttribLocation(textShader, "aVNorm");
	textShader.vTexCoordAttr 	= gl.getAttribLocation(textShader, "aVTexCoord");
	textShader.uModelMat 		= gl.getUniformLocation(textShader, "uModelMat");
	textShader.uViewMat 		= gl.getUniformLocation(textShader, "uViewMat");
	textShader.uProjMat 		= gl.getUniformLocation(textShader, "uProjMat");
	textShader.uNormMat 		= gl.getUniformLocation(textShader, "uNormMat");
	textShader.uSampler	 		= gl.getUniformLocation(textShader, "uSampler");	
	
	if (textShader.vPositionAttr < 0 	|| 
		textShader.vColorAttr < 0 		|| 
		textShader.vTexCoordAttr < 0 	|| 
		!textShader.uModelMat 			|| 
		!textShader.uViewMat 			|| 
		!textShader.uProjMat 			|| 
		!textShader.uNormMat ) {
		console.log("Error getAttribLocation textShader"); 
		return;
		}
		
	textShader.uCamPos 			= gl.getUniformLocation(textShader, "uCamPos");
	textShader.uLightPos 		= gl.getUniformLocation(textShader, "uLPos");
	textShader.uLightColor 		= gl.getUniformLocation(textShader, "uLColor");
	textShader.uMatAmb 			= gl.getUniformLocation(textShader, "uMatAmb");
	textShader.uMatDif 			= gl.getUniformLocation(textShader, "uMatDif");
	textShader.uMatSpec			= gl.getUniformLocation(textShader, "uMatSpec");
	textShader.uExpSpec			= gl.getUniformLocation(textShader, "uExpSpec");
	
	if (textShader.uCamPos < 0	 		|| textShader.uLightPos < 0 	|| 
		textShader.uLightColor < 0		|| textShader.uMatAmb < 0 		|| 
		textShader.uMatDif < 0			|| textShader.uMatSpec < 0 		|| 
		textShader.uExpSpec < 0 ) {
		console.log("Error getAttribLocation"); 
		return;
	}
	
	readOBJFile("cubeSkyBox.obj", gl, 1, true);
	
	var tick = function() {   // Start drawing
		if (g_objDoc != null && g_objDoc.isMTLComplete()) { // OBJ and all MTLs are available
			
			onReadComplete(gl);
			
			g_objDoc = null;
			
			axis = initAxisVertexBuffer(gl, g_drawingInfo.BBox.Max);
			if (!axis) {
				console.log('Failed to set the AXIS vertex information');
				return;
			}

			// cameraPos.elements[0] 	= 2.0 * g_drawingInfo.BBox.Max.x;
			// cameraPos.elements[1] 	= 2.0 * g_drawingInfo.BBox.Max.y;
			// cameraPos.elements[2] 	= 2.0 * g_drawingInfo.BBox.Max.z;

			cameraPos.elements[0] 	= g_drawingInfo.BBox.Center.x;
			cameraPos.elements[1] 	= g_drawingInfo.BBox.Center.y;
			cameraPos.elements[2] 	= g_drawingInfo.BBox.Center.z;

			cameraLook.elements[0] 	= 0.0 * g_drawingInfo.BBox.Min.x;
			cameraLook.elements[1] 	= 0.0 * g_drawingInfo.BBox.Min.y;
			cameraLook.elements[2] 	= 1.0 * g_drawingInfo.BBox.Min.z;

			lente.distanciaDoObservador = [Math.abs(cameraLook.elements[0] / 2), Math.abs(cameraLook.elements[1] / 2), Math.abs(cameraLook.elements[2] / 2)];

			console.log(distanciaFocal());
			var esfera = new Sphere(5,32,32);
			console.log(esfera);

			cameraUp.elements[0] 	= 0.0;
			cameraUp.elements[1] 	= 1.0;
			cameraUp.elements[2] 	= 0.0;

			lightPos.elements[0]	= 0.0 * cameraPos.elements[0];
			lightPos.elements[1]	= cameraPos.elements[1];//g_drawingInfo.BBox.Max.y;
			lightPos.elements[2]	= cameraPos.elements[2];//g_drawingInfo.BBox.Max.z;
			
			delta 					= (g_drawingInfo.BBox.Max.x - g_drawingInfo.BBox.Min.x) * 0.05;
		}

		if ( (model.length > 0) && (textureOK) )
			drawScene();
		else 
			requestAnimationFrame(tick, canvas);
	};	
	tick();
}
    
// ********************************************************
// ********************************************************
function degToRad(degrees) {
	return degrees * Math.PI / 180;
}
    
// ********************************************************
// ********************************************************
function handleMouseDown(event) {
	mouseDown 	= true;
	lastMouseX 	= event.clientX;
	lastMouseY 	= event.clientY;
	drawScene();
}
    
// ********************************************************
// ********************************************************
function handleMouseUp(event) {
	mouseDown = false;
}
    
// ********************************************************
// ********************************************************
function handleMouseMove(event) {
	if (!mouseDown)
		return;
	
	var newX 		= event.clientX;
	var newY 		= event.clientY;

	var deltaX 		= newX - lastMouseX
	var newModelRot = new Matrix4();
	
	newModelRot.setIdentity();
	newModelRot.rotate(deltaX / 5.0, 0.0, 1.0, 0.0);

	var deltaY = newY - lastMouseY;
	newModelRot.rotate(deltaY / 5.0, 1.0, 0.0, 0.0);

	modelRotMat.multiply(newModelRot);

	lastMouseX = newX
	lastMouseY = newY;
	drawScene();
}

function distanciaFocal(){
	return 1 / ((densidade.lens / densidade.env - 1) * (lente.raio1 - lente.raio2 / lente.raio1 * lente.raio2));
}

var Sphere = function(raio, segmentoW, segmentoH){

	this.faceVertexUvs = new Array();
	this.faces 	 	   = new Array();
	this.vertices 	   = new Array();
	this.uvs 		   = [];

	raio 	  = raio || 50; //por default 50;

	segmentoW = Math.max(3, Math.floor( segmentoW ) || 8 ); // no mínimo 3 e por default 8
	segmentoH = Math.max(2, Math.floor( segmentoH ) || 6 ); //no mínimo 2 e por default 6

	piStart 	= 0;
	piLength 	= Math.PI * 2;

	thetaStart 	= 0;
	thetaLength = Math.PI;

	var i, j, indices = [];

	for ( j = 0; j <= segmentoH; j++ ) {

		var verticesRow = [];
		var uvsRow = [];

		for ( i = 0; i <= segmentoW; i++ ) {

			var u = i / segmentoW;
			var v = j / segmentoH;

			var vertex = new Vector3();
			vertex.elements[0] = -raio * Math.cos( piStart + u * piLength ) * Math.sin( thetaStart + v * thetaLength );
			vertex.elements[1] = raio * Math.cos( thetaStart + v * thetaLength );
			vertex.elements[2] = raio * Math.sin( piStart + u * piLength ) * Math.sin( thetaStart + v * thetaLength );

			this.vertices.push( vertex );

			verticesRow.push(this.vertices.length - 1 );
			uvsRow.push( new Vector3(u, 1 - v, 1));

		}

		indices.push( verticesRow );
		this.uvs.push( uvsRow );

	}

	for (var j = 0; j < segmentoH; j++) {
		for (var i = 0; i < segmentoW; i++) {

			var v1 = indices[j][i+1];
			var v2 = indices[j][i];
			var v3 = indices[j+1][i];
			var v4 = indices[j+1][i+1];

			var n1 = this.vertices[v1].normalize();
			var n2 = this.vertices[v2].normalize();
			var n3 = this.vertices[v3].normalize();
			var n4 = this.vertices[v4].normalize();

			var uv1 = this.uvs[j][i+1];
			var uv2 = this.uvs[j][i];
			var uv3 = this.uvs[j+1][i];
			var uv4 = this.uvs[j+1][i+1];

			if (Math.abs(this.vertices[v1].elements[1]) === raio ) {
				this.faces.push( new Face3( v1, v3, v4, [ n1, n3, n4 ] ) );
			} else if ( Math.abs( this.vertices[ v3 ].elements[1] ) === raio ) {
				this.faces.push( new Face3( v1, v2, v3, [ n1, n2, n3 ] ) );
			} else {
				this.faces.push( new Face3( v1, v2, v4, [ n1, n2, n4 ] ) );
				this.faces.push( new Face3( v2, v3, v4, [ n2 , n3, n4 ] ) );
			}

		}

	}

}

var Face3 = function(v1, v2, v3, normals){
	this.iv1 = v1;
	this.iv2 = v2;
	this.iv3 = v3;
	this.nv1 = normals[0];
	this.nv2 = normals[1];
	this.nv3 = normals[2];
	this.vertex  = [v1,v2,v3];
	this.normals = normals;
}