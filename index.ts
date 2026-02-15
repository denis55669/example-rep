import { EventsSDK, GameEntitySystem, Input, Menu } from "github.com/octarine-public/wrapper/index"

// --- Створення МЕНЮ (як на твоїх скріншотах) ---
// Створюємо головну вкладку в меню
const MyTab = Menu.AddEntry("Денис");

// Додаємо перемикач для авто-армлета
const AutoArmletToggle = MyTab.AddToggle("Авто-Армлет", true);

// Додаємо повзунок для вибору мінімального ХП
const HpSlider = MyTab.AddSlider("Мінімальне ХП", 200, 600, 400);

// Додаємо повзунок камери (як у твоєму прикладі)
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1200);

const SETTINGS = {
    armletName: "item_armlet",
    unholyModifier: "modifier_item_armlet_unholy_strength",
    iceBlastModifier: "modifier_ice_blast"
};

console.log("Скрипт Дениса (Армлет + Меню) успішно завантажено!");

EventsSDK.on("GameTick", () => {
    // Логіка дистанції камери
    if (typeof Camera !== 'undefined') {
        // @ts-ignore
        Camera.Distance = CameraSlider.Value;
    }

    const me = GameEntitySystem.getLocalPlayer();
    if (!me || !me.isAlive() || me.isStunned()) return;

    // Перевіряємо, чи ввімкнено скрипт у меню
    if (!AutoArmletToggle.Value) return;

    const armlet = me.getItemByName(SETTINGS.armletName);
    if (!armlet || !armlet.isReady()) return;

    const currentHp = me.getHealth();
    const hasIceBlast = me.hasModifier(SETTINGS.iceBlastModifier);
    const isUnholyActive = me.hasModifier(SETTINGS.unholyModifier);

    // Використовуємо значення з повзунка ХП
    if (!hasIceBlast && currentHp <= HpSlider.Value) {
        if (isUnholyActive) {
            armlet.cast(); // Off
            armlet.cast(); // On
            console.log(`[Armlet] Абуз на ${currentHp} HP`);
        } else {
            armlet.cast(); // Просто вмикаємо
        }
    }
});
