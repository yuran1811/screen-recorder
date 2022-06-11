const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

class ScreenRecorder {
	constructor() {
		this.constraints = {
			audio: {
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					sampleRate: 44100,
				},
			},
			stream: {
				video: true,
			},
			webcam: {
				video: true,
			},
		};

		this.chunks = [];
		this.audio = null;
		this.stream = null;
		this.webcam = null;
		this.mixedStream = null;
		this.recorder = null;

		this.type = 0;
		this.mediaType = {
			video: 0,
			audio: 0,
		};

		this.stopButton = $('.stop-btn');
		this.startButton = $('.start-btn');
		this.recordedVideo = $('.recorded-video');
		this.downloadButton = $('.download-video-btn');
		this.chooseMediaButton = $('.choose-media-btn');

		this.hasAudioEle = $('.has-audio');
		this.hasVideoEle = $('.has-video');
		this.videoStreamEle = $('.video-stream');
		this.webcamVideoEle = $('.webcam-video');
		this.recordedVideoWrap = $('.recorded-video-wrap');
	}

	getRecordOptions() {
		return {
			audio: this.hasAudioEle.className.includes('get-media'),
			video: this.hasVideoEle.className.includes('get-media'),
		};
	}

	removeTracks(targets) {
		targets.forEach((target) => target.getTracks().forEach((_) => _.stop()));
	}

	changeStatus(type) {
		const isChooseType = typeof type === 'number';
		const another = ['start', 'stop'];

		if (isChooseType) {
			this.stopButton.classList.toggle('hidden', !type);
			this.startButton.classList.toggle('hidden', !type);
			this.chooseMediaButton.innerText = type ? 'Other source' : 'Choose source';
		}

		if (another.includes(type)) {
			this.startButton.disabled = type === 'stop';
			this.stopButton.disabled = type === 'start';
		}

		if (!type || type === 'stop') {
			this.hasAudioEle.classList.add('hidden');
			this.chooseMediaButton.classList.add('hidden');
			this.startButton.innerText = 'Recording ...';
		} else {
			this.hasAudioEle.classList.remove('hidden');
			this.chooseMediaButton.classList.remove('hidden');
			this.startButton.innerText = 'Start';
		}
	}

	changeMediaType(e, key) {
		this.mediaType[key] = !this.mediaType[key];

		e.currentTarget.classList.toggle('get-media', this.mediaType[key]);
		e.currentTarget.classList.toggle('notget-media', !this.mediaType[key]);
	}

	handleDataAvailable = (e) => {
		this.chunks.push(e.data);
	};

	handleStop = () => {
		const blob = new Blob(this.chunks, { type: 'video/mp4' });

		this.downloadButton.href = URL.createObjectURL(blob);
		this.downloadButton.download = 'video.mp4';
		this.downloadButton.disabled = false;

		this.recordedVideo.src = URL.createObjectURL(blob);
		this.recordedVideo.load();
		this.recordedVideo.onloadedmetadata = () => {
			this.recordedVideo.play();

			this.recordedVideoWrap.classList.remove('hidden');
			this.recordedVideoWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
		};

		this.reset();

		console.log('Prepare record...');
	};

	setVideoStream() {
		if (this.stream) {
			this.videoStreamEle.srcObject = this.stream;
			this.videoStreamEle.play();
		} else {
			console.warn('No stream available !');
		}
	}

	setWebcamVideo = async () => {
		if (!this.mediaType.webcam) this.webcam && this.removeTracks([this.webcam]);

		const { webcam } = this.constraints;

		try {
			this.webcam = await navigator.mediaDevices.getUserMedia(webcam);

			this.webcamVideoEle.srcObject = this.webcam;
			this.webcamVideoEle.onloadedmetadata = () => {
				this.webcamVideoEle.requestPictureInPicture().then((PIPWindow) => {
					PIPWindow.addEventListener('resize', () => onPipWindowResize(), false);
				});
				this.webcamVideoEle.play();
			};

			console.log(this.stream, this.audio, this.webcam);
		} catch (err) {
			console.log('Cannot use webcam !');
			console.log('More info: ', err);
		}
	};

	setAudio = async () => {
		if (!this.mediaType.audio) this.audio && this.removeTracks([this.audio]);

		const { audio } = this.constraints;

		try {
			this.audio = await navigator.mediaDevices.getUserMedia(audio);
			console.log(this.stream, this.audio, this.webcam);
		} catch (error) {
			console.log('Cannot use micro !');
			console.log('More info: ', err);
		}
	};

	setRecorder = () => {
		this.recorder = new MediaRecorder(this.mixedStream);
		this.recorder.ondataavailable = this.handleDataAvailable;
		this.recorder.onstop = this.handleStop;
		this.recorder.start(200);
	};

	async setStream() {
		try {
			const { stream } = this.constraints;

			this.stream = await navigator.mediaDevices.getDisplayMedia(stream);

			this.changeStatus(1);
			this.setVideoStream();
		} catch (err) {
			console.log('Please choose the source to start recording !');
			console.log('More info: ', err);
		}
	}

	chooseMedia = async () => {
		this.stream && this.removeTracks([this.stream]);

		try {
			await this.setStream();
			console.log(this.stream, this.audio, this.webcam);
		} catch (err) {
			console.log('Please select one source !');
			console.log('More info: ', err);
		}
	};

	startRecording = () => {
		const { stream, audio, webcam } = this;

		console.log(stream, audio, webcam);

		if (stream) {
			this.changeStatus(1);
			this.changeStatus('stop');

			const tracks = [...stream.getTracks()];
			audio && tracks.push(...audio.getTracks());
			webcam && tracks.push(...webcam.getTracks());

			this.mixedStream = new MediaStream(tracks);

			this.setRecorder();

			console.log('Recording...');
		} else {
			console.warn('No stream available !');
		}
	};

	stopRecording = () => {
		this.changeStatus(0);
		this.changeStatus('start');

		this.recorder.stop();

		console.log('Stop recording !');
	};

	reset = () => {
		this.chunks.length = 0;

		const tracks = [];
		this.audio && tracks.push(this.audio);
		this.webcam && tracks.push(this.webcam);
		this.stream && tracks.push(this.stream);

		this.removeTracks(tracks);
	};

	launch() {
		this.stopButton.onclick = this.stopRecording;
		this.startButton.onclick = this.startRecording;
		this.chooseMediaButton.onclick = this.chooseMedia;

		this.hasAudioEle.onclick = (e) => {
			this.changeMediaType(e, 'audio');
			this.setAudio();
		};
		this.hasVideoEle.onclick = (e) => {
			this.changeMediaType(e, 'video');
			this.setWebcamVideo();
		};
	}
}

onload = () => {
	const app = new ScreenRecorder();
	app.launch();
};
