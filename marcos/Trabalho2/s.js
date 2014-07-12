
		  //this ifdef is a temporary work-around for the (upcoming) strict shader validator
		  #ifdef GL_ES
		  precision highp float;
		  #endif

		  varying vec2 vTextureCoord;

		  uniform sampler2D uDemTexture;
		  uniform sampler2D uColorDemTexture;
		  uniform float uAzimuthDeg;
		  uniform float uZenithDeg;
		  uniform int uMode;
		  uniform int uBitMode; //unpack two 8-bitchannels to a 16-bit Integer 

		  void main(void)
		  {
			float PI = 2.0 * asin(1.0);
			float width = 1024.0;
			float height = 1024.0;
			float maxHeight = 43798.0;
			float minHeight = 0.0;
			
			float cellsize = 160.0;
			float zFactor = 1.0;
			
			float diffHeight = maxHeight - minHeight;
			
			float azimuth = uAzimuthDeg; //degrees
			float zenithRad = (90.0 - uZenithDeg) * PI / 180.0; 
			//float azimuthRad = uAzimuthDeg;
			float azimuthRad = radians(360.0 - azimuth + 90.0);
			float slopeRad;
			float aspectRad;
			float hillshade;
			
			//sample cells
			float a,b,c,d,f,g,h,i;
			
			//check if border pixel
			if((vTextureCoord.s >= 1.0/width && vTextureCoord.s < (width-1.0)/width) && vTextureCoord.t >= 1.0/height && vTextureCoord.t < (height-1.0)/height){
				
					//RateOfChangeXY 
					vec4 aTex = texture2D(uDemTexture, vec2(vTextureCoord.s - (1.0/width), vTextureCoord.t - (1.0/height)));
					vec4 bTex = texture2D(uDemTexture, vec2(vTextureCoord.s, vTextureCoord.t - (1.0/height)));
					vec4 cTex = texture2D(uDemTexture, vec2(vTextureCoord.s + (1.0/width), vTextureCoord.t - (1.0/height)));
					vec4 dTex = texture2D(uDemTexture, vec2(vTextureCoord.s - (1.0/width), vTextureCoord.t));
					vec4 eTex = texture2D(uDemTexture, vec2(vTextureCoord.s, vTextureCoord.t)); //actual Pixel
					vec4 fTex = texture2D(uDemTexture, vec2(vTextureCoord.s + (1.0/width), vTextureCoord.t));
					vec4 gTex = texture2D(uDemTexture, vec2(vTextureCoord.s - (1.0/width), vTextureCoord.t + (1.0/height)));
					vec4 hTex = texture2D(uDemTexture, vec2(vTextureCoord.s, vTextureCoord.t + (1.0/height)));
					vec4 iTex = texture2D(uDemTexture, vec2(vTextureCoord.s + (1.0/width), vTextureCoord.t + (1.0/height)));
					
					if (uBitMode == 8){
					//multiply Min-Max streched 8 bit values with real height values
					 a = aTex.r * diffHeight + minHeight;
					 b = bTex.r * diffHeight + minHeight;
					 c = cTex.r * diffHeight + minHeight;
					 d = dTex.r * diffHeight + minHeight;
					 // e = dTex.r; //not used in hillshade but for height color
					 f = fTex.r * diffHeight + minHeight;
					 g = gTex.r * diffHeight + minHeight;
					 h = hTex.r * diffHeight + minHeight;
					 i = iTex.r * diffHeight + minHeight;
					}
					
					if (uBitMode == 16){
					//multiply Min-Max streched 8 bit values with real height values
					 a = aTex.r*255.0 + (aTex.g*65280.0) + minHeight;
					 b = bTex.r*255.0 + (bTex.g*65280.0) + minHeight;
					 c = cTex.r*255.0 + (cTex.g*65280.0) + minHeight;
					 d = dTex.r*255.0 + (dTex.g*65280.0) + minHeight;
					// e = dTex.r; //not used in hillshade but for height color
					 f = fTex.r*255.0 + (fTex.g*65280.0) + minHeight;
					 g = gTex.r*255.0 + (gTex.g*65280.0) + minHeight;
					 h = hTex.r*255.0 + (hTex.g*65280.0) + minHeight;
					 i = iTex.r*255.0 + (iTex.g*65280.0) + minHeight;
					}
					
					
					float rateOfChangeX = ((c + (2.0*f) + i) - (a + (2.0*d) + g)) / (8.0 * cellsize);
					float rateOfChangeY = ((g + (2.0*h) + i) - (a + (2.0*b) + c)) / (8.0 * cellsize);
					
					//Slope
					if (uMode == 4 || uMode == 3 || uMode == 1){
						slopeRad = atan(zFactor * sqrt(pow(rateOfChangeX,2.0) + pow(rateOfChangeY,2.0)));	
					}
					
					
					//Aspect
					if(uMode == 4 || uMode == 3 || uMode == 2){
						aspectRad = 9.0; //rad will never be 9.0 so this means flat
					 if (rateOfChangeX != 0.0){
						aspectRad = atan(rateOfChangeY, -(rateOfChangeX));
						if (aspectRad < 0.0){
							aspectRad = (2.0 * PI) + aspectRad;
						}
					 }
					 else if (rateOfChangeY > 0.0){
							aspectRad = PI / 2.0;
							}
							else if (rateOfChangeY < 0.0){
								aspectRad =  (2.0 * PI) - (PI / 2.0);
							}
							else {
								aspectRad = aspectRad; //???
							}
					}
					
					
					//Hillshade
					if(uMode == 4 || uMode == 3){
						hillshade = (cos(zenithRad) * cos(slopeRad)) + (sin(zenithRad) * sin(slopeRad) * cos(azimuthRad - aspectRad));
					}
					
					//Output according to Mode
					
					//HILLSHADE with COLORDEM
					if(uMode == 4){
						vec4 demColor = texture2D(uColorDemTexture, vec2(vTextureCoord.s, vTextureCoord.t));
						float hillshade2 = hillshade/2.0;
						gl_FragColor = vec4(hillshade2 + demColor.r / 2.0, hillshade2 + demColor.g/2.0, hillshade2 + demColor.b/2.0, 1.0); //hillshade pixel
					}
					
					//HILLSHADE
					if(uMode == 3){
						gl_FragColor = vec4(hillshade, hillshade, hillshade, 1.0); //hillshade pixel
						}
					
					//ASPECT
					if(uMode == 2){
						//aspect classification
						vec3 aspectColor;
						float aspectRadN = mod(2.0*PI - aspectRad + (PI/2.0), 2.0*PI); 
						float PI16 = PI/16.0; 
						//N
						if(aspectRadN >= 2.0*PI - PI16 || aspectRadN < PI16){aspectColor = vec3(1.0,0.0,0.0);}
						//NE
						if(aspectRadN >= PI16 && aspectRadN < PI/4.0 + PI16){aspectColor = vec3(1.0,0.7,0.0);}
						//E
						if(aspectRadN >= PI/4.0 + PI16 && aspectRadN < PI/2.0 + PI16){aspectColor = vec3(1.0,1.0,0.0);}
						//SE
						if(aspectRadN >= PI/2.0 + PI16 && aspectRadN < PI*3.0/4.0 + PI16){aspectColor = vec3(0.0,1.0,0.0);}
						//S
						if(aspectRadN >= PI*3.0/4.0 + PI16 && aspectRadN < PI + PI16){aspectColor = vec3(0.0,1.0,1.0);}
						//SW
						if(aspectRadN >= PI + PI16 && aspectRadN < PI*5.0/4.0 + PI16){aspectColor = vec3(0.0,0.5,1.0);}
						//W
						if(aspectRadN >= PI*5.0/4.0 + PI16 && aspectRadN < PI*3.0/2.0 + PI16){aspectColor = vec3(0.4,0.0,1.0);}
						//NW
						if(aspectRadN >= PI*3.0/2.0 + PI16 && aspectRadN < 2.0*PI - PI16){aspectColor = vec3(1.0,0.0,1.0);}
						//Flat
						if(aspectRad > PI*2.0){aspectColor = vec3(0.7,0.7,0.7);} 
						
						gl_FragColor = vec4(aspectColor, 1.0); //aspect pixel
					}
					
					//SLOPE
					float slope;
					if(uMode == 1){
						//color ramp for slope from red to yellow, green
						slope = slopeRad/(2.0 * PI);
						gl_FragColor = vec4(slope*4.25*1.5, (1.5*1.0)-(4.25*slope), 0.0, 1.0); //slope pixel
					}					
					
					//DEM
					if(uMode == 0){
						gl_FragColor = texture2D(uDemTexture, vec2(vTextureCoord.s, vTextureCoord.t));
					}
					
					
					
					//gl_FragColor = vec4(demColor); //hillshade pixel
					
					
					
					
					
					
			}
			
			else {
				gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); //black border pixel
			}
		  }
		