const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const si = require('systeminformation')
const os = require('os')
const fs = require('fs')
const chokidar = require('chokidar')
const { Notification } = require('electron')
const db = require('../core/database')
const { exec } = require('child_process')

let mainWindow;
let machineID = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
}

// Récupère le machine ID et initialise la base de données
function initializeMachineID() {
    exec('wmic csproduct get uuid', (err, stdout) => {
        if (err) {
            console.error('Erreur récupération machine ID:', err)
            return
        }
        
        machineID = stdout.split('\n')[1]
        if (machineID) {
            machineID = machineID.replace(/\r/g, '').trim()
        }
        console.log('Machine ID:', machineID)

        const existingMachine = db.prepare(`
            SELECT * FROM stats WHERE machine_id = ?
        `).get(machineID)
        
        if (!existingMachine) {
            db.prepare(`
                INSERT INTO stats (machine_id, malware_count)
                VALUES (?, ?)
            `).run(machineID, 0)
            console.log('Machine enregistrée dans la base de données')
        }
    })
}

// Démarre le watcher de fichiers
function startFileWatcher() {
    const userFolder = os.homedir()
    const downloadsPath = path.join(userFolder, 'Downloads')
    console.log('Watching:', downloadsPath)

    const watcher = chokidar.watch(downloadsPath, {
        persistent: true,
        ignoreInitial: true
    })

    watcher.on('add', (filePath) => {
        console.log('New file detected:', filePath)

        if (filePath.endsWith('.jpeg') || filePath.endsWith('.jpg') || filePath.endsWith('.png')) {
            console.log('Image file detected')
            
            new Notification({
                title: 'Menace détectée',
                body: 'Un fichier dangereux a été détecté et supprimé.'
            }).show()

            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log('Erreur suppression:', err)
                    return
                }
                
                if (machineID) {
                    db.prepare(`
                        UPDATE stats
                        SET malware_count = malware_count + 1
                        WHERE machine_id = ?
                    `).run(machineID)
                    
                    mainWindow.webContents.send('malware-detected')
                    console.log('Fichier supprimé et compteur mis à jour')
                }
            })
        }
    })
}

// Handler pour récupérer les infos système
ipcMain.handle('get-system-info', async () => {
    const cpu = await si.cpu()
    const mem = await si.mem()
    const osInfo = await si.osInfo()
    const time = await si.time()

    return {
        cpu: cpu.brand,
        ramUsed: Math.round(mem.used / 1024 / 1024 / 1024),
        ramTotal: Math.round(mem.total / 1024 / 1024 / 1024),
        os: osInfo.distro,
        uptime: Math.floor(time.uptime / 3600)
    }
})

// Handler pour récupérer le nombre de malwares détectés
ipcMain.handle('get-malware-count', async () => {
    if (!machineID) {
        console.log('Machine ID not ready')
        return 0
    }

    const result = db.prepare(`
        SELECT malware_count FROM stats WHERE machine_id = ?
    `).get(machineID)

    return result?.malware_count ?? 0
})

// Démarre l'application
app.whenReady().then(() => {
    createWindow()
    initializeMachineID()
    startFileWatcher()
})
