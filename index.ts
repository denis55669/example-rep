import { EventsSDK, GameEntitySystem, Input, Menu } from "github.com/octarine-public/wrapper/index"

// --- Створення візуального меню ---
// Створюємо головну вкладку з назвою "Денис"
const MyTab = Menu.AddEntry("Денис");

// Додаємо повзунок для дистанції камери
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);

// Додаємо перемикач для авто-армлета
const AutoArmletToggle = MyTab.AddToggle("Авто-Армлет", true);

// Додаємо повзунок для мінімального ХП
const HpSlider = MyTab.AddSlider("Мінімальне ХП", 200, 600, 400);

const SETTINGS = {
    armletName: "item_armlet",
    unholyModifier: "modifier_item_armlet_unholy_strength",
    iceBlastModifier: "modifier_ice_blast"
};

console.log("Скрипт Дениса успішно завантажено!");

// Функція, яка працює в реальному часі
EventsSDK.on("Update", () => {
    // 1. Логіка дистанції камери
    if (CameraSlider) {
        // @ts-ignore
        if (typeof Camera !== 'undefined') {
            // @ts-ignore
            Camera.Distance = CameraSlider.Value;
        }
    }

    // 2. Логіка Авто-Армлета
    const me = GameEntitySystem.getLocalPlayer();
    if (!me || !me.isAlive() || me.isStunned()) return;

    // Перевіряємо, чи ввімкнено функцію в меню
    if (!AutoArmletToggle.Value) return;

    const armlet = me.getItemByName(SETTINGS.armletName);
    if (!armlet || !armlet.isReady()) return;

    const currentHp = me.getHealth();
    const hasIceBlast = me.hasModifier(SETTINGS.iceBlastModifier);
    const isUnholyActive = me.hasModifier(SETTINGS.unholyModifier);

    // Абуз армлета, якщо ХП менше значення на повзунку
    if (!hasIceBlast && currentHp <= HpSlider.Value) {
        if (isUnholyActive) {
            armlet.cast(); // Вимкнути
            armlet.cast(); // Увімкнути
            console.log(`[Armlet] Перемикання на ${currentHp} HP`);
        } else {
            armlet.cast(); // Просто увімкнути
        }
    }
});
