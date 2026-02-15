import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (як на твоїх скрінах) ---
const FeedMenu = Menu.AddEntry("Auto Feed Ultra", "panorama/images/items/travel_boots_png.vtex_c");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); 
const FeedAllies = FeedMenu.AddToggle("Фідити союзниками", true);

const RadiantFountain = { x: -7200, y: -6600, z: 384 };
const DireFountain = { x: 7200, y: 6500, z: 384 };

let lastActionTime = 0;
let nextRandomDelay = 5000;

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    const currentTime = Date.now();
    if (currentTime - lastActionTime < nextRandomDelay) return;
    lastActionTime = currentTime;
    
    // Рандомна пауза 4-8 сек для реалізму
    nextRandomDelay = Math.floor(Math.random() * 4000) + 4000;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    const basePos = MySide.value ? RadiantFountain : DireFountain;

    // Функція рандомної точки
    const getTarget = () => {
        return new Vector3(
            basePos.x + (Math.random() * 600 - 300),
            basePos.y + (Math.random() * 600 - 300),
            basePos.z
        );
    };

    // 1. ТВІЙ ГЕРОЙ
    if (MyHero.IsAlive) {
        // @ts-ignore
        MyHero.MoveTo(getTarget());
    }

    // 2. СОЮЗНИКИ (Шукаємо через EntityManager, як у робочому варіанті)
    if (FeedAllies.value) {
        const heroes = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero");
        for (const hero of heroes) {
            // Перевіряємо: чи це не ти, чи в твоїй команді та чи є контроль
            // @ts-ignore
            if (hero && hero !== MyHero && hero.IsAlive && hero.TeamNum === MyHero.TeamNum && hero.IsControllable) {
                // @ts-ignore
                hero.MoveTo(getTarget());
            }
        }
    }
});

console.log("Auto Feed: Повернено стабільну версію з союзниками!");
