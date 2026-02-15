import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ З ІКОНКОЮ (Як було раніше) ---
const FeedMenu = Menu.AddEntry("Auto Feed Ultra", "panorama/images/items/travel_boots_png.vtex_c");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); 

// Базові координати фонтанів
const RadiantFountain = { x: -7200, y: -6600, z: 384 };
const DireFountain = { x: 7200, y: 6500, z: 384 };

let lastActionTime = 0;
let nextRandomDelay = 5000; // Початкова затримка

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    const currentTime = Date.now();
    if (currentTime - lastActionTime < nextRandomDelay) return;
    
    // Оновлюємо час останньої дії
    lastActionTime = currentTime;
    
    // ГЕНЕРУЄМО ВИПАДКОВУ ЗАТРИМКУ (від 4000 до 8000 мс)
    nextRandomDelay = Math.floor(Math.random() * (8000 - 4000) + 4000);

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    // ВИБИРАЄМО ВИПАДКОВУ ТОЧКУ В РАДІУСІ 300 ОДИНИЦЬ ВІД ФОНТАНУ
    const basePos = MySide.value ? RadiantFountain : DireFountain;
    const randomX = basePos.x + (Math.random() * 600 - 300);
    const randomY = basePos.y + (Math.random() * 600 - 300);
    const TargetPos = new Vector3(randomX, randomY, basePos.z);

    // Робимо клік
    // @ts-ignore
    MyHero.MoveTo(TargetPos);
});

console.log("Realistic Feed завантажено. Тільки фід, нічого зайвого!");
