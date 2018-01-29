class CamAdapter {
	constructor(video, canvas, constraints) {
		let createSrc = window.URL ? window.URL.createObjectURL : function(stream) { return stream; };

		this.video = video;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.pause = false;

		this.perfElem = document.querySelector("#performance");

		window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
																 	 window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

		navigator.mediaDevices.getUserMedia(constraints)
			.then(stream => {
				this.video.srcObject = stream;
				this.video.onloadedmetadata = () => {
					this.video.play();
					this.animate();
				};
			})
			.catch(err => console.error("Error when tryed to connect to camera: ", err));
	}

	testPerformance(_func) {
		return new Promise((resolve, reject) => {
			let time_1 = performance.now();
			let complite = err => err ? reject() : resolve(performance.now() - time_1);
			(_func.bind(this))(complite)
		})
	}

	async animate() {
		this.canvas.width = this.video.videoWidth;
		this.canvas.height = this.video.videoHeight;
		this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
		this.image = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
		this.pixels = this.image.data;

		this.perfElem.innerHTML = Math.round(1000/await this.testPerformance(this.analysis))+" fps";

		window.requestAnimationFrame(this.animate.bind(this))
	}

	analysis(complite) {
		
		this.grayscape();
		this.sobel()

		this.ctx.putImageData(this.image, 0, 0)
		complite()
	}

	grayscape() {
		for (let i = 0; i < this.pixels.length; i += 4) {
			// let current = (this.pixels[i] + this.pixels[i+1] + this.pixels[i+2])/3;
			let current = Math.min(this.pixels[i], this.pixels[i+1], this.pixels[i+2]);

			this.pixels[i] = current;
			this.pixels[i+1] = current;
			this.pixels[i+2] = current;
		}
	}

	sobel() {
		for (let y = 0; y < this.canvas.height; y++) {

			let delta_y = (this.canvas.width * y)*4;

			for (let x = 0; x < this.canvas.width; x++) {

				let start_1 = delta_y + 4*x;
				let start_2 = start_1 + this.canvas.width*4;
				let start_3 = start_2 + this.canvas.width*4;

				let ltop = this.pixels[start_1];
				let top = this.pixels[start_1 + 4];
				let rtop = this.pixels[start_1 + 8];

				let lcenter = this.pixels[start_2];
				let rcenter = this.pixels[start_2 + 8];

				let lbottom = this.pixels[start_3];
				let bottom = this.pixels[start_3 + 4];
				let rbottom = this.pixels[start_3 + 8];

				let Gy = -ltop -2*top -rtop + lbottom + rbottom + 2*bottom;
				let Gx = -ltop -2*lcenter -lbottom + rtop + 2*rcenter + rbottom;

				let color = Math.sqrt(Gy*Gy + Gx*Gx);

				this.pixels[start_1 + 0] = color;
				this.pixels[start_1 + 1] = color;
				this.pixels[start_1 + 2] = color;
			}
		}
	}

	blur(k) {
		// console.log("Called")
		for (let x = 0; x < this.canvas.width; x++) {
			for (let y = 0; y < this.canvas.height; y++) {
				let ltop = this.pixels[((this.canvas.width * y) + x) * 4];
				let top = this.pixels[((this.canvas.width * y) + x + 1) * 4];
				let rtop = this.pixels[((this.canvas.width * y) + x + 2) * 4];

				let lcenter = this.pixels[((this.canvas.width * (y + 1)) + x) * 4];
				let rcenter = this.pixels[((this.canvas.width * (y + 1)) + x + 2) * 4];

				let lbottom = this.pixels[((this.canvas.width * (y + 2)) + x) * 4];
				let bottom = this.pixels[((this.canvas.width * (y + 2)) + x + 1) * 4];
				let rbottom = this.pixels[((this.canvas.width * (y + 2)) + x + 2) * 4];

				let red = (ltop + top + rtop + lcenter + rcenter + lbottom + bottom + rbottom)/8;

				ltop = this.pixels[((this.canvas.width * y) + x) * 4 + 1];
				top = this.pixels[((this.canvas.width * y) + x + 1) * 4 + 1];
				rtop = this.pixels[((this.canvas.width * y) + x + 2) * 4 + 1];

				lcenter = this.pixels[((this.canvas.width * (y + 1)) + x) * 4 + 1];
				rcenter = this.pixels[((this.canvas.width * (y + 1)) + x + 2) * 4 + 1];

				lbottom = this.pixels[((this.canvas.width * (y + 2)) + x) * 4 + 1];
				bottom = this.pixels[((this.canvas.width * (y + 2)) + x + 1) * 4 + 1];
				rbottom = this.pixels[((this.canvas.width * (y + 2)) + x + 2) * 4 + 1];

				let green = (ltop + top + rtop + lcenter + rcenter + lbottom + bottom + rbottom)/8;

				ltop = this.pixels[((this.canvas.width * y) + x) * 4 + 2];
				top = this.pixels[((this.canvas.width * y) + x + 1) * 4 + 2];
				rtop = this.pixels[((this.canvas.width * y) + x + 2) * 4 + 2];

				lcenter = this.pixels[((this.canvas.width * (y + 1)) + x) * 4 + 2];
				rcenter = this.pixels[((this.canvas.width * (y + 1)) + x + 2) * 4 + 2];

				lbottom = this.pixels[((this.canvas.width * (y + 2)) + x) * 4 + 2];
				bottom = this.pixels[((this.canvas.width * (y + 2)) + x + 1) * 4 + 2];
				rbottom = this.pixels[((this.canvas.width * (y + 2)) + x + 2) * 4 + 2];

				let blue = (ltop + top + rtop + lcenter + rcenter + lbottom + bottom + rbottom)/8;

				// let Gy = -ltop -2*top -rtop + lbottom + rbottom + 2*bottom;
				// let Gx = -ltop -2*lcenter -lbottom + rtop + 2*rcenter + rbottom;

				// let color = Math.sqrt(Gy*Gy + Gx*Gx);

				this.pixels[((this.canvas.width * y) + x) * 4 + 0] = red;
				this.pixels[((this.canvas.width * y) + x) * 4 + 1] = green;
				this.pixels[((this.canvas.width * y) + x) * 4 + 2] = blue;
			}
		}
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