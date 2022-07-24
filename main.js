import './src/index.css';
import ScreenRecorder from './src/js/screenRecorder.js';

addEventListener('load', () => {
  const app = new ScreenRecorder();
  app.launch();
});
