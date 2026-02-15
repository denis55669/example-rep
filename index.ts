import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Чисте та робоче) ---
const FeedMenu = Menu.AddEntry("Auto Feed Ultra", "panorama/images/items/travel_boots_png.vtex_c");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); 

const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);

let lastActionTime = 0;

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    const currentTime = Date.now();
    // Використовуємо 6 секунд для стабільності на Xeon [cite: 2025-10-12]
    if (currentTime - lastActionTime < 6000) return;
    lastActionTime = currentTime;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    const Target = MySide.value ? RadiantFountain : DireFountain;

    // --- ГОЛОВНИЙ МЕТОД: Команда всім підконтрольним ---
    // Замість перебору масивів, ми кажемо читу: "Всі, ким я керую - йдіть туди"
    try {
        // Отримуємо список усіх юнітів, якими ти володієш (включаючи ліверів)
        // @ts-ignore
        const myUnits = LocalPlayer.GetPlayer().GetControllableUnits();
        
        for (const unit of myUnits) {
            // Фільтруємо, щоб це були саме герої (або кур'єри, якщо хочеш)
            // @ts-ignore
            if (unit && unit.IsAlive && (unit.IsHero || unit.IsCourier)) {
                // @ts-ignore
                unit.MoveTo(Target);
            }
        }
    } catch (e) {
        // Якщо GetControllableUnits не працює, пробуємо запасний варіант через Selection
        // @ts-ignore
        const selected = LocalPlayer.GetSelection();
        for (const entity of selected) {
            // @ts-ignore
            if (entity && entity.IsAlive) {
                // @ts-ignore
                entity.MoveTo(Target);
            }
        }
    }
});

console.log("Deep Thought Feed: Використовуємо систему Player Units.");
