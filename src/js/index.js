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
		// this.speaker = [];
		this.speaker = null;
		this.mixedStream = null;
		this.recorder = null;

		this.type = 0;
		this.mediaType = {
			audio: false,
			webcam: false,
			speaker: false,
		};

		this.stopButton = $('.stop-btn');
		this.startButton = $('.start-btn');
		this.downloadButton = $('.download-video-btn');
		this.chooseMediaButton = $('.choose-media-btn');

		this.hasAudioEle = $('.has-audio');
		this.hasWebcamEle = $('.has-webcam');
		// this.hasSpeakerEle = $('.has-speaker');
		this.streamVideo = $('.stream-video');
		this.webcamVideo = $('.webcam-video');
		this.recordedVideo = $('.recorded-video');
		this.recordedVideoWrap = $('.recorded-video-wrap');
	}

	removeAllTracks(targets) {
		targets.forEach((target) => this[target]?.getTracks().forEach((_) => _.stop()));
	}

	changeStatus(type) {
		const isChooseType = typeof type === 'number';
		const anotherType = ['start', 'stop'];

		if (isChooseType) {
			this.stopButton.classList.toggle('hidden', !type);
			this.startButton.classList.toggle('hidden', !type);
			this.chooseMediaButton.innerText = type ? 'Other source' : 'Choose source';
		}

		if (anotherType.includes(type)) {
			this.stopButton.disabled = type === 'start';
			this.startButton.disabled = type === 'stop';
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

	changeMediaType(key, loading = 0) {
		const newKey = key[0].toUpperCase() + key.slice(1);

		if (loading) {
			this[`has${newKey}Ele`].classList.remove('get-media');
			this[`has${newKey}Ele`].classList.remove('notget-media');
			this[`has${newKey}Ele`].classList.add('loading-media');
			return;
		}

		this.mediaType[key] = !this.mediaType[key];

		this[`has${newKey}Ele`].classList.toggle('get-media', this.mediaType[key]);
		this[`has${newKey}Ele`].classList.toggle('notget-media', !this.mediaType[key]);
		this[`has${newKey}Ele`].classList.remove('loading-media');
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
			this.recordedVideoWrap.classList.remove('hidden');
			this.recordedVideoWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
			this.recordedVideo.play();
		};

		this.reset();

		console.log('Finish record !');
	};

	setVideoStream() {
		if (!this.stream) {
			console.warn('No stream available !');
			return;
		}

		this.streamVideo.srcObject = this.stream;
		this.streamVideo.play();
	}

	setRecorder = () => {
		this.recorder = new MediaRecorder(this.mixedStream);
		this.recorder.ondataavailable = this.handleDataAvailable;
		this.recorder.onstop = this.handleStop;
		this.recorder.start(200);
	};

	setWebcam = async () => {
		this.webcam && this.removeAllTracks(['webcam']);

		if (this.mediaType.webcam) {
			this.changeMediaType('webcam');
			return;
		}

		try {
			const { webcam } = this.constraints;

			this.changeMediaType('webcam', 1);
			this.webcam = await navigator.mediaDevices.getUserMedia(webcam);
			this.changeMediaType('webcam');

			this.webcamVideo.srcObject = this.webcam;
			this.webcamVideo.onloadedmetadata = () => {
				this.webcamVideo.requestPictureInPicture().then((PIPWindow) => {
					PIPWindow.addEventListener('resize', () => onPipWindowResize(), false);
				});
				this.webcamVideo.play();
			};
		} catch (err) {
			console.log('Cannot use webcam !');
			console.log('More info: ', err);
		}
	};

	setAudio = async () => {
		this.audio && this.removeAllTracks(['audio']);

		if (this.mediaType.audio) {
			this.changeMediaType('audio');
			return;
		}

		try {
			const { audio } = this.constraints;

			this.changeMediaType('audio', 1);
			this.audio = await navigator.mediaDevices.getUserMedia(audio);
			this.changeMediaType('audio');
		} catch (err) {
			console.log('Cannot use micro !');
			console.log('More info: ', err);
		}
	};

	setSpeaker = async () => {
		// this.speaker.length && this.removeAllTracks(['speaker']);
		this.speaker && this.removeAllTracks(['speaker']);

		if (this.mediaType.speaker) {
			this.changeMediaType('speaker');
			// this.speaker.length = 0;
			return;
		}

		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const defaultSpeaker = devices.filter((_) => _.kind === 'audiooutput' && _.deviceId === 'default');
			// const defaultSpeakers = devices.filter((_) => _.kind === 'audiooutput');

			// defaultSpeakers.forEach(async (defaultSpeaker) => {
			// 	const newSpeaker = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: defaultSpeaker } });
			// 	this.speaker.push(newSpeaker);
			// 	console.log(defaultSpeaker, this.speaker);
			// });

			this.speaker = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: defaultSpeaker } });

			this.changeMediaType('speaker');
		} catch (err) {
			console.log('Cannot use speaker !');
			console.log('More info: ', err);
		}
	};

	setStream = async () => {
		try {
			const { stream } = this.constraints;

			this.stream = await navigator.mediaDevices.getDisplayMedia(stream);

			this.changeStatus(1);
			this.setVideoStream();
		} catch (err) {
			console.log('Please choose the source to start recording !');
			console.log('More info: ', err);
		}
	};

	chooseMedia = async () => {
		this.stream && this.removeAllTracks(['stream']);

		try {
			await this.setStream();

			this.streamVideo.scrollIntoView({ behavior: 'smooth', block: 'start' });
		} catch (err) {
			console.log('Please select one source !');
			console.log('More info: ', err);
		}
	};

	startRecording = () => {
		const { audio, stream, webcam, speaker } = this;

		if (!stream) {
			console.warn('No stream available !');
			return;
		}

		this.changeStatus(1);
		this.changeStatus('stop');
		this.recordedVideoWrap.classList.add('hidden');

		const tracks = [...stream.getTracks()];
		audio && tracks.push(...audio.getTracks());
		webcam && tracks.push(...webcam.getTracks());
		speaker && tracks.push(...speaker.getTracks());

		this.mixedStream = new MediaStream(tracks);

		this.setRecorder();

		console.log('Recording...');
	};

	stopRecording = () => {
		this.changeStatus(0);
		this.changeStatus('start');

		this.recorder.stop();

		console.log('Stop recording !');
	};

	reset = () => {
		this.chunks.length = 0;
		this.removeAllTracks(['audio', 'stream', 'webcam', 'speaker']);
	};

	launch() {
		this.hasAudioEle.onclick = this.setAudio;
		this.hasWebcamEle.onclick = this.setWebcam;
		// this.hasSpeakerEle.onclick = this.setSpeaker;
		this.stopButton.onclick = this.stopRecording;
		this.startButton.onclick = this.startRecording;
		this.chooseMediaButton.onclick = this.chooseMedia;
	}
}

onload = () => {
	const app = new ScreenRecorder();
	app.launch();
};
