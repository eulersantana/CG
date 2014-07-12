var canvas		= null;
var texture		= null;
var shader		= null;
var shader_cam	= null;
var model		= new Array;
var axis		= null;
var gl			= null;
var Upper		= false;
var ctx 		= null;

var andar       = 0;

var cameraPos 	= new Vector3();
var cameraLook 	= new Vector3();
var cameraUp 	= new Vector3();
var transX		= 0.0;
var transY		= 0.0; 
var transZ		= 0.0;
var rotX		= 0.0;//29.400000000031824;
var rotY		= 0.0; 
var rotZ		= 0.0;//-9.399999999999983;
var FOVy		= 45.0;
var roll		= 0.0;
var pitch 		= 0.0;
var yaw 		= 0.0;

var imageLoaded	= false;
var scaleX 		= 1.2;
var scaleY 		= 1.2;
var scaleZ 		= 1.2;
var near 		= 0.01;
var far 		= 100.0;
var oneFace		= 0.01;
var shift		= false;

var g_objDoc 		= null;	// The information of OBJ file
var g_drawingInfo 	= null;	// The information for drawing 3D model
var listpoints 		= null;

//Relacionado ao evento do mouse
var clickedPoint; 
var fMouseDown 		= false;

var textureVertexPositionBuffer;
var textureVertexCoordBuffer;
var textureVertexIndexBuffer;

// ********************************************************
// ********************************************************
function initGL(canvas) {
	gl = canvas.getContext("webgl");
	ctx = canvas.getContext("2d");
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
function handledLoadedTexture(){
	gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
    gl.bindTexture(gl.TEXTURE_2D, null);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
}

function initTexture(){
	var ctx = canvas.getContext("2d");
	texture = gl.createTexture();
	texture.image = new Image();
	texture.image.onload = function(ev){
		var canvas 			= document.getElementById("imagem");
		var text 			= document.getElementById("output");
		if(texture.image.width > 2048 || texture.image.height > 2048){
			texture.image.width = 2048;
			texture.image.height = 2048;
		}
		canvas.width 		= texture.image.width;
		canvas.height 		= texture.image.height;
		gl.viewportWidth 	= canvas.width;
		gl.viewportHeight 	= canvas.height;
		text.innerHTML 		= 	"Imagem :" + texture.image.src + 
								"<br/> Dimensao = " + texture.image.height +
								" <i>x</i> " + texture.image.width;		
		handledLoadedTexture();
		readPixels(texture);
		initBuffersTexture();
		transX = 0;
		transY = 0;
		transZ = 0;
		imageLoaded = true;
	}
	// texture.image.src = "imagens/streched_0-43798.png";
	texture.image.src = "../../images/terrain.png";
	// texture.image.src = "../../images/gcanyon_height_20m-interpixel_0.1m-altura.bmp";
}

// ********************************************************
// ********************************************************
function initBuffersTexture() {

	var mesh = generatorMeshArray(texture,4);
	
	var vertex = mesh.vertex;
	textureVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW);
    textureVertexPositionBuffer.itemSize = 3;
    textureVertexPositionBuffer.numItems = (vertex.length / textureVertexPositionBuffer.itemSize);

	var textureCoord = mesh.vertexCoord;
	textureVertexCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureVertexCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoord), gl.STATIC_DRAW);
	textureVertexCoordBuffer.itemSize = 2;
	textureVertexCoordBuffer.numItems = (textureCoord.length / textureVertexCoordBuffer.itemSize);

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

	modelMat.rotate(rotX, 1.0, 0.0, 0.0);	
	modelMat.rotate(rotY, 0.0, 1.0, 0.0);
	modelMat.rotate(rotZ, 0.0, 0.0, 1.0);
	modelMat.translate(transX,transY,1.0);

	//volume de visão está fazendo um clip do lado negativo do eixo Z.
	viewMat.lookAt(cameraPos.elements[0],cameraPos.elements[1],cameraPos.elements[2],cameraLook.elements[0],cameraLook.elements[1],cameraLook.elements[2],cameraUp.elements[0],cameraUp.elements[1],cameraUp.elements[2]);

	//para resolver o problema acima iremos definir o volume de visao
	var aspect 	= gl.viewportWidth / gl.viewportHeight;
	projMat.perspective(FOVy,aspect, near, far);

	gl.bindBuffer(gl.ARRAY_BUFFER, textureVertexPositionBuffer);
	gl.vertexAttribPointer(shader.vertexPositionAttribute, textureVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, textureVertexCoordBuffer);
	gl.vertexAttribPointer(shader.textureCoordAttribute, textureVertexCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.uniform1i(shader.samplerUniform, 0);
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, textureVertexIndexBuffer);
	gl.uniformMatrix4fv(shader.uModelMat, false, modelMat.elements);
	gl.uniformMatrix4fv(shader.uViewMat, false, viewMat.elements);
	gl.uniformMatrix4fv(shader.uProjMat, false, projMat.elements);

	// gl.drawArrays(gl.TRIANGLES, 0, textureVertexPositionBuffer.numItems);
	gl.drawArrays(gl.LINES, 0, textureVertexPositionBuffer.numItems);

}
    
// ********************************************************
// ********************************************************

var normalize = function(a){
  return (a + 1) / 2;
}

var normalizeToMapBitPosition = function(x,y,w,h){
  return Math.floor(normalize(x) * w * normalize(y) * h);
}

var generatorMeshArray = function(texture, bits){
	var segmentosX = texture.image.width / bits, segmentosY = texture.image.height / bits;
	var passoX = 2 / segmentosX, passoY = 2 / segmentosY;
	var base = new Ponto(-1,-1);
	var vertex = new Array(), vertexCoord = new Array(), auxiliar = new Array();
	var i = 0, j = 0, a = 0, b = 0;
	do{
		base.x = -1 + i * passoX;
		base.y = -1 + j * passoY;
		auxiliar.push(base.x);
		auxiliar.push(texture.imageHeightData[normalizeToMapBitPosition(base.x,base.y,texture.image.width,texture.image.height)]);
		// auxiliar.push(0.0);
		auxiliar.push(base.y);
		i++;
		if(i == segmentosX + 1){
			j++;
			i=0;
		}
	}while(i <= segmentosX && j <= segmentosY);
	var colunas = Math.sqrt(auxiliar.length / 3);
	var linhas =  colunas;
	var t = auxiliar.length;
	i = 0; j = 0;
	var novaLinha = 3 * linhas;
	var max = colunas * linhas * 3;
	for(var l = 1; l < linhas; l++) {
		for(var c = 0;c < colunas; c++){
			var p = i + novaLinha;
			var pontoAtual = [auxiliar[i],auxiliar[i+1],auxiliar[i+2]];
		    var pontoAbaixoAtual = [auxiliar[p],auxiliar[p+1],auxiliar[p+2]];
			var pontoProx = new Array();
			var pontoAbaixoProx = new Array();
			var ok = ((l * novaLinha - 3) != i);
			var continua = ok && (p + 5 < max);
			if(continua){
				pontoProx 		= [auxiliar[i+3],auxiliar[i+4],auxiliar[i+5]];
				pontoAbaixoProx = [auxiliar[p+3],auxiliar[p+4],auxiliar[p+5]];
				gerarPontos(vertex,vertexCoord,pontoAtual,pontoProx,pontoAbaixoAtual,pontoAbaixoProx);
			}
			i += 3;
		}
	}
	return {vertex: vertex, vertexCoord: vertexCoord};
}

var gerarDiagonais = function(vertex, vertexCoord, pontoAtual, pontoProx, pontoAbaixoAtual, pontoAbaixoProx){

	var medio = [];
	medio[0] = (pontoAtual[0] + pontoProx[0] + pontoAbaixoAtual[0] + pontoAbaixoProx[0]) /4;
	medio[1] = (pontoAtual[1] + pontoProx[1] + pontoAbaixoAtual[1] + pontoAbaixoProx[1]) /4;
	medio[2] = (pontoAtual[2] + pontoProx[2] + pontoAbaixoAtual[2] + pontoAbaixoProx[2]) /4;

	vertex.push(medio[0]);
	vertex.push(medio[1]);
	vertex.push(medio[2]);
	vertexCoord.push(normalize(medio[0]));
	vertexCoord.push(normalize(medio[2]));

	vertex.push(pontoAtual[0]);
	vertex.push(pontoAtual[1]);
	vertex.push(pontoAtual[2]);
	vertexCoord.push(normalize(pontoAtual[0]));
	vertexCoord.push(normalize(pontoAtual[2]));
	
	vertex.push(medio[0]);
	vertex.push(medio[1]);
	vertex.push(medio[2]);
	vertexCoord.push(normalize(medio[0]));
	vertexCoord.push(normalize(medio[2]));

  	vertex.push(pontoProx[0]);
	vertex.push(pontoProx[1]);
	vertex.push(pontoProx[2]);
  	vertexCoord.push(normalize(pontoProx[0]));
	vertexCoord.push(normalize(pontoProx[2]));
	
	vertex.push(medio[0]);
	vertex.push(medio[1]);
	vertex.push(medio[2]);
	vertexCoord.push(normalize(medio[0]));
	vertexCoord.push(normalize(medio[2]));

  	vertex.push(pontoAbaixoProx[0]);
	vertex.push(pontoAbaixoProx[1]);
	vertex.push(pontoAbaixoProx[2]);
	vertexCoord.push(normalize(pontoAbaixoProx[0]));
	vertexCoord.push(normalize(pontoAbaixoProx[2]));

	vertex.push(medio[0]);
	vertex.push(medio[1]);
	vertex.push(medio[2]);
	vertexCoord.push(normalize(medio[0]));
	vertexCoord.push(normalize(medio[2]));

  	vertex.push(pontoAbaixoAtual[0]);
	vertex.push(pontoAbaixoAtual[1]);
	vertex.push(pontoAbaixoAtual[2]);
	vertexCoord.push(normalize(pontoAbaixoAtual[0]));
	vertexCoord.push(normalize(pontoAbaixoAtual[2]));

	//listpoints = vertexCoord;

}

var gerarPontos = function(vertex, vertexCoord, pontoAtual, pontoProx, pontoAbaixoAtual, pontoAbaixoProx){
	
	gerarDiagonais(vertex, vertexCoord, pontoAtual, pontoProx, pontoAbaixoAtual, pontoAbaixoProx);

	/***************/
	vertex.push(pontoAtual[0]);
	vertex.push(pontoAtual[1]);
	vertex.push(pontoAtual[2]);
	vertexCoord.push(normalize(pontoAtual[0]));
	vertexCoord.push(normalize(pontoAtual[2]));

  	vertex.push(pontoAbaixoAtual[0]);
	vertex.push(pontoAbaixoAtual[1]);
	vertex.push(pontoAbaixoAtual[2]);
	vertexCoord.push(normalize(pontoAbaixoAtual[0]));
	vertexCoord.push(normalize(pontoAbaixoAtual[2]));

	/***************/

  	vertex.push(pontoProx[0]);
	vertex.push(pontoProx[1]);
	vertex.push(pontoProx[2]);
	vertexCoord.push(normalize(pontoProx[0]));
	vertexCoord.push(normalize(pontoProx[2]));

  	vertex.push(pontoAbaixoProx[0]);
	vertex.push(pontoAbaixoProx[1]);
	vertex.push(pontoAbaixoProx[2]);
	vertexCoord.push(normalize(pontoAbaixoProx[0]));
	vertexCoord.push(normalize(pontoAbaixoProx[2]));

	/***************/

  	vertex.push(pontoAtual[0]);
	vertex.push(pontoAtual[1]);
	vertex.push(pontoAtual[2]);
	vertexCoord.push(normalize(pontoAtual[0]));
	vertexCoord.push(normalize(pontoAtual[2]));

	vertex.push(pontoProx[0]);
	vertex.push(pontoProx[1]);
	vertex.push(pontoProx[2]);
	vertexCoord.push(normalize(pontoProx[0]));
	vertexCoord.push(normalize(pontoProx[2]));

	/***************/

  	vertex.push(pontoAbaixoAtual[0]);
	vertex.push(pontoAbaixoAtual[1]);
	vertex.push(pontoAbaixoAtual[2]);
	vertexCoord.push(normalize(pontoAbaixoAtual[0]));
	vertexCoord.push(normalize(pontoAbaixoAtual[2]));

	vertex.push(pontoAbaixoProx[0]);
	vertex.push(pontoAbaixoProx[1]);
	vertex.push(pontoAbaixoProx[2]);
	vertexCoord.push(normalize(pontoAbaixoProx[0]));
	vertexCoord.push(normalize(pontoAbaixoProx[2]));

	listpoints = vertex;


}


var readPixels = function(texture){
  var x = 0;
  var y = 0;
  var canvas = document.createElement('canvas');
  canvas.width = texture.image.width;
  canvas.height = texture.image.height;
  var context = canvas.getContext('2d');
  context.drawImage(texture.image,0,0);
  var size = canvas.width * canvas.height;
  var data = new Float32Array(size);
  var imageData = context.getImageData(x, y, canvas.width, canvas.height);
  texture.imageData = imageData;
  var pix = imageData.data;
  var j=0, all = 0;
  var max = 1;
  //Calculando a altura baseado no pixel da imagem;
  for (var i = 0, n = pix.length; i < n; all = pix[i] / 255 * max, data[j++] = all,i += (4));// pix[i]+pix[i+1]+pix[i+2];
  texture.imageHeightData = data;
}

// ********************************************************
// ********************************************************
function webGLStart() {
	document.onkeydown 	= handleKeyDown;
	document.onkeyup 	= handleKeyUp;
	
	canvas 	= document.getElementById("imagem");

	canvas.onmousedown 	= onmousedown;
	canvas.onmousemove 	= onmousemove;
	canvas.onmouseup 	= onmouseup;

	gl 					= initGL(canvas);
	
	// TEXTURE
	shader 		= initShaders("shader", gl);
	if (shader == null) {
		alert("Erro na inicilização do shader!!");
		return;
	}
	shader.vertexPositionAttribute 	= gl.getAttribLocation(shader, "aVertexPosition");
	shader.textureCoordAttribute 	= gl.getAttribLocation(shader, "aVertexTexture");
	
	shader.SamplerUniform	 		= gl.getUniformLocation(shader, "uSampler");
	shader.uModelMat 				= gl.getUniformLocation(shader, "uModelMat");
	shader.uViewMat 				= gl.getUniformLocation(shader, "uViewMat");
	shader.uProjMat 				= gl.getUniformLocation(shader, "uProjMat");

	if( //(shader.vertexPositionAttribute < 0) ||
		 (shader.textureCoordAttribute < 0) ||
		 (shader.SamplerUniform < 0) ) {
		alert("Shader attribute ou uniform não localizado!");
		return;
	}
	
	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
	gl.enableVertexAttribArray(shader.textureCoordAttribute);
	
	initTexture();

	//OBJECT
	shader_cam 	= initShaders("SistVis", gl);
	shader_cam.vPositionAttr 	= gl.getAttribLocation(shader_cam, "aVertexPosition");		
	shader_cam.vColorAttr 		= gl.getAttribLocation(shader_cam, "aVertexColor");
	shader_cam.uModelMat 		= gl.getUniformLocation(shader_cam, "uModelMat");
	shader_cam.uViewMat 		= gl.getUniformLocation(shader_cam, "uViewMat");
	shader_cam.uProjMat 		= gl.getUniformLocation(shader_cam, "uProjMat");

	if (shader_cam.vPositionAttr < 0 	|| 
		shader_cam.vColorAttr < 0 		|| 
		!shader_cam.uModelMat 			|| 
		!shader_cam.uViewMat 			|| 
		!shader_cam.uProjMat) {
		console.log("Error getAttribLocation"); 
		return;
	}
		
	readOBJFile("../../modelos/cubeMultiColor.obj", gl, 1, true);
	
	var tick = function() {   // Start drawing
		if (g_objDoc != null && g_objDoc.isMTLComplete()) { // OBJ and all MTLs are available			
			onReadComplete(gl);
			g_objDoc = null;
			
			//camera dentro do cubo
			//coordenadas do mundo
			//colocando no ponto maior.
			cameraPos.elements[0] 	= g_drawingInfo.BBox.Min.x * 2.0;
			cameraPos.elements[1] 	= g_drawingInfo.BBox.Max.y;
			cameraPos.elements[2] 	= g_drawingInfo.BBox.Min.z * 0.5;

			//onde estou olhando
			cameraLook.elements[0] 	= 0;//g_drawingInfo.BBox.Center.x;
			cameraLook.elements[1] 	= g_drawingInfo.BBox.Max.y / 2;
			cameraLook.elements[2] 	= 0;//g_drawingInfo.BBox.Center.z;
			
			//up
			cameraUp.elements[0] 	= 0.0;
			cameraUp.elements[1] 	= 1.0;
			cameraUp.elements[2] 	= 0.0;

		}
		if (model.length > 0 && imageLoaded){
			drawScene();
		}else  
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
		case "W" :
			// console.log(cameraPos.elements);
			// console.log(cameraLook.elements);
			cameraLook.elements[0]  += 0.01;
			cameraPos.elements[0] 	+= 0.01;
			break;

		case "S" :
			cameraPos.elements[0] 	-= 0.01;
			cameraLook.elements[0]  -= 0.01;
			break;

		case "D" :
			cameraLook.elements[2] 	+= 0.01;
			break;

		case "A" :
			cameraLook.elements[2] 	-= 0.01;	
			break;

		case "I" :

			andar += 3;
			
			cameraPos.elements[0] 	=  listpoints[andar];
			cameraPos.elements[1] 	=  listpoints[andar+1];
			cameraPos.elements[2] 	=  listpoints[andar+2];

			//onde estou olhando
			cameraLook.elements[0] 	= 0;//g_drawingInfo.BBox.Center.x;
			cameraLook.elements[1] 	= g_drawingInfo.BBox.Max.y / 2;
			cameraLook.elements[2] 	= 0;//g_drawingInfo.BBox.Center.z;
			
			FOVy = 5; 
			//up
			cameraUp.elements[0] 	= 0.0;
			cameraUp.elements[1] 	= 1.0;
			cameraUp.elements[2] 	= 0.0;

			break;

		case "K" :

			andar -= 3;
			
			cameraPos.elements[0] 	= listpoints[andar];
			cameraPos.elements[1] 	=  listpoints[andar+1];
			cameraPos.elements[2] 	=  listpoints[andar+2];

			//onde estou olhando
			cameraLook.elements[0] 	= 0;//g_drawingInfo.BBox.Center.x;
			cameraLook.elements[1] 	= g_drawingInfo.BBox.Max.y / 2;
			cameraLook.elements[2] 	= 0;//g_drawingInfo.BBox.Center.z;
			
			//up
			cameraUp.elements[0] 	= 0.0;
			cameraUp.elements[1] 	= 1.0;
			cameraUp.elements[2] 	= 0.0;

			break;

		case "M" :
			
			rotY = 0.4;
			cameraPos.elements[0] 	= -0.029999995604157448;
			cameraPos.elements[1] 	= 4.0 * g_drawingInfo.BBox.Max.y;
			cameraPos.elements[2] 	= 0.1 * g_drawingInfo.BBox.Max.z;
			cameraLook.elements[0] 	= -0.03;
			cameraLook.elements[1] 	= g_drawingInfo.BBox.Center.y;
			cameraLook.elements[2] 	= g_drawingInfo.BBox.Center.z;
			cameraUp.elements[0] 	= 0.0;
			cameraUp.elements[1] 	= 1.0;
			cameraUp.elements[2] 	= 0.0;
				cameraPos.elements[0] 	-= 0.01;
			cameraLook.elements[0]  -= 0.01;	
					break;

	}

	switch (keyunicode) {
		case 16:
			shift = !shift;
			break;

		case 27	:	// ESC			
			scaleX = scaleY = scaleZ = 1.5;
			transX = transY = transZ = 0;

			var FOVy		= 45.0;


			cameraPos.elements[0] 	= scaleX * g_drawingInfo.BBox.Max.x;
			cameraPos.elements[1] 	= scaleY * g_drawingInfo.BBox.Max.y;
			cameraPos.elements[2] 	= scaleZ * g_drawingInfo.BBox.Max.z;
			
			cameraLook.elements[0] 	= 0;//g_drawingInfo.BBox.Center.x;
			cameraLook.elements[1] 	= g_drawingInfo.BBox.Max.y / 2;
			cameraLook.elements[2] 	= 0;//g_drawingInfo.BBox.Center.z;
			
			cameraUp.elements[0] 	= 0.0;
			cameraUp.elements[1] 	= 1.0;
			cameraUp.elements[2] 	= 0.0;
			break;
						
		case 33	:	// Page Up
			FOVy += 1;
			break;
		case 34	:	// Page Down
			FOVy -= 1;
			break;
		case 37	:	// Left cursor key			
			cameraLook.elements[0] 	-= 0.01;
			break;
		case 38	:	// Up cursor key
			cameraLook.elements[1] 	+= 0.01;
			break;
		case 39	:	// Right cursor key
			cameraLook.elements[0] 	+= 0.01;
			break;
		case 40	:	// Down cursor key
			cameraLook.elements[1] 	-= 0.01;
			break;
		case 97: //1
			rotZ -= 0.1;
			break;
		case 98: //2
			rotZ += 0.1;
			break;

	}
	if(imageLoaded){
		drawScene();	
	}
}

var Ponto = function(x,y){
	this.x 		= x;
	this.y 		= y;
};

function onmousedown(event){
	var rect = canvas.getBoundingClientRect();
	clickedPoint = new Ponto(event.clientX - rect.left, event.clientY - rect.right);
	fMouseDown = true;
}

function onmousemove(event){
	if(fMouseDown){
		var rect = canvas.getBoundingClientRect();
		newPoint 		= new Ponto(event.clientX - rect.left, event.clientY - rect.right);
		clickedPoint 	= new Ponto(newPoint.x - clickedPoint.x, newPoint.y - clickedPoint.y);
		if(clickedPoint.x < 0){
			rotY -= 0.1;
		}else{
			rotY += 0.1;
		}
		drawScene();
	}
}

function onmouseup(event){
	fMouseDown = false;
}