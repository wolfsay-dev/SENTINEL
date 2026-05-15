const { app, BrowserWindow, ipcMain, Notification } = require('electron')

const path = require('path')
const os = require('os')
const fs = require('fs')

const si = require('systeminformation')
const chokidar = require('chokidar')

const db = require('../core/database')

let mainWindow

function createWindow() {

    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,

        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.loadFile(
        path.join(__dirname, '../renderer/index.html')
    )
}

function startWatcher() {

    const downloadsPath = path.join(
        os.homedir(),
        'Downloads'
    )

    console.log('WATCHING :', downloadsPath)

    const watcher = chokidar.watch(downloadsPath, {

        persistent: true,
        ignoreInitial: true

    })

    watcher.on('add', (filePath) => {

      

        const extension = path.extname(filePath).toLowerCase()

        const suspiciousExtensions = [
            '.jpg',
            '.jpeg',
            '.png'
        ]

        if (suspiciousExtensions.includes(extension)) {

        

            new Notification({

                title: 'Threat detected',
                body: 'Suspicious file deleted'

            }).show()

            fs.unlink(filePath, (err) => {

                if (err) {

                    console.log(err)
                    return
                }

               

                db.prepare(`
                    UPDATE stats
                    SET malware_count = malware_count + 1
                    WHERE id = 1
                `).run()

                const result = db.prepare(`
                    SELECT malware_count
                    FROM stats
                    WHERE id = 1
                `).get()

               
            })
        }
    })
}

ipcMain.handle('get-system-info', async () => {

    const cpu = await si.cpu()
    const mem = await si.mem()
    const osInfo = await si.osInfo()
    const time = await si.time()

    return {

        cpu: cpu.brand,

        ramUsed:
            Math.round(mem.used / 1024 / 1024 / 1024),

        ramTotal:
            Math.round(mem.total / 1024 / 1024 / 1024),

        os: osInfo.distro,

        uptime:
            Math.floor(time.uptime / 3600)
    }
})

ipcMain.handle('get-malware-count', async () => {

    const result = db.prepare(`
        SELECT malware_count
        FROM stats
        WHERE id = 1
    `).get()

   

    return result.malware_count
})

app.whenReady().then(() => {

    createWindow()

    startWatcher()

})