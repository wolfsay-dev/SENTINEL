console.log('Renderer loaded')

async function loadSystemInfo() {

    const info = await window.api.getSystemInfo()

    document.getElementById('cpu').innerText =
        `CPU : ${info.cpu}`

    document.getElementById('ram').innerText =
        `RAM : ${info.ramUsed} GB / ${info.ramTotal} GB`

    document.getElementById('os').innerText =
        `OS : ${info.os}`

    document.getElementById('uptime').innerText =
        `Uptime : ${info.uptime} hours`
}

async function loadMalwareCount() {

    
    const malwareCount = await window.api.getMalwareCount()

    document.getElementById(
        'malware-count'
    ).innerText =
        `Malwares détectés : ${malwareCount}`
}

loadSystemInfo()

setInterval(loadMalwareCount, 1000)