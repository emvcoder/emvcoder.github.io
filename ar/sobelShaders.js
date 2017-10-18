
var sobelShaders = {

    vertex : `
        precision mediump float;
        attribute vec4 vPosition;
        attribute vec2 vTexCoord;
        uniform vec2 texDimensions;
        varying vec2 texDims;
        varying vec2 fTexCoord;

        void main() {
            fTexCoord = vTexCoord;
            texDims = texDimensions;
            gl_Position = vPosition;
        }
    `,

    fragment : `
        precision mediump float;
        uniform sampler2D texture;
        varying vec2 fTexCoord;
        varying vec2 texDims;

        float lum(vec4 c) {
            float light = (c.r+c.g+c.b)/3.0;
            float l = 0.0;

            if (light > 0.65) {
                l = 0.0;
            } else {
                l = 1.0;
            }

            return dot(vec3(l,l,l), vec3(0.3, 0.59, 0.11));
        }


        void main() {
            vec2 p = fTexCoord.xy ;
            vec2 dp = vec2(1.0, 1.0) / texDims;
            vec4 tcolor = texture2D( texture, fTexCoord.xy);
            // find gradient in image
            float t00 = lum(texture2D(texture, p + dp * vec2(-1.0, -1.0)));
            float t10 = lum(texture2D(texture, p + dp * vec2( 0.0, -1.0)));
            float t20 = lum(texture2D(texture, p + dp * vec2( 1.0, -1.0)));
            float t01 = lum(texture2D(texture, p + dp * vec2(-1.0,  0.0)));
            float t21 = lum(texture2D(texture, p + dp * vec2( 1.0,  0.0)));
            float t02 = lum(texture2D(texture, p + dp * vec2(-1.0,  1.0)));
            float t12 = lum(texture2D(texture, p + dp * vec2( 0.0,  1.0)));
            float t22 = lum(texture2D(texture, p + dp * vec2( 1.0,  1.0)));
            vec2 grad;
            grad.x = t00 + 2.0 * t01 + t02 - t20 - 2.0 * t21 - t22;
            grad.y = t00 + 2.0 * t10 + t20 - t02 - 2.0 * t12 - t22;
            vec2 gradColor = (1.0+grad)/2.0;
            float gradMag = 0.0;//sqrt(dot(grad,grad));
            gl_FragColor = vec4(gradColor,gradMag,1.0);//tcolor + vec4(grad/3.0, 0.0, 0.0);
        }
    `,

}