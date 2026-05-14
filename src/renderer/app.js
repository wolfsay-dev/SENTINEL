console.log("Renderer loaded")

//





async function loadSystemInfo() {

    const info = await window.api.getSystemInfo()
    document.getElementById('cpu').innerText = `CPU: ${info.cpu}`
    document.getElementById('ram').innerText = `RAM: ${info.ramUsed} GB / ${info.ramTotal} GB`
    document.getElementById('os').innerText = `OS: ${info.os}`
    document.getElementById('uptime').innerText = `Uptime: ${info.uptime} heures`
}

// Charge le compteur de malwares
async function loadMalwareCount() {
    const malwareCount = await window.api.getMalwareCount()
    document.getElementById('malware-count').innerText = `Malwares détectés: ${malwareCount}`
}

loadSystemInfo()
loadMalwareCount()

// Raffraîchit le compteur quand un malware est détecté
window.api.onMalwareDetected(() => {
    console.log('Malware détecté, mise à jour du compteur...')
    loadMalwareCount()
})