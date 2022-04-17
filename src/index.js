const path = require('path');
const { app, BrowserWindow, Menu } = require('electron');
const { startClickHandle, stopClickHandle } = require('./js/eventHandles.js');
require('electron-squirrel-startup') && app.quit();

let mainWindow;

const getWindowsLength = () => BrowserWindow.getAllWindows().length;
const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1000,
		height: 700,
		webPreferences: {
			nodeIntegration: true,
		},
	});
	mainWindow.loadFile(path.resolve(__dirname, 'index.html'));
};
const readyEvent = () => {
	createWindow();

	const template = [
		{
			label: 'Tools',
			submenu: [
				{
					label: 'Start',
					click: startClickHandle(),
				},
				{
					label: 'Stop',
					click: stopClickHandle(),
				},
				{
					label: 'Dev Tool',
					click: () => {
						mainWindow.webContents.openDevTools();
					},
				},
			],
		},
		{
			label: 'About',
			submenu: [
				{
					label: 'License',
				},
				{
					label: 'Version',
				},
			],
		},
	];
	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
};

app.on('ready', readyEvent);
app.on('activate', () => getWindowsLength() === 0 && createWindow());
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
