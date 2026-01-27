import { EventsSDK, Menu } from "github.com/octarine-public/wrapper/index"

// 1. Створюємо вкладку коректною командою
const MyTab = Menu.AddEntry("Денис");

// 2. Додаємо елементи всередину
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);
const AutoAcceptToggle = MyTab.AddToggle("Авто-прийняття гри", true);

// 3. Логіка роботи камери
EventsSDK.on("Update", () => {
    if (CameraSlider) {
        // Тут ми використовуємо глобальний об'єкт камери з чит-ядра
        // @ts-ignore
        if (typeof Camera !== 'undefined') Camera.Distance = CameraSlider.Value;
    }
});

console.log("Скрипт Дениса успішно завантажено з виправленням!");