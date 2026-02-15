import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Entry = Menu.AddEntry("Auto Feed Ultra")
const EnableFeed = Entry.AddToggle("УВІМКНУТИ ФІД", false)
const MySide = Entry.AddToggle("Я за ТЬМУ (Dire)", false) 

const RadiantFountain = new Vector3(-7200, -6600, 384)
const DireFountain = new Vector3(7200, 6500, 384)

// Затримка зафіксована на 5000 мс (5 секунд)
const FIXED_DELAY = 5000 
let lastClickTime = 0

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return

    const currentTime = Date.now()
    if (currentTime - lastClickTime < FIXED_DELAY) return
    lastClickTime = currentTime

    const MyHero = LocalPlayer?.Hero
    if (!MyHero) return

    const TargetPos = MySide.value ? RadiantFountain : DireFountain

    // 1. ФІДИМО ГЕРОЯМИ (ТИ + ЛІВНУТІ/SHARED)
    const heroes = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero")
    for (const hero of heroes) {
        // @ts-ignore
        if (hero && hero.IsAlive && hero.IsControllable) {
            // @ts-ignore
            hero.MoveTo(TargetPos)
        }
    }

    // 2. ФІДИМО КУР'ЄРАМИ
    const couriers = EntityManager.GetEntitiesByClass("CDOTA_Unit_Courier")
    for (const courier of couriers) {
        // @ts-ignore
        if (courier && courier.IsAlive && courier.IsControllable) {
            // @ts-ignore
            courier.MoveTo(TargetPos)
        }
    }
})

console.log("Safe Ultra Feed: Кліки кожні 5 секунд. Кур'єри + Герої.")
