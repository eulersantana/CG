var vertPosBuf;
var vertTextBuf;
var gl;
var shader;

var video, videoImage, videoImageContext, videoTexture;

var corSelecionada, imgSelecionada = new Image();

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
window.URL = window.URL || window.webkitURL;

// ********************************************************
// ********************************************************
function gotStream(stream)  {
	if (window.URL) {   
		video.src = window.URL.createObjectURL(stream);   } 
	else {   
		video.src = stream;   
		}

	video.onerror = function(e) {   
							stream.stop();   
							};
	stream.onended = noStream;
}

// ********************************************************
// ********************************************************
function noStream(e) {
	var msg = "No camera available.";
	
	if (e.code == 1) {   
		msg = "User denied access to use camera.";   
		}
	document.getElementById("output").textContent = msg;
}

// ********************************************************
// ********************************************************
function initGL(canvas) {
	
	var gl = canvas.getContext("webgl");
	if (!gl) {
		return (null);
		}
	
	gl.viewportWidth 	= canvas.width;
	gl.viewportHeight 	= canvas.height;
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	return gl;
}

// ********************************************************
// ********************************************************
function initBuffers(gl) {
var vPos = new Array;
var vTex = new Array;

	vPos.push(-1.0); 	// V0
	vPos.push(-1.0);
	vPos.push( 0.0);
	vPos.push( 1.0);	// V1
	vPos.push(-1.0);
	vPos.push( 0.0);
	vPos.push( 1.0);	// V2
	vPos.push( 1.0);
	vPos.push( 0.0);
	vPos.push(-1.0); 	// V0
	vPos.push(-1.0);
	vPos.push( 0.0);
	vPos.push( 1.0);	// V2
	vPos.push( 1.0);
	vPos.push( 0.0);
	vPos.push(-1.0);	// V3
	vPos.push( 1.0);
	vPos.push( 0.0);
	vertPosBuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertPosBuf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vPos), gl.STATIC_DRAW);
	vertPosBuf.itemSize = 3;
	vertPosBuf.numItems = vPos.length/vertPosBuf.itemSize;
		
	vTex.push( 0.0); 	// V0
	vTex.push( 0.0);
	vTex.push( 1.0);	// V1
	vTex.push( 0.0);
	vTex.push( 1.0);	// V2
	vTex.push( 1.0);
	vTex.push( 0.0); 	// V0
	vTex.push( 0.0);
	vTex.push( 1.0);	// V2
	vTex.push( 1.0);
	vTex.push( 0.0);	// V3
	vTex.push( 1.0);
	vertTextBuf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertTextBuf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTex), gl.STATIC_DRAW);
	vertTextBuf.itemSize = 2;
	vertTextBuf.numItems = vTex.length/vertTextBuf.itemSize;
}

// ********************************************************
// ********************************************************
function drawScene() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	if (!videoTexture.needsUpdate) 
		return;
	
   	gl.useProgram(shader);
	
	gl.uniform1i(shader.SamplerUniform, 0);
	gl.uniform3fv(shader.cor,corSelecionada);
	   	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, videoTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoImage);
	videoTexture.needsUpdate = false;	
		
	gl.enableVertexAttribArray(shader.vertexPositionAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertPosBuf);
	gl.vertexAttribPointer(shader.vertexPositionAttribute, vertPosBuf.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.enableVertexAttribArray(shader.vertexTextAttribute);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertTextBuf);
	gl.vertexAttribPointer(shader.vertexTextAttribute, vertTextBuf.itemSize, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLES, 0, vertPosBuf.numItems);

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.drawArrays(gl.TRIANGLES, 0, vertPosBuf.numItems);
	
}

// ********************************************************
// ********************************************************
function initTexture(gl, shader) {
	videoTexture = gl.createTexture();		
	gl.bindTexture(gl.TEXTURE_2D, videoTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	videoTexture.needsUpdate = false;
}

// ********************************************************
// ********************************************************
function webGLStart() {

	if (!navigator.getUserMedia) {
		document.getElementById("output").innerHTML = 
			"Sorry. <code>navigator.getUserMedia()</code> is not available.";
	}

	navigator.getUserMedia({video: true}, gotStream, noStream);

	initInputs();

	// assign variables to HTML elements
	video = document.getElementById("monitor");
	videoImage = document.getElementById("videoImage");
	videoImageContext = videoImage.getContext("2d");
	
	// background color if no video present
	videoImageContext.fillStyle = "#005337";
	videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height*(4/3) );
	
	
	canvas = document.getElementById("videoGL");
	gl = initGL(canvas);
	
	if (!gl) { 
		alert("Could not initialise WebGL, sorry :-(");
		return;
		}
		
	shader = initShaders("shader", gl);
	if (shader == null) {
		alert("Erro na inicilizacao do shader!!");
		return;
		}

	shader.vertexPositionAttribute 	= gl.getAttribLocation(shader, "aVertexPosition");
	shader.vertexTextAttribute 		= gl.getAttribLocation(shader, "aVertexTexture");
	shader.SamplerUniform	 		= gl.getUniformLocation(shader, "uSampler");
	shader.cor 						= gl.getUniformLocation(shader, "uCor"	);

	if ( 	(shader.vertexPositionAttribute < 0) ||
			(shader.vertexTextAttribute < 0) ||
			(shader.SamplerUniform < 0) ) {
		alert("Shader attribute ou uniform nao localizado!");
		return;
		}
		
	initBuffers(gl);
	initTexture(gl, shader);
	animate(gl, shader);
}

function animate(gl, shader) {
    requestAnimationFrame( animate );
	render();		
}

function render() {	
	if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
		videoImageContext.drawImage( video, 0, 0, videoImage.width, videoImage.height*(4/3) );
		videoTexture.needsUpdate = true;
	}
	drawScene();
}

/* Função que pega o input, seta o valor para o badge 
   e passa para o evento onchange a função para setar 
   qual o filtro utilizado e o valor escolhido 
*/
function initInputs(){
	
	//pegando o elemento com id 'brilho'
	var cor = document.getElementById("cor");
	//passando a cor de Hexadecimal para RGB.
	corSelecionada = hexa2Rgb(cor.value);
	//pegando o seu badge
	var ba = $("#h_selecionada > .badge");
	//setando o valor default do input para o badge em letras MAIÚSCULAS
	ba.html(cor.value.toUpperCase());

	//pegando o elemento com id 'preview' um elemento do tipo IMG
	var preview = document.getElementById('preview');
	//passando o endereço da imagem
	preview.src = "img/space.jpg";

	//pegando o elemento com id 'palco' utilizando o JQuery
	var palco = $('#palco');
	//Atribuindo um valor ao atributo 'style' passando a url imagem padrão e seu tamanho
	palco.attr("style","background-image: url("+preview.src+"); background-size: 100%;");
	
	//passando um função para evento onchange executar ao modificar o valor do input
	cor.onchange = function(){
		//atualizando o valor do badge com o valor do input
		ba.html(this.value.toUpperCase());
		//passando a cor de Hexadecimal para RGB
		corSelecionada = hexa2Rgb(this.value);
		// Mudando o intervalo de cor de [0:255] para [0:1]
		corSelecionada[0] /= 255;
		corSelecionada[1] /= 255;
		corSelecionada[2] /= 255;
		render();
	}
}

//Recebe o valor da cor em Hexadecimal e retorna um array com as cores em RGB
function hexa2Rgb(cor){
	//pegando apartir do segundo elemento pois o primeiro é "#" e dividindo dois a dois
	var rgb = cor.substring(1).match(/.{1,2}/g);
	var cores = new Array();
	for (var i = 0; i < rgb.length; i++) {
		cores[i] = parseInt(rgb[i],16);//passando de hexadecimal para decimal
	};
	return cores;
}

//Pega a iamgem selecionada mostra a pré-visualização e colocar no plano de fundo do div do video
function fileSelected(){

	var iMaxFilesize = 1048576; // 1MB

    var oFile = document.getElementById('image_file').files[0];

    var rFilter = /^(image\/bmp|image\/gif|image\/jpeg|image\/png|image\/tiff)$/i;
    if (! rFilter.test(oFile.type)) {
        document.getElementById('error').style.display = 'block';
        return;
    }

    // little test for filesize
    if (oFile.size > iMaxFilesize) {
        document.getElementById('warnsize').style.display = 'block';
        return;
    }

    var preview = document.getElementById('preview');

    // prepare HTML5 FileReader
    var oReader = new FileReader();
        oReader.onload = function(e){
       	preview.src = e.target.result;
       	preview.width = 100;
       	preview.height = 100;
       	var palco = $('#palco');
	    palco.attr("style","background-image: url("+e.target.result+"); background-size: "+palco.width()+"px "+palco.height()+"px;");
	};

    // read selected file as DataURL
    oReader.readAsDataURL(oFile);
}
