import { EventsSDK, Menu, GameEntitySystem } from "github.com/octarine-public/wrapper/index"

// 1. Створюємо меню (яке в тебе вже працює)
const MyTab = Menu.AddEntry("Денис");
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);
const AutoArmletToggle = MyTab.AddToggle("Авто-Армлет", true);
const HpSlider = MyTab.AddSlider("ХП для абузу", 200, 800, 450);

EventsSDK.on("Update", () => {
    // Камера
    if (typeof Camera !== 'undefined') {
        // @ts-ignore
        Camera.Distance = CameraSlider.Value;
    }

    // ЛОГІКА АРМЛЕТА
    if (!AutoArmletToggle.Value) return;

    // @ts-ignore
    const me = GameEntitySystem.GetLocalPlayer(); // Спробуємо з великої літери
    
    if (me && me.IsAlive()) {
        // Шукаємо предмет Armlet of Mordiggian
        const armlet = me.GetItemByName("item_armlet", true);
        
        if (armlet && armlet.IsReady()) {
            const currentHp = me.GetHealth();
            const isUnholy = me.HasModifier("modifier_item_armlet_unholy_strength");

            // Якщо ХП менше порогу і немає "льоду" Апарата
            if (currentHp <= HpSlider.Value && !me.HasModifier("modifier_ice_blast")) {
                // Якщо армлет увімкнений — швидко вимикаємо і вмикаємо
                if (isUnholy) {
                    armlet.Cast(); // Off
                    armlet.Cast(); // On
                } else {
                    armlet.Cast(); // Просто вмикаємо, якщо був вимкнений
                }
            }
        }
    }
});

console.log("Скрипт Дениса: Армлет на Z готовий!");
