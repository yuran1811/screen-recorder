const { writeFile } = require('fs');
const { desktopCapturer, remote } = require('electron');
const { dialog, Menu } = remote;
const { startClickHandle, stopClickHandle } = require('./js/eventHandles.js');

const videoSelectBtn = document.querySelector('.tools button.source');
const startBtn = document.querySelector('.tools button.start');
const stopBtn = document.querySelector('.tools button.stop');
const videoElement = document.querySelector('.media');

const recordedChunks = [];
let mediaRecorder;

const handleDataAvailable = ({ data }) => {
	console.log('video data available');
	recordedChunks.push(data);
};
const getVideoSources = async () => {
	const inputSources = await desktopCapturer.getSources({
		types: ['window', 'screen'],
	});

	const videoOptionsMenu = Menu.buildFromTemplate(
		inputSources.map((source) => ({
			label: source.name,
			click: () => selectSource(source),
		}))
	);

	videoOptionsMenu.popup();
};
const selectSource = async (source) => {
	videoSelectBtn.innerText = source.name;

	const constraints = {
		audio: false,
		video: {
			mandatory: {
				chromeMediaSource: 'desktop',
				chromeMediaSourceId: source.id,
			},
		},
	};

	// Create a Stream
	const stream = await navigator.mediaDevices.getUserMedia(constraints);

	// Preview the source in a video element
	videoElement.srcObject = stream;
	videoElement.play();

	// Create the Media Recorder
	const options = { mimeType: 'video/webm; codecs=vp9' };
	mediaRecorder = new MediaRecorder(stream, options);

	// Register Event Handlers
	mediaRecorder.ondataavailable = handleDataAvailable;
	mediaRecorder.onstop = handleStop;

	// Updates the UI
};
const handleStop = async (e) => {
	const blob = new Blob(recordedChunks, { type: 'video/webm; codecs=vp9' });
	const buffer = Buffer.from(await blob.arrayBuffer());
	const { filePath } = await dialog.showSaveDialog({
		buttonLabel: 'Save video',
		defaultPath: `vid-${Date.now()}.mp4`,
	});

	filePath &&
		writeFile(filePath, buffer, () =>
			console.log('video saved successfully!')
		);
};

startBtn.onclick = startClickHandle();
stopBtn.onclick = stopClickHandle();
videoSelectBtn.onclick = getVideoSources;
