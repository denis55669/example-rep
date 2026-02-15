import { EventsSDK, GameEntitySystem, Menu } from "github.com/octarine-public/wrapper/index"

// 1. Створюємо головну вкладку в меню "Денис"
const MyTab = Menu.AddEntry("Денис");

// 2. Додаємо елементи керування (як на скриншоті)
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);
const AutoArmletToggle = MyTab.AddToggle("Авто-Армлет", true);
const HpSlider = MyTab.AddSlider("Мінімальне ХП для абузу", 200, 600, 400);

const SETTINGS = {
    armletName: "item_armlet",
    unholyModifier: "modifier_item_armlet_unholy_strength",
    iceBlastModifier: "modifier_ice_blast"
};

console.log("Скрипт Дениса (Армлет + Меню) завантажено!");

// Основний цикл скрипта
EventsSDK.on("Update", () => {
    // --- Логіка Камери ---
    if (CameraSlider) {
        // @ts-ignore
        if (typeof Camera !== 'undefined') {
            // @ts-ignore
            Camera.Distance = CameraSlider.Value;
        }
    }

    // --- Логіка Авто-Армлета ---
    const me = GameEntitySystem.getLocalPlayer();
    
    // Перевірки: чи ввімкнено в меню, чи живий герой
    if (!AutoArmletToggle.Value || !me || !me.isAlive() || me.isStunned()) return;

    const armlet = me.getItemByName(SETTINGS.armletName);
    if (!armlet || !armlet.isReady()) return;

    const currentHp = me.getHealth();
    const hasIceBlast = me.hasModifier(SETTINGS.iceBlastModifier);
    const isUnholyActive = me.hasModifier(SETTINGS.unholyModifier);

    // Логіка абузу: якщо ХП менше ніж на повзунку в меню і немає ульти Апарата
    if (!hasIceBlast && currentHp <= HpSlider.Value) {
        if (isUnholyActive) {
            armlet.cast(); // Вимкнути
            armlet.cast(); // Увімкнути
            console.log(`[Armlet] Абуз виконано на ${currentHp} HP`);
        } else {
            armlet.cast(); // Просто увімкнути, якщо був вимкнений
        }
    }
});
