function AR(canvas, video, settings) {
	this.canvas = canvas;
	this.video = video;
	this.settings = settings;
	this.ctx = canvas.getContext("2d");
	this.ok = false;
	this.isStreaming = false;
}

AR.prototype.load = function () {
	navigator.getUserMedia = (navigator.getUserMedia ||
														navigator.webkitGetUserMedia ||
														navigator.mozGetUserMedia ||
														navigator.msGetUserMedia);

	if (navigator.getUserMedia) {
		navigator.getUserMedia({ video:true, audio:false },
			function(stream) {
				this.video.srcObject = stream;
				this.video.play();
			}.bind(this),
			function(error) { console.error(error) }
		);
	} else {
		alert('Sorry, the browser you are using doesn\'t support getUserMedia');
		return;
	}

	this.video.addEventListener('canplay', function(e) {
		if (!this.isStreaming) {
		// videoWidth isn't always set correctly in all browsers
		if (this.video.videoWidth > 0) this.settings.height = this.video.videoHeight / (this.video.videoWidth / this.settings.width);
			this.canvas.setAttribute('width', this.settings.width);
			this.canvas.setAttribute('height', this.settings.height);
			// Reverse the canvas image
			this.ctx.translate(w, 0);
			this.ctx.scale(-1, 1);
			this.isStreaming = true;
		}
	}.bind(this), false);

	this.video.addEventListener('play', function() {
   	 // Every 33 milliseconds copy the video image to the canvas
	   setInterval(function() {
	      if (this.video.paused || this.video.ended) return;
	      this.ctx.fillRect(0, 0, w, h);
				this.contextAnalysis(v);
	   }.bind(this), 1000/60);
	}.bind(this), false);
};

AR.prototype.contextAnalysis = function (v) {
	// Real image
	this.ctx.drawImage(v, 0, 0, w, h);

	// Grayscape
	let image = this.ctx.getImageData(0, 0, 600, 600);
	let pixels = image.data;
	let summary = 0;

	for (let i = 0; i < pixels.length; i += 4) {
		let red = pixels[i];
		let green = pixels[i+1];
		let blue = pixels[i+2];
		pixels[i] = 0.2125*red + 0.7154*green + 0.0721*blue;
		pixels[i+1] = 0.2125*red + 0.7154*green + 0.0721*blue;
		pixels[i+2] = 0.2125*red + 0.7154*green + 0.0721*blue;
		summary += pixels[i];
	}

	// To canvas #2
	let canvas2 = document.querySelector("#canvas2");
	let ctx2 = canvas2.getContext("2d");
	canvas2.setAttribute('width', this.settings.width);
	canvas2.setAttribute('height', this.settings.height);
	ctx2.putImageData(image, 0, 0);

	// Otsy
	let histogram = [];
	for (let i = 0; i<256; i++) {
		histogram[i] = 0;
	}

	pixels = image.data;
	for (let i = 0; i < pixels.length; i += 4) {
		let red = pixels[i];
		let green = pixels[i+1];
		let blue = pixels[i+2];
		pixels[i] = 0.2125*red + 0.7154*green + 0.0721*blue;
		pixels[i+1] = 0.2125*red + 0.7154*green + 0.0721*blue;
		pixels[i+2] = 0.2125*red + 0.7154*green + 0.0721*blue;
		histogram[pixels[i]] += 1;
	}

	let pixelsLen = pixels.length/4;
	console.log(histogram);

	summary = (summary/pixels.length)*4;

	function otsu(histogram, pixelsNumber) {
		var sum = 0
		  , sumB = 0
		  , wB = 0
		  , wF = 0
	      , mB
		  , mF
		  , max = 0
		  , between
		  , threshold = 0;
		for (var i = 0; i < 256; ++i) {
	      wB += histogram[i];
	      if (wB == 0)
	        continue;
	      wF = pixelsNumber - wB;
	      if (wF == 0)
	        break;
	      sumB += i * histogram[i];
	      mB = sumB / wB;
	      mF = (sum - sumB) / wF;
	      between = wB * wF * Math.pow(mB - mF, 2);
	      if (between > max) {
	        max = between;
	        threshold = i;
	      }
	    }
	    return threshold;
	}

	let porog = otsu(histogram, pixelsLen);

	for (let i = 0; i < pixels.length; i += 4) {
		let current = (pixels[i] + pixels[i+1] + pixels[i+2])/3;
		if (current > porog/1.4) {
			pixels[i] = 255;
			pixels[i+1] = 255;
			pixels[i+2] = 255;
		} else {
			pixels[i] = 0;
			pixels[i+1] = 0;
			pixels[i+2] = 0;
		}
	}

	// To canvas #3
	let canvas3 = document.querySelector("#canvas3");
	let ctx3 = canvas3.getContext("2d");
	canvas3.setAttribute('width', this.settings.width);
	canvas3.setAttribute('height', this.settings.height);
	ctx3.putImageData(image, 0, 0);

	// // Sobel
	//
	// let imageData = image;
	//
	// var sobelData = Sobel(imageData);
	//
  // // [sobelData].toImageData() returns a new ImageData object
  // var sobelImageData = sobelData.toImageData();
	//
	// // To canvas #4
	// let canvas4 = document.querySelector("#canvas4");
	// let ctx4 = canvas4.getContext("2d");
	// canvas4.setAttribute('width', this.settings.width);
	// canvas4.setAttribute('height', this.settings.height);
	// ctx4.putImageData(sobelImageData, 0, 0);
};
