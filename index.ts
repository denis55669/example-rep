import { EventsSDK, GameEntitySystem, Menu } from "github.com/octarine-public/wrapper/index"

// 1. Створюємо головну вкладку (як на скріні)
const MyTab = Menu.AddEntry("Денис");

// 2. Додаємо камеру (щоб перевірити, чи працює меню)
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);

// 3. Додаємо налаштування Армлета
const AutoArmletToggle = MyTab.AddToggle("Авто-Армлет", true);
const HpSlider = MyTab.AddSlider("Мінімальне ХП", 200, 600, 400);

const SETTINGS = {
    armletName: "item_armlet",
    unholyModifier: "modifier_item_armlet_unholy_strength",
    iceBlastModifier: "modifier_ice_blast"
};

console.log("Скрипт Дениса (Армлет + Меню) завантажено!");

EventsSDK.on("Update", () => {
    // Логіка камери (як на скріні)
    if (CameraSlider) {
        // @ts-ignore
        if (typeof Camera !== 'undefined') {
            // @ts-ignore
            Camera.Distance = CameraSlider.Value;
        }
    }

    // Логіка Армлета
    const me = GameEntitySystem.getLocalPlayer();
    if (!me || !me.isAlive() || !AutoArmletToggle.Value) return;

    const armlet = me.getItemByName(SETTINGS.armletName);
    if (!armlet || !armlet.isReady()) return;

    const currentHp = me.getHealth();
    const isUnholyActive = me.hasModifier(SETTINGS.unholyModifier);
    const hasIceBlast = me.hasModifier(SETTINGS.iceBlastModifier);

    // Використовуємо значення повзунка HpSlider.Value
    if (!hasIceBlast && currentHp <= HpSlider.Value) {
        if (isUnholyActive) {
            armlet.cast(); // Off
            armlet.cast(); // On
        } else {
            armlet.cast(); // On
        }
    }
});
