import { EventsSDK, Menu } from "github.com/octarine-public/wrapper/index"

// --- ТВОЄ РОБОЧЕ МЕНЮ ---
const MyTab = Menu.AddEntry("Денис");
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);
const AutoAcceptToggle = MyTab.AddToggle("Авто-прийняття", true);
const AutoArmletToggle = MyTab.AddToggle("Авто-Армлет", true);
const HpSlider = MyTab.AddSlider("Поріг ХП Армлет", 200, 800, 450);

// --- ЛОГІКА ---
EventsSDK.on("Update", () => {
    // 1. Камера
    if (typeof Camera !== 'undefined') {
        // @ts-ignore
        Camera.Distance = CameraSlider.Value;
    }

    // 2. Абуз Армлета
    // @ts-ignore
    const me = GameEntitySystem.getLocalPlayer(); // Беремо гравця

    if (me && AutoArmletToggle.Value) {
        // @ts-ignore
        if (me.IsAlive()) { // Перевіряємо чи живий
            const armlet = me.getItemByName("item_armlet");
            
            if (armlet && armlet.isReady()) {
                // @ts-ignore
                const currentHp = me.Health; // Отримуємо ХП
                
                // Якщо ХП мало і немає ульти Апарата
                if (currentHp <= HpSlider.Value && !me.hasModifier("modifier_ice_blast")) {
                    armlet.cast(); // Вимкнути
                    
                    // Якщо він був увімкнений (Unholy Strength), вмикаємо назад миттєво
                    if (me.hasModifier("modifier_item_armlet_unholy_strength")) {
                        armlet.cast(); // Увімкнути
                    }
                }
            }
        }
    }
});

console.log("Скрипт Дениса: Меню + Армлет працюють!");
