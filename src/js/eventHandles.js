const startClickHandle = () => {
	return () => {
		if (!mediaRecorder) return;

		mediaRecorder.start();
		startBtn.classList.add('is-danger');
		startBtn.innerText = 'Recording';
	};
};

const stopClickHandle = () => {
	return () => {
		if (!mediaRecorder) return;

		mediaRecorder.stop();
		startBtn.classList.remove('is-danger');
		startBtn.innerText = 'Start';
	};
};

const eventHandles = { startClickHandle, stopClickHandle };

module.exports = eventHandles;
