function glHough() {

    this.accumulatorDims = [400,400]

    this.texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 1),
        vec2(1, 0),
        vec2(0, 0)
    ];

    this.vertices = [
        vec2( -1, -1 ),
        vec2(  -1,  1 ),
        vec2(  1, 1 ),
        vec2( 1, 1 ),
        vec2(  1,  -1 ),
        vec2(  -1, -1 )
    ];

    this.rgbEncodeOutput = true
    this.thresholdOutput = 0.0//365// everything above the threshold is kept. make it <= 0 to turn off

    this.init = function() {
        //setup webgl
        this.canvas = document.getElementById( "gl-canvas" )
        gl = WebGLUtils.setupWebGL( this.canvas )
        if ( !gl ) { throw( "WebGL isn't available" ) }
        // setup view
        this.changeViewPort(this.canvas.width, this.canvas.height)
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        //
        // setup the sobel program
        //
        this.sobelProgram = initShadersFromStrings( gl, sobelShaders.vertex, sobelShaders.fragment )
        gl.useProgram(this.sobelProgram)
        // vertices
        this.setupVertexAttribute( this.vertices, 'vPosition', 2)
        // texture cooridinates
        this.setupVertexAttribute( this.texCoord, 'vTexCoord', 2)
        // Create an empty textures
        this.texture0 = gl.createTexture()
        gl.activeTexture( gl.TEXTURE0 )
        gl.uniform1i( gl.getUniformLocation(this.sobelProgram, "texture"), 0)
        this.configTexture(this.texture0)
        //
        //
        // setup the hough program
        //
        this.houghProgram = initShadersFromStrings( gl, houghShaders.vertex, houghShaders.fragment )
        gl.useProgram(this.houghProgram)
        // vertices
        this.setupVertexAttribute( this.vertices, 'vPosition', 2)
        // texture cooridinates
        this.setupVertexAttribute( this.texCoord, 'vTexCoord', 2)
        // Create an empty textures
        this.texture1 = gl.createTexture()
        gl.activeTexture( gl.TEXTURE1 )
        gl.uniform1i( gl.getUniformLocation(this.houghProgram, "texture"), 0)
        this.configTexture(this.texture1)
        //
        //
        // create Frame Buffer
        //     Allocate a frame buffer object
        this.framebuffer = gl.createFramebuffer()
        var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
        if(status != gl.FRAMEBUFFER_COMPLETE) alert('Frame Buffer Not Complete')
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
        //
        //gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }

    //set it up once is probably fine for this.
    //  I think this could be a very reusable function in the future
    this.setupVertexAttribute =  function( data, name, size) {
        var bufferV = gl.createBuffer()
        gl.bindBuffer( gl.ARRAY_BUFFER, bufferV)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW)
        var vPosition = gl.getAttribLocation( this.sobelProgram, name )
        gl.vertexAttribPointer( vPosition, size, gl.FLOAT, false, 0, 0 )
        gl.enableVertexAttribArray( vPosition )
        return bufferV
    }

    this.changeImage = function(image) {
        // this is is just temporary untill I can figure out why smaller accumulators are not working
        this.accumulatorDims = [image.width, image.height]
        //
        this.changeViewPort(image.width, image.height)
        this.image = image
        // send to sobel program
        gl.useProgram(this.sobelProgram)
        gl.activeTexture( gl.TEXTURE1 )
        this.configTexture( this.texture1, image)
        gl.activeTexture( gl.TEXTURE0 )
        this.configTexture( this.texture0, image)
        // send to hough program
    }

    this.changeViewPort = function(wid, hei){
        if( wid !== this.width || hei !== this.height) {
            this.width = wid
            this.height = hei
            this.canvas.width = wid
            this.canvas.height = hei
            gl.viewport(0, 0, wid, hei)
            console.log("viewport dimensions changed to ", wid, hei)
        }
    }

    this.render = function( renderToTexture) {
        //draw sobel to texture1 in frame buffer, and texture0 as input
        gl.useProgram(this.sobelProgram) 
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
        gl.bindTexture(gl.TEXTURE_2D, this.texture0)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture1, 0)
        var td = gl.getUniformLocation(this.sobelProgram, 'texDimensions')
        gl.uniform2fv(td, [this.image.width, this.image.height])
        gl.drawArrays( gl.TRIANGLES, 0, 6 )
        // draw hough with texture1 as input
        gl.useProgram(this.houghProgram) 
        if( renderToTexture ) { 
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture0, 0)
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        }
        gl.bindTexture(gl.TEXTURE_2D, this.texture1)
        var td = gl.getUniformLocation(this.houghProgram, 'texDimensions')
        gl.uniform2fv(td, [this.image.width, this.image.height])
        gl.uniform2fv(gl.getUniformLocation(this.houghProgram, 'accumulatorDims'), this.accumulatorDims)
        gl.uniform1f(gl.getUniformLocation(this.houghProgram, 'rgbEncode'), 1*this.rgbEncodeOutput);
        gl.uniform1f(gl.getUniformLocation(this.houghProgram, 'threshold'), 1*this.thresholdOutput);
        gl.drawArrays( gl.TRIANGLES, 0, 6 )
    }

    this.configTexture = function( tex, image) {
        var td = gl.getUniformLocation(this.sobelProgram, 'texDimensions')
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
       // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        if(image) {
            gl.uniform2fv(td, [image.width, image.height])
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
        }
    }

    this.readPixels = function() {
        this.render(true)
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
        var pixels = new Uint8Array(this.accumulatorDims[0]*this.accumulatorDims[1] * 4)
        var x = (this.canvas.width - this.accumulatorDims[0])/2
        var y = (this.canvas.height - this.accumulatorDims[1])/2
        gl.readPixels(x,y, this.accumulatorDims[0], this.accumulatorDims[1], gl.RGBA, gl.UNSIGNED_BYTE, pixels)
        return {width:this.accumulatorDims[0], height:this.accumulatorDims[1], data:pixels}
        //pixels = new Float32Array(pixels.buffer);
    }

    this.init()
}


houghShaders = {

    vertex:`
        precision highp float;
        attribute vec4 vPosition;
        attribute vec2 vTexCoord;
        uniform vec2 texDimensions;
        uniform vec2 accumulatorDims;
        varying vec2 texDims;
        varying vec2 fTexCoord;

        void main() {
            fTexCoord = vTexCoord;
            texDims = texDimensions;
            vec2 ratio = accumulatorDims/texDims;
            gl_Position = vec4(ratio*vPosition.xy, 0.0, 1.0);
        }
    `,

    fragment:`
        precision highp float;
        uniform sampler2D texture;
        uniform float rgbEncode;
        uniform float threshold;
        uniform vec2 accumulatorDims;
        varying vec2 fTexCoord;
        varying vec2 texDims;

        // vec4 number2Color( float n2) {
        //     float n = floor(n2);
        //     float bs = 255.0;
        //     float r = floor(mod(n,bs*bs*bs)/(bs*bs));
        //     float g = floor(mod(n,bs*bs)/(bs));
        //     float b = floor(mod(n,bs));
        //     float current = floor((r+g+b)/(3.0))
        //     vec3 result = vec3(1,1,1);

        //     if (current < 128) {
        //         result = vec3(0,0,0);
        //     }

        //     return vec4(result, 1.0);
        // }

        vec4 intensity(in vec4 color){
            vec4 progOut;
            float intese = 0.2125*color.x + 0.7154*color.y + 0.0721*color.z;
            if (intese > 0.75) {
                progOut = vec4(1.0, 1.0, 1.0, 1.0);
            } else {
                progOut = vec4(0.0, 0.0, 0.0, 0.0);
            }
            return(progOut);
        }

        void main() {
            vec2 temp = accumulatorDims;//not in use yet. But need to
            //
            vec4 tcolor = intensity(texture2D( texture, fTexCoord.xy));

            vec2 p0 = fTexCoord.xy;
            float theta = 1.0*p0.y * 3.141592653589;
            float r = (2.0*p0.x-1.0)*1.0;
            vec2 p1 = vec2(cos(theta)*r, sin(theta)*r);
            vec2 lineSlope = vec2(-sin(theta), cos(theta));//perpindicular to vector to p1
            vec2 lineSlopeNorm = normalize(lineSlope/texDims); // it turns out texture dimensions do matter
            float parallelSum = 0.0;
            for (float i = -1.4 ; i <= 1.4 ; i+=0.001) {
                vec2 p3 = p1 + lineSlopeNorm * i;
                if( p3.x <= 1.0 && p3.y <= 1.0 && p3.x >= 0.0 && p3.y >= 0.0){
                    vec2 sobelGradient = 2.0*texture2D( texture, p3).xy - 1.0;
                    parallelSum += abs( dot(sobelGradient, normalize(p1)));
                }
            }
            // color the final image
            gl_FragColor = vec4(parallelSum*16.0, parallelSum*8.0,parallelSum,1.0)/8192.0;//tcolor;
            // if(rgbEncode > 0.0) {
            //     gl_FragColor = number2Color(parallelSum);// multiply it so its actually visible
            // }
            if(threshold > 0.0) {
                if( parallelSum < threshold) {
                    gl_FragColor = vec4(0.0,0.0,0.0,1.0);
                }
            }
        }
    `,
}