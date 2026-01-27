import { EventsSDK, Menu } from "github.com/octarine-public/wrapper/index"

// 1. Створюємо вкладку в меню
const MyTab = Menu.AddTab("Денис");

// 2. Додаємо елементи керування
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);
const AutoAcceptToggle = MyTab.AddToggle("Авто-прийняття гри", true);

// 3. Логіка, яка працює в реальному часі
EventsSDK.on("Update", () => {
    // Збільшуємо камеру, якщо рухаємо повзунок
    if (CameraSlider) {
        Camera.Distance = CameraSlider.Value;
    }
});

// Логіка для подій (з твого дампу gameevents_dump.txt)
EventsSDK.on("game_rules_state_change", () => {
    if (AutoAcceptToggle.Value) {
        console.log("Стан гри змінено — скрипт Дениса бачить це!");
    }
});

console.log("Скрипт завантажено! Перевір вкладку 'Денис' у меню.");