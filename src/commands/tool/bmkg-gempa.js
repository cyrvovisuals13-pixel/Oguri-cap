import pkg from 'whatsapp-web.js';
const { Location } = pkg;



export default {
    name: "gempa",
    aliases: ["infogempa", "bmkg"],
    type: 'tool',
    desc: "Get information last from bmkg",
    execute: async({ hisoka, m }) => {
        Func.fetchJson("https://bmkg-content-inatews.storage.googleapis.com/datagempa.json?t=${Date.now()}")
        .then(async (a) => {
            let text = `
‼ ${a?.info?.instruction}

📅 *Tanggal :* ${a?.info?.timesent}
📌 *Koordinat :* ${a?.info?.latitude} - ${a?.info?.longitude}
🌋 *Magnitudo :* ${a?.info?.magnitude}
🌊 *Kedalaman :* ${a?.info?.depth}
📍 *Area :* ${a?.info?.area}
📈 *Potensi :* ${a?.info?.potential}
📝 *Dirasakan :* ${a?.info?.felt}
            `
            await hisoka.sendMessage(m.from, new Location(a?.info?.point?.coordinates?.split(",")[1], a?.info?.point?.coordinates?.split(",")[0], `${a?.info?.felt}\n\n${a?.info?.area}`), { quoted: m })
            hisoka.sendMessage(m.from, "https://bmkg-content-inatews.storage.googleapis.com/" + a?.info?.shakemap, { caption: text, quoted: m })
        })
    }
}
