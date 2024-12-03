/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');


		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();
		//added for task 4 
		this.secondTexture = null; //reference of second texture
		this.useSecondTextureLoc = gl.getUniformLocation(this.prog, 'useSecondTexture');
		this.blendFactorLoc = gl.getUniformLocation(this.prog, 'blendFactor'); // for blender slider
		this.blendFactor = 0.5; // initial blender factor is assigned

		this.numTriangles = 0;

		/**
		 * @Task2 : You should initialize the required variables for lighting here
		 */
		//vertex shader
        this.normalLoc = gl.getAttribLocation(this.prog, 'normal');

        //fragment shader
        this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
        this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
        this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
        
		// added for task3
		this.specularIntensityLoc = gl.getUniformLocation(this.prog, 'specularIntensity'); // Task 3 için eklendi
    	this.viewPosLoc = gl.getUniformLocation(this.prog, 'viewPos'); 


        this.normalBuffer = gl.createBuffer();

        // initialize lighting variables
        this.isLightingEnabled = false; // light is closed initially
        this.lightPos = [lightX, lightY, 10];  // initial light direction
        this.ambient = 0.5;                   
		this.specularIntensity = 0.5; 
		
	}

	setMesh(vertPos, texCoords, normalCoords) {

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;

		/**
		 * @Task2 : You should update the rest of this function to handle the lighting
		 */
		// Bind and set normal data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
    
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvpLoc, false, trans);

		//position of the camera
		const cameraX = 0.0;  
		const cameraY = 0.0;
		const cameraZ = 5.0;  
		gl.uniform3fv(this.viewPosLoc, [cameraX, cameraY, cameraZ]);

		//specular light density added for task3 için eklendi
		gl.uniform1f(this.specularIntensityLoc, this.specularIntensity);

		gl.uniform1f(this.blendFactorLoc, this.blendFactor); // added for task4 to send blendFactor to shader

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

		/**
		 * @Task2 : You should update this function to handle the lighting
		 */

		///////////////////////////////

		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.enableVertexAttribArray(this.normalLoc);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

        updateLightPos();
        
        this.lightPos[0] = lightX;
        this.lightPos[1] = lightY;
		
        gl.uniform1i(this.enableLightingLoc, this.isLightingEnabled ? 1 : 0);
        gl.uniform3fv(this.lightPosLoc, this.lightPos);
        gl.uniform1f(this.ambientLoc, this.ambient);

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);

	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img);

		// Set texture parameters 
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			console.error("Task 1: Non power of 2, you should implement this part to accept non power of 2 sized textures");
			/**
			 * @Task1 : You should implement this part to accept non power of 2 sized textures
			 */
			// For non-power-of-two textures:
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			//use linear for magnificatiın
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		}

		gl.useProgram(this.prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const sampler = gl.getUniformLocation(this.prog, 'tex');
		gl.uniform1i(sampler, 0);
	}
    //added for task4
	setSecondTexture(img) {
		const secondTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, secondTexture);
		gl.bindTexture(gl.TEXTURE_2D, secondTexture);
	
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img);
	
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		}
	
		this.secondTexture = secondTexture;
	}

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);

		//for task 4 check if the second texture active or not
		if (this.secondTexture) {
			gl.uniform1i(this.useSecondTextureLoc, 1);
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.secondTexture);
		} else {
			gl.uniform1i(this.useSecondTextureLoc, 0);
		}
	}

	enableLighting(show) {
		console.error("Task 2: You should implement the lighting and implement this function ");
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */
		this.isLightingEnabled = show; 
		gl.useProgram(this.prog); 
		console.log(`enableLighting çağrıldı: show =`, show); 
    	console.log(`enableLighting durumu:`, this.isLightingEnabled);
		gl.uniform1i(this.enableLightingLoc, show ? 1 : 0);
	}
	
	setAmbientLight(ambient) {
		console.error("Task 2: You should implement the lighting and implement this function ");
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */
		this.ambient = ambient; 
		gl.useProgram(this.prog); 
		console.log(`setAmbientLight çağrıldı: ambient =`, this.ambient); 
		gl.uniform1f(this.ambientLoc, ambient); 
		console.log(`Ambient değeri shader'a gönderildi: ${this.ambient}`);
	}

	setSpecularLight(specularIntensity) {
		this.specularIntensity = specularIntensity; 
		gl.useProgram(this.prog); 
		gl.uniform1f(this.specularIntensityLoc, specularIntensity); 
		console.log(`Specular Intensity Set To: ${specularIntensity}`); 
	}

}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

//for task 4 
function SetBlendFactor(slider) {
    const blendFactor = parseFloat(slider.value);
	console.log("Blend Factor:", blendFactor);  //added for debuggint the blend factor
    meshDrawer.blendFactor = blendFactor;
    gl.useProgram(meshDrawer.prog);
    gl.uniform1f(meshDrawer.blendFactorLoc, blendFactor);
    DrawScene();
}


// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal;
			varying vec3 v_pos; // v_pos varying tanımı 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;

				// v_pos'u vertex pozisyonu olarak ata
    			v_pos = (mvp * vec4(pos, 1.0)).xyz;

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
			precision mediump float;

uniform bool showTex;
uniform bool enableLighting;
uniform sampler2D tex;
uniform sampler2D tex2; //for task4
uniform bool useSecondTexture;
uniform vec3 lightPos;
uniform float ambient;
uniform float specularIntensity;  //for task3
uniform vec3 viewPos;             
uniform float blendFactor; //for task4

varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_pos; //for task3 fragment position

void main()
{
    vec4 texColor = texture2D(tex, v_texCoord); //main texture
    if (useSecondTexture) {
        vec4 texColor2 = texture2D(tex2, v_texCoord); //second texture
        texColor = mix(texColor, texColor2, blendFactor); //blend two textures
    }

    if (showTex && enableLighting) {
        // Normalizations
        vec3 N = normalize(v_normal);
        vec3 L = normalize(lightPos - v_pos);

        //diffuse lighting
        float diff = max(dot(N, L), 0.0);

        //specular ligthing
        vec3 V = normalize(viewPos - v_pos); 
        vec3 R = reflect(-L, N);            
        float spec = pow(max(dot(V, R), 0.0), 32.0) * specularIntensity;

        // sum of ambient, diffuse, and specular lighting
        float lighting = ambient + (1.0 - ambient) * diff + spec;

        lighting = clamp(lighting, 0.0, 1.0);

        //add ligthing to texture color
        vec3 result = lighting * texColor.rgb;

        //set the final color
        gl_FragColor = vec4(result, texColor.a);
    }
    else if (showTex) {
        gl_FragColor = texColor;
    }
    else {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Default red color
    }
}`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;

	// Konsol çıktısı ile kontrol
    console.log(`lightX: ${lightX}, lightY: ${lightY}`);
}
///////////////////////////////////////////////////////////////////////////////////