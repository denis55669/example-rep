import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ С ИКОНКОЙ (Тот самый рабочий вариант) ---
const FeedMenu = Menu.AddEntry("Auto Feed Ultra", "panorama/images/items/travel_boots_png.vtex_c");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); 

// Добавляем Абуз прямо в это же меню
const EnableArmlet = FeedMenu.AddToggle("АБУЗ АРМЛЕТА", false);
const ArmletHP = FeedMenu.AddSlider("Поріг ХП", 100, 500, 260);

// Координаты фонтанов
const RadiantFountain = { x: -7200, y: -6600, z: 384 };
const DireFountain = { x: 7200, y: 6500, z: 384 };

let lastActionTime = 0;
let nextRandomDelay = 5000;
let lastArmletTime = 0;

EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    const currentTime = Date.now();

    // --- 1. ЛОГИКА АБУЗА (Приоритет) ---
    if (EnableArmlet.value && (currentTime - lastArmletTime > 150)) {
        // Проверка баффа из твоего Lua-файла
        // @ts-ignore
        const isActive = MyHero.HasModifier("modifier_item_armlet_unholy_strength");

        if (MyHero.Health < ArmletHP.value && isActive) {
            // @ts-ignore
            const armlet = MyHero.GetItem("item_armlet");
            if (armlet) {
                // Прямой двойной проклик
                // @ts-ignore
                armlet.Cast(); 
                // @ts-ignore
                armlet.Cast();
                lastArmletTime = currentTime;
            }
        }
    }

    // --- 2. ЛОГИКА ФИДА (Твой оригинал) ---
    if (EnableFeed.value) {
        if (currentTime - lastActionTime >= nextRandomDelay) {
            lastActionTime = currentTime;
            
            // Рандомная задержка 4-8 сек
            nextRandomDelay = Math.floor(Math.random() * (8000 - 4000) + 4000);

            const basePos = MySide.value ? RadiantFountain : DireFountain;
            const randomX = basePos.x + (Math.random() * 600 - 300);
            const randomY = basePos.y + (Math.random() * 600 - 300);
            const TargetPos = new Vector3(randomX, randomY, basePos.z);

            // @ts-ignore
            MyHero.MoveTo(TargetPos);
        }
    }
});

console.log("Realistic Feed + Armlet LOADED!");
