import {
    EventsSDK,
    LocalPlayer,
    Menu
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Entry = Menu.AddEntry("Денис")
const AutoArmletToggle = Entry.AddToggle("Авто-Армлет", true)
const HpSlider = Entry.AddSlider("Поріг ХП Армлет", 200, 800, 450)

// --- ЛОГІКА ---
EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero
    
    if (!AutoArmletToggle.value || MyHero === undefined || !MyHero.IsAlive) {
        return
    }

    // Знаходимо Армлет
    const armlet = MyHero.GetItemByName("item_armlet")
    
    if (armlet !== undefined && armlet.CanBeCasted()) {
        const currentHp = MyHero.Health
        const isUnholy = MyHero.HasModifier("modifier_item_armlet_unholy_strength")

        // Якщо ХП менше виставленого в меню
        if (currentHp <= HpSlider.value && !MyHero.HasModifier("modifier_ice_blast")) {
            
            if (isUnholy) {
                // Використовуємо метод Toggle, який ідеальний для Армлета
                // @ts-ignore
                armlet.Toggle() 
                // @ts-ignore
                armlet.Toggle()
            } else {
                // Якщо вимкнений — просто вмикаємо
                // @ts-ignore
                armlet.Toggle()
            }
        }
    }
})

console.log("Скрипт Дениса: Спроба через Toggle()");
