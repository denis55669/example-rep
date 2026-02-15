import { EventsSDK, Menu, GameEntitySystem } from "github.com/octarine-public/wrapper/index"

// 1. Створюємо меню (Твій робочий варіант)
const MyTab = Menu.AddEntry("Денис");
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);

// 2. Додаємо кнопки Армлета прямо сюди
const AutoArmletToggle = MyTab.AddToggle("Авто-Армлет", true);
const HpSlider = MyTab.AddSlider("ХП для абузу", 200, 600, 400);

EventsSDK.on("Update", () => {
    // Дистанція камери
    if (typeof Camera !== 'undefined') {
        // @ts-ignore
        Camera.Distance = CameraSlider.Value;
    }

    // Логіка Армлета (мінімалістична)
    const me = GameEntitySystem.getLocalPlayer();
    if (me && me.isAlive() && AutoArmletToggle.Value) {
        const armlet = me.getItemByName("item_armlet");
        if (armlet && armlet.isReady()) {
            if (me.getHealth() <= HpSlider.Value && !me.hasModifier("modifier_ice_blast")) {
                armlet.cast(); // Вимкнути/Увімкнути
                if (me.hasModifier("modifier_item_armlet_unholy_strength")) {
                    armlet.cast();
                }
            }
        }
    }
});

console.log("Скрипт Дениса завантажено!");
