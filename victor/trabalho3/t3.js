var canvas			= null;
var simpleShader	= null;
var textShader		= null;
var model			= new Array;
var axis			= null;
var gl				= null;
var cameraPos 		= new Vector3();
var cameraLook 		= new Vector3();
var cameraUp 		= new Vector3();
var lightPos 		= new Vector3();
var modelRotMat		= new Matrix4();
var camRotMat		= new Matrix4();
var mouseDown 		= false;

var uLensType 		= 0;
var uRadius			= 0.2;
var uRefraction		= 0.3;
var uPower			= 1;
var uAlpha			= 0.2;
var uRugosity		= 800;

var texture			= null;
var normal 			= null;
var texturesOK 		= 0;

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
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CW);
	
	return gl;
}
        
// ********************************************************
// ********************************************************
function initTextures() {
	
	var textureFiles = [["../../Textures/nvlobby_new_posx.png"	, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z], 
						["../../Textures/nvlobby_new_negx.png"	, gl.TEXTURE_CUBE_MAP_POSITIVE_Z], 
						["../../Textures/nvlobby_new_posy.png"	, gl.TEXTURE_CUBE_MAP_POSITIVE_Y], 
						["../../Textures/nvlobby_new_negy.png"	, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y], 
						["../../Textures/nvlobby_new_posz.png"	, gl.TEXTURE_CUBE_MAP_POSITIVE_X], 
						["../../Textures/nvlobby_new_negz.png"	, gl.TEXTURE_CUBE_MAP_NEGATIVE_X]
					];

	texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	for (var i = 0 ; i < textureFiles.length ; i++) {

		var image = new Image();

		image.onload = function(texture, face, image) {
			
			return function() {
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
				gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
				texturesOK++;
				console.log("Texture[" + texturesOK + "] = " + image.width + " x " + image.height);
				}
			} (texture, textureFiles[i][1], image);
		image.src = textureFiles[i][0];
		}

	var image = new Image();
	
	image.onload = function() {
		var t = gl.createTexture();
		
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
		gl.bindTexture(gl.TEXTURE_2D, t);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.generateMipmap(gl.TEXTURE_2D);		
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		normal = t;
		texturesOK++;
		console.log("Texture[" + texturesOK + "] = " + image.width + " x " + image.height);
		}

	image.src = "../../Textures/grayWallNM.jpg";
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

		groupModel.indexBuffer = gl.createBuffer();
		if (groupModel.indexBuffer) {		
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groupModel.indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g_drawingInfo.indices[o], gl.STATIC_DRAW);
			}
		else
			alert("ERROR: can not create indexBuffer");
		
		groupModel.numObjects 	= g_drawingInfo.indices[o].length;
		
		model.push(groupModel);
		}
		
	initTextures();
}

function createIndex(n)
{
	var temp = []
	var step = Math.sqrt(n);

	for (var i = 0; i < n - step; i++)
		if ((i+1) % step != 0)
		{
			temp.push(i+step);
			temp.push(i+1);
			temp.push(i);

			temp.push(i+step);
			temp.push(i+step+1);
			temp.push(i+1);
		}	

	return temp;
}


// ********************************************************
// Criação dos pontos que formam cada um dos quadrados
// base = 4 primeiros pontos que formam o quadrado original
// n = nivel de detalhe
function createPoints(n)
{
	inc = 0.6 / n;
	amount = n + 1;
	var temp = []

	for (var i = 0; i < amount; i++)
		for (var j = 0; j < amount; j++)
		{
			temp.push(-0.3 + inc * j);
			temp.push(-0.3 + inc * i);
			// var z = (Math.floor(Math.random() * 7) / 10) - 0.3;	
			temp.push(0.0);		
		}

	return temp;	
}

// ********************************************************
// Partindo do vetor de vertices, cria-se o vetor de pontos da textura
function createTextureTriangles(points)
{
	var texture = [];
	for (var i = 0; i < points.length; i+=3)
		texture.push(1.0,1.0,1.0); //(//points[i] + 1) / 2, 
					  //(points[i+2] + 1) / 2)
	return texture;
}

// ********************************************************
// ********************************************************

function initAxisVertexBuffer(gl, max) {
	var axis	= new Object(); // Utilize Object object to return multiple buffer objects
	var vPos 	= new Array;
	var vColor	= new Array;
	var lInd 	= new Array;

	vPos.push(-0.3); // V0
    vPos.push(-0.3);
    vPos.push(-1);

    vPos.push(0.3);	// V1
    vPos.push(-0.3);
    vPos.push(-1);

    vPos.push(-0.3); // V2
    vPos.push(0.3);
    vPos.push(-1);

    vPos.push(0.3);	// V3
    vPos.push(0.3);
    vPos.push(-1);

    //vPos = createPoints(1);

	// V0
	vColor.push(1.0);
	vColor.push(1.0);
	vColor.push(1.0);

	// V1
	vColor.push(1.0);
	vColor.push(1.0);
	vColor.push(1.0);

	// V2
	vColor.push(1.0);
	vColor.push(1.0);
	vColor.push(1.0);

	// V3
	vColor.push(1.0);
	vColor.push(1.0);
	vColor.push(1.0);
	
	vColor = createTextureTriangles(vPos);

	lInd.push(2);	
	lInd.push(1);	
	lInd.push(0);	
	lInd.push(2);	
	lInd.push(3);	
	lInd.push(1);		
	
	lInd = createIndex(vPos.length / 3);

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

	if (texture != null) {   	
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
		}

	if (normal != null) {   	
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, normal);		
		}
		
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
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

	gl.drawElements(primitive, o.numObjects, gl.UNSIGNED_SHORT, 0);
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
    	
    if (texture != null) {   	
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
		}

    ViewMat.setLookAt(	cameraPos.elements[0], 
    					cameraPos.elements[1], 
    					cameraPos.elements[2], 
    					cameraLook.elements[0] - 5, 
    					cameraLook.elements[1], 
    					cameraLook.elements[2], 
    					cameraUp.elements[0], 
    					cameraUp.elements[1], 
    					cameraUp.elements[2] 
    				);
    
    ProjMat.setPerspective( 75.0, gl.viewportWidth / gl.viewportHeight, 0.1, 1200.0);

	gl.uniformMatrix4fv(simpleShader.uMVPMat, false, mvpMat.elements);
	gl.uniformMatrix4fv(simpleShader.uModelMat, false, modelMat.elements);
	gl.uniformMatrix4fv(simpleShader.uViewMat, false, ViewMat.elements);
	gl.uniformMatrix4fv(simpleShader.uProjMat, false, ProjMat.elements);
	gl.uniformMatrix4fv(simpleShader.uNormMat, false, NormMat.elements);

//	gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
//    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);

	// drawAxis(gl, axis, simpleShader, gl.TRIANGLES);	

	// for(var o = 0; o < model.length; o++) 
	// 	draw(gl, model[o], simpleShader, gl.TRIANGLES);

    try {
    	gl.useProgram(textShader);
		}
	catch(err){
        alert(err);
        console.error(err.description);
    	}

	if (texture != null) {   	
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, normal);
		}
	
	modelMat.multiply(modelRotMat);
	ViewMat.multiply(camRotMat);
	NormMat.setInverseOf(modelMat);
	NormMat.transpose();
			
	gl.uniformMatrix4fv(textShader.uModelMat, false, modelMat.elements);
	gl.uniformMatrix4fv(textShader.uViewMat, false, ViewMat.elements);
	gl.uniformMatrix4fv(textShader.uProjMat, false, ProjMat.elements);
	gl.uniformMatrix4fv(textShader.uNormMat, false, NormMat.elements);
	gl.uniform3fv(textShader.uCamPos, cameraPos.elements);
	gl.uniform1i(textShader.uSamplerCube, 0);
	gl.uniform1i(textShader.uNormal, 1);

	gl.uniform1i(textShader.uLensType, uLensType);	
	gl.uniform1f(textShader.uRadius, uRadius);	
	gl.uniform1f(textShader.uRefraction, uRefraction);	
	gl.uniform1f(textShader.uPower, uPower);	
	gl.uniform1f(textShader.uAlpha, uAlpha);
	gl.uniform1f(textShader.uRugosity, uRugosity);	

	for(var o = 0; o < model.length; o++) 
		draw(gl, model[o], textShader, gl.TRIANGLES);
		
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
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
					cameraPos.elements[0] 	= 1.2 * g_drawingInfo.BBox.Max.x;
					cameraPos.elements[1] 	= 1.2 * g_drawingInfo.BBox.Max.y;
					cameraPos.elements[2] 	= 1.2 * g_drawingInfo.BBox.Max.z;
					cameraLook.elements[0] 	= g_drawingInfo.BBox.Center.x;
					cameraLook.elements[1] 	= g_drawingInfo.BBox.Center.y;
					cameraLook.elements[2] 	= g_drawingInfo.BBox.Center.z;
					cameraUp.elements[0] 	= 0.0;
					cameraUp.elements[1] 	= 1.0;
					cameraUp.elements[2] 	= 0.0;
					modelRotMat.setIdentity();
					camRotMat.setIdentity();
					break;
						
		case 38	:	// Up cursor key
					cameraPos.elements[0] += 0.2; 
					cameraPos.elements[1] += 0.2;
					cameraPos.elements[2] += 0.2;
					break;
						
		case 40	:	// Down cursor key
					cameraPos.elements[0] -= 0.2; 
					cameraPos.elements[1] -= 0.2;
					cameraPos.elements[2] -= 0.2;
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
	
	// initTextures();
	
	simpleShader = initShaders("simple", gl);
	if (!simpleShader) {
		console.log("ERROR: create simpleShader");
		return;
		}
	simpleShader.vPositionAttr 	= gl.getAttribLocation(simpleShader, "aVPosition");		
	simpleShader.vColorAttr 	= gl.getAttribLocation(simpleShader, "aVColor");
	simpleShader.uMVPMat	 	= gl.getUniformLocation(simpleShader, "uMVPMat");
	
	simpleShader.uModelMat 		= gl.getUniformLocation(simpleShader, "uModelMat");
	simpleShader.uViewMat 		= gl.getUniformLocation(simpleShader, "uViewMat");
	simpleShader.uProjMat 		= gl.getUniformLocation(simpleShader, "uProjMat");
	simpleShader.uNormMat 		= gl.getUniformLocation(simpleShader, "uNormMat");

	if (simpleShader.vPositionAttr < 0  //	|| 
		// simpleShader.vColorAttr < 0 	|| 
		// !simpleShader.MVPMatUniform  	||
		// !simpleShader.uModelMat 			|| 
		// !simpleShader.uViewMat 			|| 
		// !simpleShader.uProjMat 
		) {
		console.log("Error getAttribLocation simpleShader"); 
		return;
		}
	
	textShader = initShaders("cubeMap", gl);	
	if (!textShader) {
		console.log("ERROR: create textShader");
		return;
		}
	textShader.vPositionAttr 	= gl.getAttribLocation(textShader, "aVPosition");		
	textShader.vNormalAttr 		= gl.getAttribLocation(textShader, "aVNorm");
	textShader.uModelMat 		= gl.getUniformLocation(textShader, "uModelMat");
	textShader.uViewMat 		= gl.getUniformLocation(textShader, "uViewMat");
	textShader.uProjMat 		= gl.getUniformLocation(textShader, "uProjMat");
	textShader.uNormMat 		= gl.getUniformLocation(textShader, "uNormMat");
	textShader.uCamPos 			= gl.getUniformLocation(textShader, "uCamPos");

	textShader.uLensType		= gl.getUniformLocation(textShader, "uLensType");
	textShader.uRadius			= gl.getUniformLocation(textShader, "uRadius");
	textShader.uRefraction		= gl.getUniformLocation(textShader, "uRefraction");
	textShader.uPower			= gl.getUniformLocation(textShader, "uPower");
	textShader.uAlpha			= gl.getUniformLocation(textShader, "uAlpha");
	textShader.uRugosity		= gl.getUniformLocation(textShader, "uRugosity");
	
	textShader.uNormal 			= gl.getUniformLocation(textShader, "uSamplerNormal");
	textShader.uSamplerCube	 	= gl.getUniformLocation(textShader, "uSamplerCube");

	if (textShader.vPositionAttr < 0) { 	//|| 
		// textShader.vNormalAttr < 0 		||
		// textShader.uCamPos < 0			||
		// textShader.uSamplerCube < 0		||
		// !textShader.uModelMat 			|| 
		// !textShader.uViewMat 			|| 
		// !textShader.uProjMat 			||
		// textShader.uLensType < 0		|| 
		// !textShader.uNormMat ) {
		console.log("Error getAttribLocation textShader"); 
		return;
		}
	
	readOBJFile("../../modelos/cubeSkyBox.obj", gl, 1, true);
	
	var tick = function() {   // Start drawing
		if (g_objDoc != null && g_objDoc.isMTLComplete()) { // OBJ and all MTLs are available
			
			onReadComplete(gl);
			
			g_objDoc = null;
			
			axis = initAxisVertexBuffer(gl, g_drawingInfo.BBox.Max);
			if (!axis) {
				console.log('Failed to set the AXIS vertex information');
				return;
				}			

			cameraPos.elements[0] 	= 0.0 * g_drawingInfo.BBox.Max.x;
			cameraPos.elements[1] 	= 0.0 * g_drawingInfo.BBox.Max.y;
			cameraPos.elements[2] 	= 0.5 * g_drawingInfo.BBox.Max.z;
			cameraLook.elements[0] 	= g_drawingInfo.BBox.Center.x;
			cameraLook.elements[1] 	= g_drawingInfo.BBox.Center.y;
			cameraLook.elements[2] 	= g_drawingInfo.BBox.Center.z;
			cameraUp.elements[0] 	= 0.0;
			cameraUp.elements[1] 	= 1.0;
			cameraUp.elements[2] 	= 0.0;
			
			lightPos.elements[0]	= 0.0;
			lightPos.elements[1]	= cameraPos.elements[1];
			lightPos.elements[2]	= cameraPos.elements[2];
			}
		if ( (model.length > 0) && (texturesOK>6) )
			drawScene(gl);
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


function changeLens(value)
{
	uLensType = value - 1;
	drawScene();	
}

function changeRadius(value)
{
	uRadius = value;

	var text = document.getElementById("radius");	
	text.innerHTML = "Raio = " + value;

	drawScene();
}

function changeAlpha(value)
{
	uAlpha = value;
	drawScene();	

	var text = document.getElementById("alpha");	
	text.innerHTML = "Transparencia = " + value;
}

function changeRefraction(value)
{
	uRefraction = value;
	drawScene();	

	var text = document.getElementById("refraction");	
	text.innerHTML = "Refração = " + value;
}

function changePower(value)
{
	uPower = value;
	drawScene();	

	var text = document.getElementById("power");	
	text.innerHTML = "Potencia = " + value;
}

function changeRugosity(value)
{
	uRugosity = Math.max(150 - value, 1);
	if (uRugosity == 150)
		uRugosity = 800;
	drawScene();	

	var text = document.getElementById("rugosity");	
	text.innerHTML = "Rugosidade = " + value;
}

// ********************************************************
// ********************************************************
function handleKeyDown(event) {
	var keyunicode = event.charCode || event.keyCode;
	
	if (keyunicode == 16) 
		Upper = true;

	switch (String.fromCharCode(keyunicode)) 
	{
		case "C"	:
						uLensType = (uLensType + 1) % 3
						drawScene();
						console.log(uLensType);
						break;
		case "1"	:
						uLensType = 0;
						drawScene();
						console.log(uLensType);
						break;
		case "2"	:
						uLensType = 1;
						drawScene();
						console.log(uLensType);
						break;
		case "3"	:
						uLensType = 2;
						drawScene();
						console.log(uLensType);
						break;
		case "4"	:
						uLensType = 3;
						drawScene();
						console.log(uLensType);
						break;
	}
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
	var newRot = new Matrix4();
	
	newRot.setIdentity();
	newRot.rotate(deltaX / 5.0, 0.0, 1.0, 0.0);

	var deltaY = newY - lastMouseY;
	newRot.rotate(deltaY / 5.0, 1.0, 0.0, 0.0);

	modelRotMat.multiply(newRot);

	lastMouseX = newX
	lastMouseY = newY;
	drawScene();
}

