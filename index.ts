import { EventsSDK, Menu } from "github.com/octarine-public/wrapper/index"

// Створюємо головну вкладку в меню
const MyTab = Menu.AddEntry("Денис");

// Додаємо повзунок камери (мін: 1200, макс: 2500, стандарт: 1600)
const CameraSlider = MyTab.AddSlider("Дистанція камери", 1200, 2500, 1600);

// Додаємо перемикач
const AutoAcceptToggle = MyTab.AddToggle("Авто-прийняття", true);

// Функція, яка працює в реальному часі
EventsSDK.on("Update", () => {
    if (CameraSlider) {
        // @ts-ignore
        if (typeof Camera !== 'undefined') {
            // @ts-ignore
            Camera.Distance = CameraSlider.Value;
        }
    }
});

console.log("Скрипт Дениса успішно завантажено!");
