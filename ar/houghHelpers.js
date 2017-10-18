
var houghHelpers = {

  // expand blobs just a little bit because there are small holes in them
  spread : function(w,h,data) {
    var dirs = [[0,0],[1,0],[-1,0],[0,1],[0,-1]]
    var d2 = new Int32Array(w*h)
    for(var i=0;i<d2.length;i++){
      d2[i] = -1
    }
    for(var y=0; y<h;y++){
      for(var x=0; x<w; x++) {
        var index = w*y + x
        if( data[index] > 0){
          for(var d of dirs) {
            var indx2 = (y + d[1])*w + x + d[0]
            d2[indx2] = 1
          }
        }
      }
    }
    return d2
  },

  findBlobs : function( acc, threshold) {
    acc.rgbEncodeOutput = false
    acc.thresholdOutput = threshold
    var pix = acc.readPixels()
    var imgdat = new ImageData(pix.width, pix.height)
    imgdat.data.set(pix.data)
    var points = houghHelpers._lookForBlobs(imgdat)
    return {imagedata:imgdat, points:points}
  },

  _lookForBlobs : function(imgdata) {
    //mask for blob detector
    var masked = new Int32Array(imgdata.data.length/4)

    for( var i=0; i<imgdata.data.length; i+=4) {
      var r = imgdata.data[i]
      if( r > 0) {
        masked[Math.floor(i/4)] = 1
      } else {
        masked[Math.floor(i/4)] = -1
      }
    }
    masked = houghHelpers.spread(imgdata.width, imgdata.height, masked)
    //
    //console.log(masked)
    var blobDetector = new connectedComponentLabeler( imgdata.width, imgdata.height, masked)
    var blobs = blobDetector.connectAll()
    var points = []
    for(b of blobs){
      points.push(b.centroid())
    }
    //console.log(blobs)
    return points
  },

  drawPoints : function(points, context) {
    context.beginPath()
    var radius = 5
    for(p of points) {
      context.moveTo(p[0],p[1])
      context.arc(p[0], p[1], radius, 0, 2 * Math.PI, false);
    }
    context.lineWidth = 1;
    context.strokeStyle = '#ff0000';
    context.stroke();
  },

  drawLines : function( acc, points, canvas) {
    var can = canvas
    var cw = can.width = acc.image.width
    var ch = can.height = acc.image.height
    var w = acc.accumulatorDims[0]
    var h = acc.accumulatorDims[1]
    var ctx = can.getContext('2d')
    if( acc.image.data){ //imagedata
      ctx.putImageData(acc.image,0,0)
    } else{//image element
      ctx.drawImage(acc.image,0,0)
    }
    ctx.beginPath()
    ctx.strokeStyle = '#ff0000';
    ctx.fillStyle = '#00ff00'
    ctx.lineWidth = 1
    /* // from the shader
     float theta = 1.0*p0.y * 3.141593;
            float r = (2.0*p0.x-1.0)*2.0;
            vec2 p1 = vec2(cos(theta)*r, sin(theta)*r);
            vec2 p1Norm = normalize(p1);
            vec2 lineSlope = vec2(-p1.y, p1.x);//perpindicular to vector to p1
            vec2 lineSlopeNorm = normalize(lineSlope);
            float parallelSum = 0.0;
            for (float i = -1.4 ; i <= 1.4 ; i+=0.001) {
                vec2 p3 = p1 + lineSlopeNorm * i;
                if( p3.x <= 1.0 && p3.y <= 1.0 && p3.x >= 0.0 && p3.y >= 0.0){
                    vec2 t3 = 2.0*texture2D( texture, p3).xy - 1.0;
                    parallelSum += abs( dot(t3, p1Norm));
                }
    */
    let linesArray = [];
    for(var p of points) {
      var pUnit = [p[0]/w, p[1]/(h)]
      var theta = 1*(pUnit[1] * Math.PI);
      var r = (2.0*pUnit[0]-1.0)*1.0;
      var p1 = [Math.cos(theta)*r, Math.sin(theta)*r]
      var p2 = [p1[0]*cw, p1[1]*ch]
      var lineSlope = [-Math.sin(theta), Math.cos(theta)]//perpindicular to vector to p1
      // normalize(lineSlope);
      var pL = add(p2, scale(-1000,lineSlope))
      var pR = add(p2, scale(1000,lineSlope))
      //

      linesArray.push({ x1: p2[0], y1: ch-p2[1], x2: pL[0], y2: ch-pL[1]});

      // let deltay = y2-y1;
      // let deltax = x2-x1;
      //
      // let cos = Math.cos(Math.atan2(deltax, deltay));
      //
      // console.log(y1, y2);
      //
      // console.log(pixels);
      //
      // for (i = y1; i < y2; i++) {
      //   console.log(i);
      //   if (i < 0) continue;
      //   let x = x1+Math.round(i/cos);
      //   var k = ((i*200)+x)*4;
      //   var R = pixels[k];
      //   var G = pixels[k+1];
      //   var B = pixels[k+2];
      //   console.log(R,G,B);
      //   pixels[i] = 125;
      //   if (R === 255 && G === 0 && B === 0) {
      //     console.log("YEEE")
      //   }
      // }
      //
      // ctx.putImageData(image, 0, 0);
      //
      ctx.beginPath()
      ctx.strokeStyle = '#ff0000';
      
      ctx.moveTo(p2[0], ch-p2[1])
      ctx.lineTo(pR[0], ch-pR[1])
      ctx.moveTo(p2[0], ch-p2[1])
      ctx.lineTo(pL[0], ch-pL[1])
      ctx.closePath()
      ctx.stroke()

      // ctx.beginPath()
      // ctx.strokeStyle = '#00ff00';
      //
      // ctx.moveTo(p2[0], 50+ch-p2[1]);
      // ctx.lineTo(pL[0], 50+ch-pL[1]);
      //
      // ctx.closePath();
      // ctx.stroke()

      // ctx.fillRect(p2[0], ch-p2[1], 12,12)
    }
    // ctx.stroke()

    for (let i = 0; i < linesArray.length; i++) {
      let line = linesArray[i];
      for (let k = 0; k < linesArray.length; k++) {
        if (k === i) continue;
        let line2 = linesArray[k];
        let x = ((line.x1*line.y2-line.x2*line.y1)*(line2.x2-line2.x1)-(line2.x1*line2.y2-line2.x2*line2.y1)*(line.x2-line.x1))/((line.y1-line.y2)*(line2.x2-line2.x1)-(line2.y1-line2.y2)*(line.x2-line.x1));
        let y = ((line2.y1-line2.y2)*x-(line2.x1*line2.y2-line2.x2*line2.y1))/(line2.x2-line2.x1);
        if (Math.abs(x) < cw && Math.abs(y) < ch) {
          // console.log(x, y)
          ctx.fillRect(Math.abs(x), Math.abs(y), 12,12)
        }
      }
    }
  },

}
