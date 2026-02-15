import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ З ІКОНКОЮ ---
// Я додав другий аргумент - шлях до іконки Boots of Travel у грі
const FeedMenu = Menu.AddEntry("Auto Feed Ultimate", "panorama/images/items/travel_boots_png.vtex_c");

const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); // Перемикач сторони
const FeedMyHero = FeedMenu.AddToggle("Фідити моїм героєм", true);
const FeedAllies = FeedMenu.AddToggle("Фідити союзниками", true);
const FeedCouriers = FeedMenu.AddToggle("Фідити кур'єрами", true);

// Координати фонтанів
const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);

// Затримка між командами (6 секунд) для стабільності та безпеки
let lastActionTime = 0;
const DELAY = 6000; 

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    // Перевірка таймера
    const currentTime = Date.now();
    if (currentTime - lastActionTime < DELAY) return;
    lastActionTime = currentTime;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    const TargetPosition = MySide.value ? RadiantFountain : DireFountain;

    // 1. Фід твоїм героєм
    if (FeedMyHero.value && MyHero.IsAlive) {
        // @ts-ignore
        MyHero.MoveTo(TargetPosition);
    }

    // 2. Фід кур'єрами
    if (FeedCouriers.value) {
        const couriers = EntityManager.GetEntitiesByClass("CDOTA_Unit_Courier");
        for (const courier of couriers) {
            // Перевірка: живий і підконтрольний тобі
            // @ts-ignore
            if (courier && courier.IsAlive && courier.IsControllable) {
                // @ts-ignore
                courier.MoveTo(TargetPosition);
            }
        }
    }

    // 3. Фід союзниками (лівнуті/shared)
    if (FeedAllies.value) {
        const heroes = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_
