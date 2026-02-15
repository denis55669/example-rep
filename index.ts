import { EventsSDK, Menu } from "github.com/octarine-public/wrapper/index"

// 1. Створюємо головну вкладку "Денис"
const MyTab = Menu.AddEntry("Денис");

// 2. Додаємо Камеру і Авто-прийняття (це в тебе працювало)
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);
const AutoAcceptToggle = MyTab.AddToggle("Авто-прийняття", true);

// 3. Додаємо кнопки для Армлета (Візуальна частина)
const AutoArmletToggle = MyTab.AddToggle("Авто-Армлет", true);
const HpSlider = MyTab.AddSlider("Поріг ХП Армлет", 200, 800, 450);

// Основна функція
EventsSDK.on("Update", () => {
    // Логіка камери (працює)
    if (CameraSlider) {
        // @ts-ignore
        if (typeof Camera !== 'undefined') {
            // @ts-ignore
            Camera.Distance = CameraSlider.Value;
        }
    }

    // ТУТ БУДЕ ЛОГІКА АРМЛЕТА
    // Ми підключимо її, як тільки дізнаємося, як правильно називається імпорт у твоїй версії
});

console.log("Скрипт Дениса (Меню) завантажено!");
