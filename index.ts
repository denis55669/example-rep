import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Entry = Menu.AddEntry("Auto Feed")
const EnableFeed = Entry.AddToggle("УВІМКНУТИ ФІД", false)
const MySide = Entry.AddToggle("Я за ТЬМУ (Dire)", false)
const FeedMyHero = Entry.AddToggle("Фідити моїм героєм", true)
const FeedOthers = Entry.AddToggle("Фідити союзниками/кур'єрами", true)

const RadiantFountain = new Vector3(-7200, -6600, 384)
const DireFountain = new Vector3(7200, 6500, 384)

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return

    const MyHero = LocalPlayer?.Hero
    if (MyHero === undefined) return

    const TargetPos = MySide.value ? RadiantFountain : DireFountain

    // 1. Фід моїм героєм
    if (FeedMyHero.value && MyHero.IsAlive) {
        // @ts-ignore
        MyHero.MoveTo(TargetPos)
    }

    if (!FeedOthers.value) return

    // 2. Фід іншими героями (лівнуті/shared)
    EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero").forEach(hero => {
        // @ts-ignore
        if (hero !== MyHero && hero.IsAlive && hero.IsControllable) {
            // @ts-ignore
            hero.MoveTo(TargetPos)
        }
    })

    // 3. Фід кур'єрами
    EntityManager.GetEntitiesByClass("CDOTA_Unit_Courier").forEach(courier => {
        // @ts-ignore
        if (courier.IsAlive && courier.IsControllable) {
            // @ts-ignore
            courier.Move
