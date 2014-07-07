var canvas		= null;
var texture		= null;
var shader		= null;
var gl			= null;
var Upper		= false;

var cameraPos 	= new Vector3();
var cameraLook 	= new Vector3();
var cameraUp 	= new Vector3();

var rotY		= 0.0;

var heightMap	= []; // Mapa de altura
var cameraType  = null; // Tipo da camera que esta sendo utilizada
var LOD 		= 7; // Nivel de detalhe utilizado na imagem
var roll		= 0.0; // Responsavel pela rotação da camera em X
var pitch 		= 0.0; // Responsavel pela rotação da camera em Z
var yaw 		= 0.0; // Responsavel pela rotação da camera em Y
var wireframe	= true; // Se deve ser exibido o wireframe ou o modelo 3D
var speed 		= 0.005; // Velocidade de movimento
var nomeImagem = "../../images/terrain.png" // Imagem a ser processada

var xPos 		= 0; // Translação em X da camera
var yPos 		= 0; // Translação em Y da camera
var zPos 		= 0; // Translação em Z da camera

var FOVy		= 45.0; 
var near 		= 0.0001;
var far 		= 500.0;

//Relacionados ao evento do mouse
var clickedPoint; 
var fMouseDown 		= false;

var textureVertexPositionBuffer;
var textureVertexCoordBuffer;
var textureVertexIndexBuffer;

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

function initTexture(){
	texture = gl.createTexture();
	texture.image = new Image();
	texture.image.onload = function(ev){
		var canvas 			= document.getElementById("imagem");
		
		gl.viewportWidth 	= canvas.width;
		gl.viewportHeight 	= canvas.height;

		// Obtendo o mapa de altura
		heightMap = getHeightData(texture.image);
		initBuffersTexture();

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.bindTexture(gl.TEXTURE_2D, null);	

		// Funcao para redesenhar a cena num intervalo constante
		// permitindo a "animação" do canvas
		setInterval(function(){ 
								drawScene();
							  },10)
	}
	
	texture.image.src = nomeImagem;
}

// ********************************************************
// Função para acessar a altura correspondente a um ponto
function getHeight(x, y)
{
	var size = 512
	x = (x + 1) / 2
	y = (y + 1) / 2
	var index = Math.floor(x * size * y * size);

	return heightMap[index];
}

// ********************************************************
// Calculo de ponto medio entre dois pontos
function medPoint(pointA, pointB)
{
	var x = (pointA[0] + pointB[0]) / 2;
	var z = (pointA[2] + pointB[2]) / 2;

	return [ x,
			 getHeight(z,x),
			 z ];
}

// ********************************************************
// Ordenação de pontos no sentido anti-horario
// min = valor minimo de x entre os pontos do array
function sortPoints(array, min)
{
	return array.sort(function (a,b) {
		if (b[0] - a[0] == 0)
			if (b[0] == min) 
				return a[2] - b[2]	
			else
				return b[2] - a[2]
		else
			return b[0] - a[0] 
	});
}

// ********************************************************
// Criação dos pontos que formam cada um dos quadrados
// base = 4 primeiros pontos que formam o quadrado original
// n = nivel de detalhe
function createPoints(base, n)
{
	var a = sortPoints(base, Math.min( Math.min( base[0][0], base[1][0] ),
								   base[2][0]))

	// Quantidade de "quadrados" a serem construidos
	var amount = 0

	for (var i = n; i > 0; i--)
		amount += Math.pow(4,i-1)

	for(var j = 0; j < amount; j++)
	{
		var points = []
		
		// Ponto inicial que formara, junto com seus vizinhos o proximo
		// conjunto de quadrados
		var base = Math.floor((a.length/4) - 1)
		
		var m = (medPoint( medPoint( a[base+1], a[base] ), 
				 		   medPoint( a[base+2], a[base+3] ) ) )
		
		for(var i = 0; i < 4; i++)
		{
			var temp = []
			
			temp.push(a[base+i])			
			temp.push(medPoint(a[base+i],a[base+(i+1) % 4]))
			temp.push(medPoint(a[base+i],a[(i < 1) ? base+3 : base+i-1]))
			temp.push(m)
			
			temp = sortPoints(temp,Math.min(m[0],temp[0][0]))

			points = points.concat(temp)
		}	
		a = a.concat(points)	
	}

	if (wireframe)
		return createVertexLines(a.slice(amount*4))

	return createVertexTriangles(a.slice(amount*4))
}

// ********************************************************
// Função alternativa ao createPoints 
// -------- Não Utilizada --------
function createPoints2(n)
{
	n = 3
	var distance = 2 / Math.pow(2,n);
	var numPoints = Math.pow(2,n) + 1;
	var points = []

	var b = new Date();

	for (var j = 0; j < numPoints - 1; j++)
		for (var i = 0; i < numPoints - 1; i++)
		{
			var temp = []
			var base = [1-j*distance, getHeight(1-j*distance,1-i*distance), 1-i*distance];
						
			temp.push(base)
			temp.push([base[0],
					   getHeight(base[0],base[2]-distance),
					   base[2]-distance])
			temp.push([base[0]-distance,
					   getHeight(base[0]-distance,base[2]-distance),
					   base[2]-distance])			
			temp.push([base[0]-distance,
					   getHeight(base[0]-distance,base[2]),
					   base[2]])

			points = points.concat(temp);
		}

	var a = new Date();

	return createVertexLines(points);
}

// ********************************************************
// Gera os pontos do buffer de vertices para renderizacao como wireframe
// points = vetor de pontos
function createVertexLines(points)
{
	var lines = [];
	for (var i = 0; i < points.length - 1; i+=4)
	{
		//	v2----v1
		//  |	   |
		//  v3----v4
		// Ordem de criação

		// v1 -> v2
		lines.push(points[i][0], points[i][1], points[i][2])
		lines.push(points[i+1][0], points[i+1][1], points[i+1][2])

		// v2 -> v3
		lines.push(points[i+1][0], points[i+1][1], points[i+1][2])
		lines.push(points[i+2][0], points[i+2][1], points[i+2][2])

		// v3 -> v4
		lines.push(points[i+2][0], points[i+2][1], points[i+2][2])
		lines.push(points[i+3][0], points[i+3][1], points[i+3][2])

		// v4 -> v1
		lines.push(points[i+3][0], points[i+3][1], points[i+3][2])
		lines.push(points[i][0], points[i][1], points[i][2])
	}

	return lines;
}

// ********************************************************
// Gera os pontos do buffer de vertices para renderizacao como modelo 3D
// points = vetor de pontos
function createVertexTriangles(points)
{
	var triangles = [];
	for (var i = 0; i < points.length - 1; i+=4)
	{
		//	v2----v1
		//  | 	/ |
		//  |  /  |
		//  v3----v4
		// Ordem de criação

		// v1 -> v2 -> v3
		triangles.push(points[i][0], points[i][1], points[i][2])
		triangles.push(points[i+1][0], points[i+1][1], points[i+1][2])
		triangles.push(points[i+2][0], points[i+2][1], points[i+2][2])

		// v1 -> v3 -> v4
		triangles.push(points[i][0], points[i][1], points[i][2])
		triangles.push(points[i+2][0], points[i+2][1], points[i+2][2])
		triangles.push(points[i+3][0], points[i+3][1], points[i+3][2])
	}

	return triangles;
}

// ********************************************************
// Partindo do vetor de vertices, cria-se o vetor de pontos da textura
function createTextureTriangles(points)
{
	var texture = [];
	for (var i = 0; i < points.length; i+=3)
		texture.push( (points[i] + 1) / 2, 
					  (points[i+2] + 1) / 2)
	return texture;
}

// ********************************************************
// ********************************************************
function initBuffersTexture() {
	var vertex = createPoints([ [ 1.0, getHeight(1,1), 1.0],
								[-1.0, getHeight(-1,1), 1.0],
								[-1.0, getHeight(-1,-1),-1.0],
								[ 1.0, getHeight(1,-1),-1.0]], LOD);
	
	textureVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW);
    textureVertexPositionBuffer.itemSize = 3;
    textureVertexPositionBuffer.numItems = vertex.length/3;

	textureCoord = createTextureTriangles(vertex);
	textureVertexCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureVertexCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoord), gl.STATIC_DRAW);
	textureVertexCoordBuffer.itemSize = 2;
	textureVertexCoordBuffer.numItems = vertex.length/3;
}

// ********************************************************
// Função para obter os dados do mapa de altura
function getHeightData(img) {
    var canvas = document.createElement( 'canvas' );

    canvas.width = img.width;
    canvas.height = img.height;
    
    var context = canvas.getContext( '2d' );
    context.drawImage(img,0,0);
    
    // Obtenção de dados da imagem
    var imgd = context.getImageData(0, 0, canvas.width, canvas.height);
    // Obtenção somente dos dados referentes a cor de cada pixel da imagem
    var pix = imgd.data;
    
    var data = []
    var j=0;
    var max = 1;
    
    for (var i = 0; i < pix.length; i += (4)) 
        data[j++] = pix[i] / 255 * max;

    return data;
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
	
	// Usando escala para melhor visualização de todo o modelo na tela
	modelMat.scale(0.75,0.75,0.75);
	
	viewMat.lookAt(	cameraPos.elements[0],
					cameraPos.elements[1],
					cameraPos.elements[2],
					cameraLook.elements[0],
					cameraLook.elements[1],
					cameraLook.elements[2],
					cameraUp.elements[0],
					cameraUp.elements[1],
					cameraUp.elements[2]);
	
	// Translação e Rotação da Camera, responsaveis pelos movimentos da mesma
	viewMat.translate(-xPos, -yPos, -zPos);
	viewMat.rotate(pitch, 0.0, 0.0, 1.0);
	viewMat.rotate(roll,  1.0, 0.0, 0.0);
	viewMat.rotate(yaw,   0.0, 1.0, 0.0);
	
	// Calculo da razao de aspecto
	var aspecto = canvas.clientWidth / canvas.clientHeight;	
	projMat.perspective(FOVy, aspecto, near, far);

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

	if (wireframe)
		gl.drawArrays(gl.LINES, 0, textureVertexPositionBuffer.numItems);
	else
		gl.drawArrays(gl.TRIANGLES, 0, textureVertexPositionBuffer.numItems);
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

	changeCamera('1');
	
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
	
	if ( (shader.vertexPositionAttribute < 0) ||
		 (shader.textureCoordAttribute < 0) ||
		 (shader.SamplerUniform < 0) ) {
		alert("Shader attribute ou uniform não localizado!");
		return;
	}
	
	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
	gl.enableVertexAttribArray(shader.textureCoordAttribute);
	
	initTexture();

	// Posicao da Camera
	cameraPos.elements[0] 	= 0.25;
	cameraPos.elements[1] 	= 4.0;
	cameraPos.elements[2] 	= 0.0;
	// Para onde estou olhando
	cameraLook.elements[0] 	= 0;
	cameraLook.elements[1] 	= 0;
	cameraLook.elements[2] 	= 0;
	// Up vector
	cameraUp.elements[0] 	= 0.0;
	cameraUp.elements[1] 	= 1.0;
	cameraUp.elements[2] 	= 0.0;
}

// ********************************************************
// ********************************************************
function handleKeyUp(event) {
	var keyunicode = event.charCode || event.keyCode;
	if (keyunicode == 16)
		Upper = false;
}	

// ********************************************************
// Mudança do nivel de detalhe
function changeDetail(v){
	LOD = v;
	var text = document.getElementById("detail");
	text.innerHTML = "Nivel de Detalhe = " + v;
	initTexture();
}

// ********************************************************
// Mudanca de primitiva (wireframe x modelo 3D)
function changePrimitive(v){
	wireframe = !wireframe;
	initTexture();
}

// ********************************************************
// Mudanca de imagem fonte
function changeIMG(v){
	if(v == '2')
		nomeImagem = "../../images/terra.png";
	if(v == '1')	
		nomeImagem = "../../images/terrain.png";
	if(v == '3')
		nomeImagem = "../../perlin_heightmap.png";
}

// ********************************************************
// Mudanca de camera
function changeCamera(v)
{
	xPos 		= 0;
	yPos 		= 0;
	zPos 		= 0;
	cameraType 	= v;
	
	// Camera de Visualização Plana
	if(v == '1'){
		// Por padrao, setamos o wireframe como desligado
		wireframe = false;
		var checkbox = document.getElementById("wireframe");
		checkbox.checked = false;

		// Iniciamos a textura novamente para o novo desenho do modelo...
		initTexture()

		// ...ja utilizando novas coordenadas de camera, FOVy e pitch
		FOVy		= 45.0; 
		cameraPos.elements[0] 	= 0.25;
		cameraPos.elements[1] 	= 4.0;
		cameraPos.elements[2] 	= 0.0;
		pitch 		= 0;
	}
	// Camera de Visualização 3D
	if(v == '2'){	
		// Modificação de alguns atributos da camera
		pitch 		= 65;
		FOVy		= 3.0; 
		xPos 		= -0.5;
		yPos 		= 0.4;
		zPos 		= -0.5;
		yaw = 90;
		
	}
	// Camera de Visualização Aérea
	if(v == '3'){	
		// Modificação de alguns atributos da camera
		FOVy		= 80.0;
		cameraPos.elements[0] 	= 1.5;
		cameraPos.elements[1] 	= 1;
		cameraPos.elements[2] 	= 0;
		pitch 		= 0;
	}
}

function handleKeyDown(event) {
	var keyunicode = event.charCode || event.keyCode;
	
	if (keyunicode == 16) 
		Upper = true;

	switch (String.fromCharCode(keyunicode)) 
	{
		case "W"	:
						if (cameraType == 1)
						//  Se estivermos na camera Plana, W = Zoom In
							cameraPos.elements[1] -= 2;
						else
						{
							if(cameraType == 2){
								cameraPos.elements[1] -= 0.01;
							}else{
							// Movimentação em x
							   	xPos -= speed;
							   	yPos  = 0.0;
							   	zPos  = 0.0;
							}
					   }
						break;
		case "S"	:
						if (cameraType == 1 )
						//  Se estivermos na camera Plana, W = Zoom Out
							cameraPos.elements[1] += 2;
						else
						{
							if(cameraType == 2){
								cameraPos.elements[1] += 0.01;
							}else{
							// Movimentação em x
								xPos += speed;
							   	yPos  = 0.0;
							   	zPos  = 0.0;
							}
					   	}
						break;
		case "A"	:
						// Rotação no eixo Y
						yaw += 1;
						break;
		case "D"	:
						// Rotação no eixo Y
						yaw -=1;
						break;		
	}

	switch (keyunicode) 
	{
		case 37	:	// Left cursor key			
					// Roll (especifico para as cameras 3D)
					if (cameraType == 3 || cameraType == 2)
						roll -= 1;
					break;
		case 38	:	// Up cursor key
					// Pitch (especifico para as cameras 3D)
					if (cameraType == 3 || cameraType == 2)
						pitch 	-= 1;
					break;
		case 39	:	// Right cursor key
					// Roll (especifico para as cameras 3D)
					if (cameraType == 3 || cameraType == 2)
						roll += 1;
					break;
		case 40	:	// Down cursor key
					// Pitch (especifico para as cameras 3D)
					if (cameraType == 3 || cameraType == 2)
						pitch 	+= 1;
					break;
	}

	drawScene();	
}