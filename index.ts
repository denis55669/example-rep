import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (як на твоїх скрінах) ---
const FeedMenu = Menu.AddEntry("Auto Feed");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); 
const FeedMyHero = FeedMenu.AddToggle("Фідити моїм героєм", true);
const FeedAllies = FeedMenu.AddToggle("Фідити союзниками", true);
const FeedCouriers = FeedMenu.AddToggle("Фідити кур'єрами", true);

const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);

// Таймер для дуже повільних кліків (раз на 6 секунд)
let lastActionTime = 0;

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    // Пауза 6000 мс (6 секунд) між пачками кліків
    const currentTime = Date.now();
    if (currentTime - lastActionTime < 6000) return;
    lastActionTime = currentTime;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    const TargetPosition = MySide.value ? RadiantFountain : DireFountain;

    // 1. ТВІЙ ГЕРОЙ
    if (FeedMyHero.value && MyHero.IsAlive) {
        // @ts-ignore
        MyHero.MoveTo(TargetPosition);
    }

    // 2. КУР'ЄРИ
    if (FeedCouriers.value) {
        const couriers = EntityManager.GetEntitiesByClass("CDOTA_Unit_Courier");
        for (const courier of couriers) {
            // @ts-ignore
            if (courier && courier.IsAlive && courier.IsControllable) {
                // @ts-ignore
                courier.MoveTo(TargetPosition);
            }
        }
    }

    // 3. СОЮЗНИКИ
    if (FeedAllies.value) {
        const heroes = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero");
        for (const hero of heroes) {
            // @ts-ignore
            if (hero && hero !== MyHero && hero.IsAlive && hero.IsControllable) {
                // @ts-ignore
                hero.MoveTo(TargetPosition);
            }
        }
    }
});

console.log("Auto Feed: Кліки раз на 6 секунд. Перевіряй!");
