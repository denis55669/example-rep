import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ С ИКОНКОЙ ---
const FeedMenu = Menu.AddEntry("Auto Feed Ultra", "panorama/images/items/travel_boots_png.vtex_c");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); 
const FeedAllies = FeedMenu.AddToggle("Фідити союзниками (Shared/Leavers)", true);

// Базовые координаты фонтанов
const RadiantFountain = { x: -7200, y: -6600, z: 384 };
const DireFountain = { x: 7200, y: 6500, z: 384 };

let lastActionTime = 0;
let nextRandomDelay = 5000;

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    const currentTime = Date.now();
    if (currentTime - lastActionTime < nextRandomDelay) return;
    
    lastActionTime = currentTime;
    
    // Рандомная пауза от 4 до 8 секунд для беспалевности
    nextRandomDelay = Math.floor(Math.random() * (8000 - 4000) + 4000);

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    const basePos = MySide.value ? RadiantFountain : DireFountain;

    // Функция для получения случайной точки рядом с фонтаном
    const getRandomTarget = () => {
        const randomX = basePos.x + (Math.random() * 600 - 300);
        const randomY = basePos.y + (Math.random() * 600 - 300);
        return new Vector3(randomX, randomY, basePos.z);
    };

    // 1. ФИДИМ СВОИМ ГЕРОЕМ
    if (MyHero.IsAlive) {
        // @ts-ignore
        MyHero.MoveTo(getRandomTarget());
    }

    // 2. ФИДИМ ПОДКОНТРОЛЬНЫМИ СОЮЗНИКАМИ
    if (FeedAllies.value) {
        const heroes = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero");
        for (const hero of heroes) {
            // @ts-ignore
            if (hero && hero !== MyHero && hero.IsAlive && hero.IsControllable) {
                // @ts-ignore
                hero.MoveTo(getRandomTarget());
            }
        }
    }
});

console.log("Realistic Ally Feed загружен! Рандомные точки и задержки активны.");
