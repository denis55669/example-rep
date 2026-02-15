import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ С ИКОНКОЙ ---
// Второй аргумент — это путь к иконке (обычные сапоги)
const FeedMenu = Menu.AddEntry("Auto Feed Ultra", "panorama/images/items/boots_png.vtex_c");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); 

const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);

let lastActionTime = 0;
const DELAY = 5000; // Фиксированная задержка 5 секунд

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    const currentTime = Date.now();
    if (currentTime - lastActionTime < DELAY) return;
    lastActionTime = currentTime;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    const TargetPosition = MySide.value ? RadiantFountain : DireFountain;

    // @ts-ignore
    MyHero.MoveTo(TargetPosition);
});

console.log("Auto Feed Ultra: Чистый скрипт с иконкой загружен!");
