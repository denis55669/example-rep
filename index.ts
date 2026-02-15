import { EventsSDK, Menu } from "github.com/octarine-public/wrapper/index"

// 1. Твоє робоче меню
const MyTab = Menu.AddEntry("Денис");
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);
const AutoAcceptToggle = MyTab.AddToggle("Авто-прийняття", true);
const AutoArmletToggle = MyTab.AddToggle("Авто-Армлет", true);
const HpSlider = MyTab.AddSlider("ХП для абузу", 200, 800, 450);

// 2. Функція, яка точно працює
EventsSDK.on("Update", () => {
    // Камера (твій робочий код)
    // @ts-ignore
    if (typeof Camera !== 'undefined') {
        // @ts-ignore
        Camera.Distance = CameraSlider.Value;
    }

    // ЛОГІКА АРМЛЕТА (без зайвих імпортів)
    if (AutoArmletToggle.Value) {
        // @ts-ignore
        const me = GameEntitySystem.getLocalPlayer(); 
        
        if (me && me.isAlive()) {
            const armlet = me.getItemByName("item_armlet");
            
            if (armlet && armlet.isReady()) {
                const currentHp = me.getHealth();
                const isUnholy = me.hasModifier("modifier_item_armlet_unholy_strength");

                // Перевірка ХП по повзунку
                if (currentHp <= HpSlider.Value && !me.hasModifier("modifier_ice_blast")) {
                    if (isUnholy) {
                        armlet.cast(); // Вимкнути
                        armlet.cast(); // Увімкнути
                    } else {
                        armlet.cast(); // Просто увімкнути
                    }
                }
            }
        }
    }
});

console.log("Скрипт Дениса: Меню повернулося і Армлет налаштований!");
