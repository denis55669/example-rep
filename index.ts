import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// Малюємо меню з іконкою
const FeedMenu = Menu.AddEntry("Auto Feed Ultra", "panorama/images/items/travel_boots_png.vtex_c");
const EnableFeed = FeedMenu.AddToggle("УВІМКНУТИ ФІД", false);
const MySide = FeedMenu.AddToggle("Я за ТЬМУ (Dire)", false); 

const RadiantFountain = new Vector3(-7200, -6600, 384);
const DireFountain = new Vector3(7200, 6500, 384);

let lastActionTime = 0;

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableFeed.value) return;

    const currentTime = Date.now();
    // Стабільна затримка 5 секунд
    if (currentTime - lastActionTime < 5000) return;
    lastActionTime = currentTime;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero) return;

    const TargetPos = MySide.value ? RadiantFountain : DireFountain;

    // 1. Рухаємо свого героя (Оригінальний метод, що працював)
    if (MyHero.IsAlive) {
        // @ts-ignore
        MyHero.MoveTo(TargetPos);
    }

    // 2. Рухаємо союзників (Найпростіший метод через EntityManager)
    const allEntities = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero");
    for (const ent of allEntities) {
        // Якщо це герой, він живий і ТИ можеш ним керувати
        // @ts-ignore
        if (ent && ent.IsAlive && ent.IsControllable) {
            // @ts-ignore
            ent.MoveTo(TargetPos);
        }
    }
});

console.log("Back to Basics: Фід активовано.");
import {
    EventsSDK,
    LocalPlayer,
    Menu,
    EntitySystem
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const ArmletMenu = Menu.AddEntry("Armlet God");
const EnableScript = ArmletMenu.AddToggle("Включить Абуз", true);
// Ползунок: При каком ХП переключать (от 100 до 1000, по умолчанию 300)
const MinHP = ArmletMenu.AddSlider("Мин. здоровье для абуза", 100, 1000, 300);

let lastToggleTime = 0;
const TOGGLE_COOLDOWN = 200; // Задержка в мс, чтобы не крашнуть сервер спамом

EventsSDK.on("PostDataUpdate", () => {
    if (!EnableScript.value) return;

    const MyHero = LocalPlayer?.Hero;
    if (!MyHero || !MyHero.IsAlive) return;

    // Ищем Армлет в инвентаре
    // @ts-ignore
    const armlet = MyHero.GetItem("item_armlet");
    if (!armlet) return; // Если армлета нет, скрипт спит

    // Проверяем текущее время для кулдауна
    const now = Date.now();
    if (now - lastToggleTime < TOGGLE_COOLDOWN) return;

    // --- ЛОГИКА АБУЗА ---
    // 1. Проверяем, включен ли Армлет (ищем бафф на герое)
    // @ts-ignore
    const isArmletActive = MyHero.HasModifier("modifier_item_armlet_unholy_strength");

    // 2. Если Армлет включен И здоровье ниже порога
    // @ts-ignore
    if (isArmletActive && MyHero.Health < MinHP.value) {
        
        // Магия Xeon: Делаем двойной каст моментально [cite: 2025-10-12]
        
        // 1. Выключаем
        // @ts-ignore
        armlet.Cast();
        
        // 2. Включаем (сразу же, в том же тике или следующем)
        // @ts-ignore
        armlet.Cast();

        lastToggleTime = now;
        console.log(`Armlet God: Спасено на ${MyHero.Health} HP!`);
    }
});

console.log("Armlet God загружен. Купи Armlet и живи вечно!");
