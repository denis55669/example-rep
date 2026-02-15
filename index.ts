import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const FeedMenu = Menu.AddEntry("Auto Feed Fixed");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); 
const FeedMyHero = FeedMenu.AddToggle("Фідити моїм героєм", true);
const FeedAllies = FeedMenu.AddToggle("Фідити союзниками", true);
const FeedCouriers = FeedMenu.AddToggle("Фідити кур'єрами", true);

const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);

let lastClickTime = 0;
const DELAY = 5000; // Кліки раз на 5 секунд

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    // ОБМЕЖЕННЯ КЛІКІВ
    const currentTime = Date.now();
    if (currentTime - lastClickTime < DELAY) return;
    lastClickTime = currentTime;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    const TargetPosition = MySide.value ? RadiantFountain : DireFountain;

    // 1. ТВІЙ ГЕРОЙ
    if (FeedMyHero.value && MyHero.IsAlive) {
        // @ts-ignore
        MyHero.MoveTo(TargetPosition);
    }

    // 2. КУР'ЄРИ (Шукаємо через точний клас)
    if (FeedCouriers.value) {
        const couriers = EntityManager.GetEntitiesByClass("CDOTA_Unit_Courier");
        for (const courier of couriers) {
            // @ts-ignore
            if (courier && courier.IsAlive && courier.IsControllable)
