import { EventsSDK, Menu, GameEntitySystem } from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Твоє, робоче) ---
const MyTab = Menu.AddEntry("Денис");

// Камера і Авто-прийняття
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);
const AutoAcceptToggle = MyTab.AddToggle("Авто-прийняття", true);

// --- ДОДАЄМО АРМЛЕТ СЮДИ ---
const AutoArmletToggle = MyTab.AddToggle("Авто-Армлет", true);
const HpSlider = MyTab.AddSlider("Поріг ХП", 200, 800, 450);

// --- ЛОГІКА ---
EventsSDK.on("Update", () => {
    // 1. Камера (Твій код)
    if (CameraSlider) {
        // @ts-ignore
        if (typeof Camera !== 'undefined') {
            // @ts-ignore
            Camera.Distance = CameraSlider.Value;
        }
    }

    // 2. Армлет (Додаємо перевірку)
    const me = GameEntitySystem.getLocalPlayer();
    
    // Перевіряємо: чи увімкнено в меню, чи живий герой
    if (me && me.isAlive() && AutoArmletToggle.Value) {
        const armlet = me.getItemByName("item_armlet");
        
        // Якщо армлет є і готовий до використання
        if (armlet && armlet.isReady()) {
            const hp = me.getHealth();
            // Якщо ХП менше, ніж виставлено на повзунку
            if (hp <= HpSlider.Value && !me.hasModifier("modifier_ice_blast")) {
                 armlet.cast(); // Клацаємо
            }
        }
    }
});

console.log("Скрипт Дениса (Full) успішно завантажено!");
