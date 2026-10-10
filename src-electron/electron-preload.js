const { contextBridge, ipcRenderer } = require('electron')

// Canaux autorises entre l'interface et le processus principal
const SEND_CHANNELS = ['quit']
const INVOKE_CHANNELS = [
    'folder:read',
    'file:read',
    'file:delete',
    'file:convert',
    'img:upload',
    'img:remove-bg',
    'video:download',
    'audio:download',
    'video:clip',
    'video:crop',
    'clear'
]

contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel, args) => {
        if (SEND_CHANNELS.includes(channel)) {
            ipcRenderer.send(channel, args)
        }
    },
    invoke: (channel, args) => {
        if (INVOKE_CHANNELS.includes(channel)) {
            return ipcRenderer.invoke(channel, args)
        }
    }
})
