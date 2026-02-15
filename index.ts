import { EventsSDK, Menu, GameEntitySystem } from "github.com/octarine-public/wrapper/index"

// 1. Створюємо вкладку "Денис"
const MyTab = Menu.AddEntry("Денис");

// 2. Додаємо твої елементи (камера + армлет)
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);
const AutoArmletToggle = MyTab.AddToggle("Авто-Армлет", true);
const HpSlider = MyTab.AddSlider("ХП для абузу", 200, 600, 400);

// 3. Основна функція
EventsSDK.on("Update", () => {
    // Камера (твій робочий код)
    if (typeof Camera !== 'undefined') {
        // @ts-ignore
        Camera.Distance = CameraSlider.Value;
    }

    // Логіка Армлета (спрощена, щоб не було помилок)
    const me = GameEntitySystem.getLocalPlayer();
    if (me && AutoArmletToggle.Value) {
        const armlet = me.getItemByName("item_armlet");
        if (armlet && armlet.isReady()) {
            // Отримуємо ХП через властивість Health (як у багатьох версіях враппера)
            // @ts-ignore
            const myHp = me.Health || 0; 
            
            if (myHp > 0 && myHp <= HpSlider.Value) {
                armlet.cast(); // Перемикаємо
            }
        }
    }
});

console.log("Скрипт Дениса успішно завантажено!");
