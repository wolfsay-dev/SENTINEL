const { app, BrowserWindow, ipcMain, Notification } = require('electron')

const path = require('path')
const os = require('os')
const fs = require('fs')

const si = require('systeminformation')
const chokidar = require('chokidar')

const db = require('../core/database')
const { log } = require('console')

let mainWindow

// Create window
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//IPC system infos
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Start watching the Downloads folder for new files
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

    // Watcher + Notifications + Database + Detection et suppression des fichiers suspects
    watcher.on('add', (filePath) => {

      
        let dangerScore=0;

        const extension = path.extname(filePath).toLowerCase()
        const name = path.basename(filePath).toLowerCase()
        const size = fs.statSync(filePath).size / 1024 / 1024 // EN MB
        const isInSubfolder = filePath.split(path.sep).length > downloadsPath.split(path.sep).length + 1


        const suspiciousExtensions = [
            '.exe', 
            '.bat',
            '.cmd',
            '.ps1',
            '.vbs',
            '.scr',
            '.js'
        ]

        const suspiciousNames = [
            'trojan',
            'ransomware',
            'worm',
            'spyware',
            'keylogger',
            'backdoor',
            'rootkit',
            'virus',
            'malware',
            'free_nitro',
            'free_steam'
        ]

    
          if (suspiciousExtensions.includes(extension)) {
            dangerScore += 30
         
           
            
        }

       if (suspiciousNames.some(word => name.includes(word))) {
            dangerScore += 30
      
           
            
        }


        if (size < 0.05) { 
            dangerScore += 25
            
            
        } else if (size < 0.2) {
            dangerScore += 10
          
            
        }

            if (isInSubfolder) {
    dangerScore += 5
   
}


        if (dangerScore >= 60) {

            console.log(dangerScore);
            
              //Notification
            new Notification({

                title: 'Un fichier suspect a été détecté',
                body: 'Nous l\'avons supprimé pour votre sécurité.'

            }).show()

            fs.unlink(filePath, (err) => {
                //Error
                if (err) {

                    console.log(err)
                    return
                }

               
                //Database
                db.prepare(`
                    UPDATE stats
                    SET malware_count = malware_count + 1
                    WHERE id = 1
                `).run()
                //Database
                const result = db.prepare(`
                    SELECT malware_count
                    FROM stats
                    WHERE id = 1
                `).get()

                dangerScore=0;
               
            })

        }
          
    })
}
// IPC malware count
ipcMain.handle('get-malware-count', async () => {

    const result = db.prepare(`
        SELECT malware_count
        FROM stats
        WHERE id = 1
    `).get()

   

    return result.malware_count
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



app.whenReady().then(() => {

    createWindow()

    startWatcher()

})