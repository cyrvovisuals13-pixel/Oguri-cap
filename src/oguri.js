import config from "../config.js"

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;

import qrcode from "qrcode-terminal"
import chokidar from "chokidar"
import { chromium } from 'playwright-chromium'
import { platform } from 'os'
import path from 'path'
import readline from 'readline'
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

import API from "./lib/lib.api.js"


import Function from "./lib/lib.function.js"
import { serialize } from "./lib/whatsapp.serialize.js"
import { Message, readCommands } from "./event/event.message.js"
import { database as databes } from "./lib/lib.database.js"


const database = new databes()
global.Func = Function
global.api = API
global.commands = new (await import("./lib/lib.collection.js")).default


async function start() {
    process.on("uncaughtException", console.error)
    process.on("unhandledRejection", console.error)
    readCommands()

    const content = await database.read()
    if (content && Object.keys(content).length === 0) {
        global.db = {
            users: {},
            groups: {},
            ...(content || {})
        }
        await database.write(global.db)
    } else {
        global.db = content
    }

        const oguri = new Client({
        authStrategy: new LocalAuth({
            dataPath: `./${config.session.Path}`,
            clientId: `${config.session.Name}`
        }),
        puppeteer: {
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        },
        authTimeoutMs: 0,
        qrMaxRetries: 10,
        autoClearSession: false
    })

    // --- LOGIKA PILIHAN LOGIN ---
    const menuLogin = async () => {
        console.log("\n[ CERO PROJECT - LOGIN MENU ]")
        console.log("1. Pakai QR Code (Standar)")
        console.log("2. Pakai Pairing Code (8 Digit - Lebih Ringan)")
        const opsi = await question("Pilih metode (1/2): ")

        if (opsi === '2') {
            const phoneNumber = await question("Masukkan nomor WA Bot (contoh: 628xxx): ")
            oguri.initialize()
            
            // Tunggu sebentar biar engine siap, baru minta kode
            oguri.once('qr', async () => {
                try {
                    const code = await oguri.requestPairingCode(phoneNumber)
                    console.log("\n==============================")
                    console.log("KODE PAIRING ANDA: " + code)
                    console.log("==============================\n")
                } catch (err) {
                    console.error("ERROR ASLI:", err)
                }
            }, 3000)
        } else {
            // Mode QR Biasa
            oguri.initialize()
            oguri.on("qr", qr => {
                console.info("Silahkan Scan QR Code:")
                qrcode.generate(qr, { small: true })
            })
        }
    }

    // Jalankan menu login
    menuLogin()

    // --- EVENT LISTENER (Tetap Harus Ada) ---
    oguri.on("loading_screen", (percent, message) => {
        console.log(`Loading: ${percent}% - ${message}`)
    })

    oguri.on("ready", () => {
        console.info("✔ Noir Bot Ready!")
    })

    oguri.on("message_create", async (message) => {
        const m = await (await serialize(oguri, message))
        await (await Message(oguri, m))
    })

    // Auto-save database
    setInterval(async () => {
        if (global.db) await database.write(global.db)
    }, 3000)

    return oguri

}


start()


let choki = chokidar.watch(Func.__filename(path.join(process.cwd(), 'src', 'commands')), { ignored: /^\./ })
choki
.on('change', async(Path) => {
    const command = await import(Func.__filename(Path) + "?v=" + Date.now())
    global.commands.set(command?.default?.name, command)
})
.on('add', async function(Path) {
    const command = await import(Func.__filename(Path) + "?v=" + Date.now())
    global.commands.set(command?.default?.name, command)
})
