var gl			= null;
var ctx 		= null;
var canvas		= null;
var texture		= null;
var shader		= null;
var model		= new Array;
var mesh 		= new Array;

var textureVertexPositionBuffer;
var textureVertexCoordBuffer;
var textureVertexIndexBuffer;

//variaveis de controle
var Upper				= false;
var imageLoaded			= false;
var cameraSelecionada 	= null;
var modo 				= null;

//cameras
var camerasPos 	= { geral: new Vector3(), voadora: new Vector3(), terreno: new Vector3() };
var camerasLook = { geral: new Vector3(), voadora: new Vector3(), terreno: new Vector3() };
var camerasUp 	= { geral: new Vector3(), voadora: new Vector3(), terreno: new Vector3() };

//Ambiente
var FOVy		= 50.0;
var near 		= 0.01;
var far 		= 100.0;

var transX		= 0.0;
var transY		= 0.0; 
var transZ		= 0.0;
var rotX		= 0.0;//29.400000000031824;
var rotY		= 0.0; 
var rotZ		= 0.0;//-9.399999999999983;

var scaleX 		= 1.2;
var scaleY 		= 1.2;
var scaleZ 		= 1.2;

var g_objDoc 	  = null;	// The information of OBJ file
var g_drawingInfo = null;	// The information for drawing 3D model

var passoW 	 	= 0;
var passoH 	 	= 0;
var bits 		= 4;

var X = 0, Y = 1, Z = 2;
var fatorX  = 2, fatorZ = 0.5;

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

	readOBJFile("../../modelos/cubeMultiColor.obj", gl, 1, true);

	var tick = function() {   // Start drawing
		if (g_objDoc != null && g_objDoc.isMTLComplete()) { // OBJ and all MTLs are available			
			onReadComplete(gl);
			g_objDoc = null;
			initCameras();
		}
		if (model.length > 0 && imageLoaded){
			drawScene();
		}else {
			requestAnimationFrame(tick, canvas);
		}
	};	
	tick();

}

// ********************************************************
// ********************************************************

function initGL(canvas) {
	gl = canvas.getContext("webgl");
	ctx = canvas.getContext("2d");
	if (!gl) { 
		alert("Could not initialise WebGL, sorry :-(");
		return gl;
	}
	modo = gl.LINES;
	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
	return gl;
}

// ********************************************************
// ********************************************************

function initTexture(){
	var ctx = canvas.getContext("2d");
	texture = gl.createTexture();
	texture.image = new Image();
	texture.image.onload = function(ev){
		var canvas 			= document.getElementById("imagem");
		if(texture.image.width % 2 != 0){
			texture.image.width = 512;
		}

		if(texture.image.height % 2 != 0){
			texture.image.height = 512;
		}
		
		if(texture.image.width > 2048 || texture.image.height > 2048){
			texture.image.width = 2048;
			texture.image.height = 2048;
		}
		canvas.width 		= texture.image.width;
		canvas.height 		= texture.image.height;
		gl.viewportWidth 	= canvas.width;
		gl.viewportHeight 	= canvas.height;
	
		handledLoadedTexture();
		readPixels(texture);
		initBuffersTexture();
		transX = 0;
		transY = 0;
		transZ = 0;
		imageLoaded = true;
	}
	// texture.image.src = "imagens/streched_0-43798.png";
	texture.image.src = "images/terrain.png";
	// texture.image.src = "images/ps_height_16m-interpixel_0.1m-altura_16bits.png";
	// texture.image.src = "images/lena.png";
	// texture.image.src = "images/zelda.png";
	// texture.image.src = "images/gcanyon_height_20m-interpixel_0.1m-altura.bmp";
}

function handledLoadedTexture(){
	gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
    gl.bindTexture(gl.TEXTURE_2D, null);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
}

function initBuffersTexture() {

	mesh = generatorMeshArray(texture);
	
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

function drawScene() {
	var output = document.getElementById("info");
	output.innerHTML = "<strong> Câmera: </strong>"+cameraSelecionada.toUpperCase();

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
	viewMat.lookAt(camerasPos[cameraSelecionada].elements[0],camerasPos[cameraSelecionada].elements[1],camerasPos[cameraSelecionada].elements[2],camerasLook[cameraSelecionada].elements[0],camerasLook[cameraSelecionada].elements[1],camerasLook[cameraSelecionada].elements[2],camerasUp[cameraSelecionada].elements[0],camerasUp[cameraSelecionada].elements[1],camerasUp[cameraSelecionada].elements[2]);

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

	gl.drawArrays(modo, 0, textureVertexPositionBuffer.numItems);
	// gl.drawArrays(gl.LINES, 0, textureVertexPositionBuffer.numItems);

}
    
/********************************************************************************/

var normalize = function(a){
  return (a + 1) / 2;
}

var normalizeToMapBitPosition = function(x,y,w,h){
  return Math.floor(normalize(x) * w * normalize(y) * h);
}

var generatorMeshArray = function(texture){
	var segmentosX = texture.image.width / bits, segmentosY = texture.image.height / bits;
	passoW = 2 / segmentosX, passoH = 2 / segmentosY;
	var base = new Ponto(-1,-1);
	var vertex = new Array(), vertexCoord = new Array(), auxiliar = new Array();
	var i = 0, j = 0, a = 0, b = 0;
	do{
		base.x = -1 + i * passoW;
		base.y = -1 + j * passoH;
		auxiliar.push(base.x);
		auxiliar.push(texture.imageHeightData[normalizeToMapBitPosition(base.x,base.y,texture.image.width,texture.image.height)]);
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
				if(modo == gl.LINES){
					gerarPontos(vertex,vertexCoord,pontoAtual,pontoProx,pontoAbaixoAtual,pontoAbaixoProx);
				}else{
					gerarTriangulos(vertex,vertexCoord,pontoAtual,pontoProx,pontoAbaixoAtual,pontoAbaixoProx);
				}
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

}


var gerarTriangulos = function(vertex, vertexCoord, pontoAtual, pontoProx, pontoAbaixoAtual, pontoAbaixoProx){

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


/*****************************************************************************************/

function initCameras(){

	cameraSelecionada = "geral";

	camerasPos.geral.elements[X] 	= g_drawingInfo.BBox.Min.x * 0.0;
	camerasPos.geral.elements[Y] 	= g_drawingInfo.BBox.Max.y * 2.5;
	camerasPos.geral.elements[Z] 	= g_drawingInfo.BBox.Min.z * 2.5;

	camerasLook.geral.elements[X] 	= g_drawingInfo.BBox.Center.x;
	camerasLook.geral.elements[Y] 	= g_drawingInfo.BBox.Max.y / 2;
	camerasLook.geral.elements[Z] 	= g_drawingInfo.BBox.Min.z * 0.5;
	
	camerasUp.geral.elements[X] 	= 0.0;
	camerasUp.geral.elements[Y] 	= 1.0;
	camerasUp.geral.elements[Z] 	= 0.0;

	camerasPos.voadora.elements[X] 	= g_drawingInfo.BBox.Min.x * fatorX;
	camerasPos.voadora.elements[Y] 	= g_drawingInfo.BBox.Max.y;
	camerasPos.voadora.elements[Z] 	= g_drawingInfo.BBox.Min.z * fatorZ;

	camerasLook.voadora.elements[X] = g_drawingInfo.BBox.Center.x;
	camerasLook.voadora.elements[Y] = g_drawingInfo.BBox.Max.y / 2;
	camerasLook.voadora.elements[Z] = g_drawingInfo.BBox.Center.z;
	
	camerasUp.voadora.elements[X] 	= 0.0;
	camerasUp.voadora.elements[Y] 	= 1.0;
	camerasUp.voadora.elements[Z] 	= 0.0;

	var y = mesh.vertex[mesh.vertex.contains(camerasPos.terreno.elements[X],camerasPos.terreno.elements[Z],3)+1];
	
	camerasPos.terreno.elements[X] 	= g_drawingInfo.BBox.Min.x;
	camerasPos.terreno.elements[Y] 	= y;
	camerasPos.terreno.elements[Z] 	= g_drawingInfo.BBox.Min.z;

	camerasLook.terreno.elements[X] = g_drawingInfo.BBox.Max.x;
	camerasLook.terreno.elements[Y] = g_drawingInfo.BBox.Max.y / 2;
	camerasLook.terreno.elements[Z] = g_drawingInfo.BBox.Max.z;
	
	camerasUp.terreno.elements[X] 	= 0.0;
	camerasUp.terreno.elements[Y] 	= 1.0;
	camerasUp.terreno.elements[Z] 	= 0.0;

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

function salto(pulo){

	//Verificando se a posição atual da câmera em x e z está no vertex.
	var posAtual = mesh.vertex.contains(camerasPos[cameraSelecionada].elements[X],camerasPos[cameraSelecionada].elements[Z],3);
	var proxPosCameraX = camerasPos[cameraSelecionada].elements[X] + passoW;
	var proxPosCameraZ = camerasPos[cameraSelecionada].elements[Z] + passoH;
	var proxPos = mesh.vertex.contains(proxPosCameraX,proxPosCameraZ,3);
	
	if(proxPos != -1){
		var limiar = 0.1;
		var limiarPulo = 0.3;
		var diff 	   = mesh.vertex[proxPos+1]-mesh.vertex[posAtual+1];
		var diffAltura = Math.abs(diff);
		if(!pulo){
			if(diffAltura <= limiar){
				camerasLook[cameraSelecionada].elements[X]  += passoW;
				camerasLook[cameraSelecionada].elements[Z]  += passoH;
				camerasPos[cameraSelecionada].elements[X] 	+= passoW;
				camerasPos[cameraSelecionada].elements[Y] 	+= diff;
				camerasPos[cameraSelecionada].elements[Z] 	+= passoH;
			}else{
				document.getElementById("pulo").innerHTML = "Você não pode subir.<br/>";	
				if(diffAltura < limiarPulo){
					document.getElementById("pulo").innerHTML += "Você pode utilizar o pulo.";
				}else{
					document.getElementById("pulo").innerHTML += "Você não pode utilizar o pulo.";
				}
			}
		}else if(limiarPulo > diffAltura){
			camerasLook[cameraSelecionada].elements[X]  += passoW;
			camerasLook[cameraSelecionada].elements[Z]  += passoH;
			camerasPos[cameraSelecionada].elements[X] 	+= passoW;
			camerasPos[cameraSelecionada].elements[Y] 	+= diffAltura;
			camerasPos[cameraSelecionada].elements[Z] 	+= passoH;	
		}else{
			document.getElementById("pulo").innerHTML = "Você não pode utilizar o pulo.";	
		}
	}
}

function saltoTras(pulo){

	//Verificando se a posição atual da câmera em x e z está no vertex.
	var posAtual = mesh.vertex.contains(camerasPos[cameraSelecionada].elements[X],camerasPos[cameraSelecionada].elements[Z],3);
	var proxPosCameraX = camerasPos[cameraSelecionada].elements[X] - passoW;
	var proxPosCameraZ = camerasPos[cameraSelecionada].elements[Z] - passoH;
	var proxPos = mesh.vertex.contains(proxPosCameraX,proxPosCameraZ,3);
	
	if(proxPos != -1){
		var limiar = 0.1;
		var limiarPulo = 0.3;
		var diff 	   = mesh.vertex[proxPos-1]-mesh.vertex[posAtual-1];
		var diffAltura = Math.abs(diff);
		if(!pulo){
			if(diffAltura <= limiar){
				camerasLook[cameraSelecionada].elements[X]  -= passoW;
				camerasLook[cameraSelecionada].elements[Z]  -= passoH;
				camerasPos[cameraSelecionada].elements[X] 	-= passoW;
				camerasPos[cameraSelecionada].elements[Y] 	-= diff;
				camerasPos[cameraSelecionada].elements[Z] 	-= passoH;
			}else{
				document.getElementById("pulo").innerHTML = "Você não pode subir.<br/>";	
				if(diffAltura < limiarPulo){
					document.getElementById("pulo").innerHTML += "Você pode utilizar o pulo.";
				}else{
					document.getElementById("pulo").innerHTML += "Você não pode utilizar o pulo.";
				}
			}
		}else if(limiarPulo > diffAltura){
			camerasLook[cameraSelecionada].elements[X]  -= passoW;
			camerasLook[cameraSelecionada].elements[Z]  -= passoH;
			camerasPos[cameraSelecionada].elements[X] 	-= passoW;
			camerasPos[cameraSelecionada].elements[Y] 	-= diff;
			camerasPos[cameraSelecionada].elements[Z] 	-= passoH;	
		}else{
			document.getElementById("pulo").innerHTML = "Você não pode utilizar o pulo.";	
		}
	}
}

function moverPositivo(){
	if(cameraSelecionada == "voadora"){
		//Verificando se a posição atual da câmera em x e z está no vertex
		var vx = camerasPos[cameraSelecionada].elements[X]/fatorX;
		var vz = camerasPos[cameraSelecionada].elements[Z]/fatorZ;
		var posAtual = mesh.vertex.contains(vx,vz,3);
		var proxPosCameraX = camerasPos[cameraSelecionada].elements[X] / fatorX + passoW;
		var proxPosCameraZ = camerasPos[cameraSelecionada].elements[Z] / fatorZ + passoH;
		var proxPos = mesh.vertex.contains(proxPosCameraX,proxPosCameraZ,3);
		if(proxPos != -1){
			diff = mesh.vertex[proxPos+1]-mesh.vertex[posAtual+1];
			var m = 5;
			camerasLook[cameraSelecionada].elements[X]  += m* passoW;
			camerasLook[cameraSelecionada].elements[Y]	+= diff;
			camerasLook[cameraSelecionada].elements[Z]  += m * passoH;
			camerasPos[cameraSelecionada].elements[X] 	= (vz + m * passoW) * fatorX;
			camerasPos[cameraSelecionada].elements[Y]	+= diff;
			camerasPos[cameraSelecionada].elements[Z] 	= (vz + m * passoH) * fatorZ;
		}
	}else if(cameraSelecionada == "terreno"){
		salto(false);
	}
}

function handleKeyDown(event) {

	document.getElementById("pulo").innerHTML = "";

	var keyunicode = event.charCode || event.keyCode;
	
	if (keyunicode == 16) 
		Upper = true;

	switch (String.fromCharCode(keyunicode)) {
		case "W" :
			moverPositivo();
			break;

		case "S" :
			if(cameraSelecionada == "terreno"){
				saltoTras(false);
			}
			break;

		case "D" :
			if(cameraSelecionada == "voadora"){
				rotZ += 0.1;
//				camerasLook[cameraSelecionada].elements[2] 	+= 0.01;
			}
			break;

		case "A" :
			if(cameraSelecionada == "voadora"){
				rotZ -= 0.1;
//				camerasLook[cameraSelecionada].elements[2] 	-= 0.01;
			}	
			break;

		case "M" :
			if(modo == gl.LINES){
				modo = gl.TRIANGLES;
			}else{
				modo = gl.LINES;
			}
			initBuffersTexture();
			break;

		case "U":
			if(cameraSelecionada == "geral"){
				rotZ = 180;
				camerasPos[cameraSelecionada].elements[0] 	= 0.0;
				camerasPos[cameraSelecionada].elements[1] 	= 4.0 * g_drawingInfo.BBox.Max.y;
				camerasPos[cameraSelecionada].elements[2] 	= 0.1 * g_drawingInfo.BBox.Max.z;
				camerasLook[cameraSelecionada].elements[1] 	= g_drawingInfo.BBox.Center.x;
				camerasLook[cameraSelecionada].elements[1] 	= g_drawingInfo.BBox.Center.y;
				camerasLook[cameraSelecionada].elements[2] 	= g_drawingInfo.BBox.Center.z;
				camerasUp[cameraSelecionada].elements[0] 	= 0.0;
				camerasUp[cameraSelecionada].elements[1] 	= 1.0;
				camerasUp[cameraSelecionada].elements[2] 	= 0.0;
			}
			break;

		case "G":
			cameraSelecionada = "geral";
			rotZ = 0, rotY = 0, rotX = 0;
			break;

		case "V":
			cameraSelecionada = "voadora";
			rotZ = 0, rotY = 0, rotX = 0;
			break;

		case "T":
			cameraSelecionada = "terreno";
			rotZ = 0, rotY = 0, rotX = 0;	
			break;

		case "P":
			if(cameraSelecionada == "terreno"){
				salto(true);
			}
			break;

	}

	switch (keyunicode) {
		
		case 27	:	// ESC
			transX = transY = transZ = 0;
			initCameras();
			break;
						
		case 33	:	// Page Up
			FOVy += 1;
			break;

		case 34	:	// Page Down
			FOVy -= 1;
			break;
		
		case 37	:	// Left cursor key			
			if(cameraSelecionada == "voadora"){
				rotY -= 0.1;
				// camerasLook[cameraSelecionada].elements[0] 	-= 0.01;
			}
			break;
		
		case 38	:	// Up cursor key
			if(cameraSelecionada == "voadora"){
				rotX -= 0.1;
				// camerasLook[cameraSelecionada].elements[1] 	+= 0.01;
			}
			break;
		
		case 39	:	// Right cursor key
			if(cameraSelecionada == "voadora"){
				rotY += 0.1;
				// camerasLook[cameraSelecionada].elements[0] 	+= 0.01;
			}
			break;
		
		case 40	:	// Down cursor key
			if(cameraSelecionada == "voadora"){
				rotX += 0.1;
				// camerasLook[cameraSelecionada].elements[1] 	-= 0.01;
			}
			break;
		
		case 97: //1
			rotY -= 0.1;
			break;

		case 98: //2
			rotY += 0.1;
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

/****************************************************************************************/

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

Array.prototype.contains = function (needle, needle2, increment) {
   for(var i = 0; i < this.length; i+=increment){
       if(this[i] == needle && this[i+2] == needle2) return i;
   }
   return -1;
}