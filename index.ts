import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Input // Додаємо систему вводу
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (як на твому скріні) ---
const Entry = Menu.AddEntry("Денис")
const AutoArmletToggle = Entry.AddToggle("Авто-Армлет", true)
const HpSlider = Entry.AddSlider("Поріг ХП Армлет", 200, 800, 450)

// --- ЛОГІКА ---
EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero
    
    if (!AutoArmletToggle.value || MyHero === undefined || !MyHero.IsAlive) {
        return
    }

    const armlet = MyHero.GetItemByName("item_armlet")
    
    if (armlet !== undefined) {
        const currentHp = MyHero.Health
        const isUnholy = MyHero.HasModifier("modifier_item_armlet_unholy_strength")

        // Якщо ХП менше порогу
        if (currentHp <= HpSlider.value && !MyHero.HasModifier("modifier_ice_blast")) {
            
            // Натискаємо клавішу Z (код клавіші 90)
            if (isUnholy) {
                // Швидкий подвійний клік по кнопці Z
                Input.ExecuteCommand("bind z"); 
                Input.ExecuteCommand("bind z");
            } else {
                Input.ExecuteCommand("bind z");
            }
        }
    }
})

console.log("Скрипт Дениса: Спроба через емуляцію кнопки Z");
