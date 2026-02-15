import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Entry = Menu.AddEntry("Auto Feed Fixed")
const EnableFeed = Entry.AddToggle("УВІМКНУТИ ФІД", false)
const MySide = Entry.AddToggle("Я за ТЬМУ (Dire)", false) 

const RadiantFountain = new Vector3(-7200, -6600, 384)
const DireFountain = new Vector3(7200, 6500, 384)

let lastClickTime = 0
const DELAY = 5000 // 5 секунд між кліками для безпеки

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return

    const currentTime = Date.now()
    if (currentTime - lastClickTime < DELAY) return
    lastClickTime = currentTime

    const MyHero = LocalPlayer?.Hero
    if (!MyHero) return

    const TargetPos = MySide.value ? RadiantFountain : DireFountain

    // ШУКАЄМО ВСІХ ЮНІТІВ (Герої, кур'єри, закликані істоти)
    const allEntities = EntityManager.GetEntities()

    for (const entity of allEntities) {
        // @ts-ignore
        if (entity && entity.IsAlive && entity.IsControllable) {
            
            // Перевірка, щоб не фідити будівлями або ворогами
            // @ts-ignore
            if (entity.TeamNum === MyHero.TeamNum) {
                // @ts-ignore
                entity.MoveTo(TargetPos)
            }
        }
    }
})

console.log("Скрипт Дениса: Універсальний фід (5 сек затримка) завантажено!")
