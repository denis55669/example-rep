import {
    EventsSDK,
    LocalPlayer,
    Menu
} from "github.com/octarine-public/wrapper/index"

// --- ТВОЄ РОБОЧЕ МЕНЮ ---
const MyTab = Menu.AddEntry("Денис");
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);
const AutoArmletToggle = MyTab.AddToggle("Авто-Армлет", true);
const HpSlider = MyTab.AddSlider("Поріг ХП Армлет", 200, 800, 450);

// --- ЛОГІКА АБУЗУ (як у MK Catcher) ---
EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero;
    
    // 1. Камера
    if (typeof Camera !== 'undefined') {
        // @ts-ignore
        Camera.Distance = CameraSlider.Value;
    }

    // 2. Армлет
    if (!AutoArmletToggle.value || MyHero === undefined || !MyHero.IsAlive) {
        return;
    }

    const armlet = MyHero.GetItemByName("item_armlet");
    if (armlet === undefined || !armlet.CanBeCasted()) {
        return;
    }

    const currentHp = MyHero.Health;
    const isUnholy = MyHero.HasModifier("modifier_item_armlet_unholy_strength");

    // Перевірка порогу ХП
    if (currentHp <= HpSlider.value && !MyHero.HasModifier("modifier_ice_blast")) {
        if (isUnholy) {
            // Швидкий абуз: вимкнути і ввімкнути
            MyHero.CastNoTarget(armlet);
            MyHero.CastNoTarget(armlet);
        } else {
            // Просто ввімкнути
            MyHero.CastNoTarget(armlet);
        }
    }
});

console.log("Скрипт Дениса: Армлет адаптовано під твій Octarine!");
