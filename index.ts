import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntitySystem
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ З ІКОНКОЮ ---
const FeedMenu = Menu.AddEntry("Auto Feed Ultra", "panorama/images/items/travel_boots_png.vtex_c");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); 

const RadiantFountain = { x: -7200, y: -6600, z: 384 };
const DireFountain = { x: 7200, y: 6500, z: 384 };

let lastActionTime = 0;
let nextRandomDelay = 5000;

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    const currentTime = Date.now();
    if (currentTime - lastActionTime < nextRandomDelay) return;
    lastActionTime = currentTime;
    
    // Рандомна пауза 4-8 сек
    nextRandomDelay = Math.floor(Math.random() * 4000) + 4000;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    const basePos = MySide.value ? RadiantFountain : DireFountain;

    // Функція рандомної точки біля фонтану
    const getTarget = () => {
        return new Vector3(
            basePos.x + (Math.random() * 600 - 300),
            basePos.y + (Math.random() * 600 - 300),
            basePos.z
        );
    };

    // Отримуємо ВСІХ героїв через загальну систему
    const allHeroes = EntitySystem.GetEntitiesList().filter(e => e.IsHero && e.IsAlive);

    for (const hero of allHeroes) {
        // Перевіряємо: чи в твоїй команді та чи ти можеш ним керувати
        // @ts-ignore
        if (hero.TeamNum === MyHero.TeamNum && hero.IsControllable) {
            // @ts-ignore
            hero.MoveTo(getTarget());
        }
    }
});

console.log("Ultra Feed: Спроба через EntityList активована!");
