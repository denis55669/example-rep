import { EventsSDK, Menu, GameEntitySystem } from "github.com/octarine-public/wrapper/index"

// Створюємо головну вкладку в меню
const MyTab = Menu.AddEntry("Денис");

// Додаємо повзунок камери (мін: 1200, макс: 2500, стандарт: 1600)
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);

// Твої нові кнопки для Армлета
const AutoArmletToggle = MyTab.AddToggle("Авто-Армлет", true);
const HpSlider = MyTab.AddSlider("Мінімальне ХП", 200, 600, 400);

// Функція, яка працює в реальному часі
EventsSDK.on("Update", () => {
    // Логіка камери
    if (CameraSlider) {
        // @ts-ignore
        if (typeof Camera !== 'undefined') {
            // @ts-ignore
            Camera.Distance = CameraSlider.Value;
        }
    }

    // Логіка Армлета
    const me = GameEntitySystem.getLocalPlayer();
    if (me && me.isAlive() && AutoArmletToggle.Value) {
        const armlet = me.getItemByName("item_armlet");
        if (armlet && armlet.isReady()) {
            const currentHp = me.getHealth();
            const isUnholy = me.hasModifier("modifier_item_armlet_unholy_strength");
            const hasIceBlast = me.hasModifier("modifier_ice_blast");

            if (!hasIceBlast && currentHp <= HpSlider.Value) {
                if (isUnholy) {
                    armlet.cast(); // Вимкнути
                    armlet.cast(); // Увімкнути
                } else {
                    armlet.cast(); // Просто увімкнути
                }
            }
        }
    }
});

console.log("Скрипт Дениса успішно завантажено!");
