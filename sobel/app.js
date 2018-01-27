class CamAdapter {
	constructor(video, canvas, constraints) {
		let createSrc = window.URL ? window.URL.createObjectURL : function(stream) { return stream; };

		this.video = video;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.pause = false;

		this.first = 0;
		this.second = 0;

		this.fps = 0;

		navigator.mediaDevices.getUserMedia(constraints)
			.then(stream => {
				this.video.srcObject = stream;
				this.video.onloadedmetadata = () => {
					this.video.play();
					setInterval(() => !this.pause ? this.animate() : null, 1000/60)
				};
			})
			.catch(err => console.error("Error when tryed to connect to camera: ", err));
	}
	animate() {
		this.first = performance.now();
		this.canvas.width = this.video.videoWidth;
		this.canvas.height = this.video.videoHeight;
		this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
		this.analysis();
	}

	analysis() {
		let image = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		let pixels = image.data;

		// for (let x = 0; x < this.canvas.width; x++) {
		// 	for (let y = 0; y < this.canvas.height; y++) {
		// 		let red = pixels[((this.canvas.width * y) + x) * 4 + 0];
		// 		let green = pixels[((this.canvas.width * y) + x) * 4 + 1];
		// 		let blue = pixels[((this.canvas.width * y) + x) * 4 + 2];

		// 		// let gray = Math.sqrt((red*green + blue*green + red*blue)/9);
		// 		let gray = (red + green + blue)/3;


		// 		pixels[((this.canvas.width * y) + x) * 4 + 0] = gray;
		// 		pixels[((this.canvas.width * y) + x) * 4 + 1] = gray;
		// 		pixels[((this.canvas.width * y) + x) * 4 + 2] = gray;
		// 	}
		// }

		for (let i = 0; i < pixels.length; i += 4) {
			let current = (pixels[i] + pixels[i+1] + pixels[i+2])/3;
			pixels[i] = current;
			pixels[i+1] = current;
			pixels[i+2] = current;
		}

		for (let x = 0; x < this.canvas.width; x++) {
			for (let y = 0; y < this.canvas.height; y++) {
				let ltop = pixels[((this.canvas.width * y) + x) * 4];
				let top = pixels[((this.canvas.width * y) + x + 1) * 4];
				let rtop = pixels[((this.canvas.width * y) + x + 2) * 4];

				let lcenter = pixels[((this.canvas.width * (y + 1)) + x) * 4];
				let rcenter = pixels[((this.canvas.width * (y + 1)) + x + 2) * 4];

				let lbottom = pixels[((this.canvas.width * (y + 2)) + x) * 4];
				let bottom = pixels[((this.canvas.width * (y + 2)) + x + 1) * 4];
				let rbottom = pixels[((this.canvas.width * (y + 2)) + x + 2) * 4];

				let Gy = -ltop -2*top -rtop + lbottom + rbottom + 2*bottom;
				let Gx = -ltop -2*lcenter -lbottom + rtop + 2*rcenter + rbottom;

				let color = Math.sqrt(Gy*Gy + Gx*Gx);

				pixels[((this.canvas.width * y) + x) * 4 + 0] = color;
				pixels[((this.canvas.width * y) + x) * 4 + 1] = color;
				pixels[((this.canvas.width * y) + x) * 4 + 2] = color;
			}
		}

		this.ctx.putImageData(image, 0, 0)
		this.second = performance.now();
		this.fps = 1000/(this.second - this.first);
		document.querySelector("#perfomance").innerHTML = Math.round(this.fps)+" fps";
	}

	bind(pixels) {
		return (x, y, num) => {
			return pixels[((this.canvas.width * y) + x) * 4 + num]
		}
	}
}

function init() {
	let constraints = {
		audio: false,
		video: { facingMode: "user" }
	};

	let canvas = document.querySelector("canvas");

	let camadapter = new CamAdapter(document.querySelector("video"), 
																	canvas, 
																	constraints);
}

window.onload = init;