import {
    EventsSDK,
    LocalPlayer,
    Menu
} from "github.com/octarine-public/wrapper/index"

// --- ТВОЄ МЕНЮ ---
const Entry = Menu.AddEntry("Денис")
const AutoArmletToggle = Entry.AddToggle("Авто-Армлет", true)
const HpSlider = Entry.AddSlider("Поріг ХП Армлет", 200, 800, 450)

// --- ЛОГІКА ---
EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero
    
    if (!AutoArmletToggle.value || MyHero === undefined || !MyHero.IsAlive) {
        return
    }

    // Шукаємо Армлет
    const armlet = MyHero.GetItemByName("item_armlet")
    
    if (armlet !== undefined && armlet.CanBeCasted()) {
        const currentHp = MyHero.Health
        const isUnholy = MyHero.HasModifier("modifier_item_armlet_unholy_strength")

        // Якщо ХП нижче порогу з твого меню
        if (currentHp <= HpSlider.value && !MyHero.HasModifier("modifier_ice_blast")) {
            
            // Використовуємо метод Use(), який часто є базовим для перемикання
            if (isUnholy) {
                // @ts-ignore
                armlet.Use() 
                // @ts-ignore
                armlet.Use()
            } else {
                // @ts-ignore
                armlet.Use()
            }
        }
    }
})

console.log("Скрипт Дениса: Спроба через метод Use()");
