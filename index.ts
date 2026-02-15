import {
    EventsSDK,
    LocalPlayer,
    Menu
} from "github.com/octarine-public/wrapper/index"

// Малюємо меню (воно у тебе точно працює)
const Entry = Menu.AddEntry("Денис")
const AutoArmletToggle = Entry.AddToggle("Авто-Армлет", true)
const HpSlider = Entry.AddSlider("Поріг ХП Армлет", 200, 800, 450)

EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero
    
    if (!AutoArmletToggle.value || MyHero === undefined || !MyHero.IsAlive) {
        return
    }

    // Шукаємо армлет за точною назвою
    const armlet = MyHero.GetItemByName("item_armlet")
    
    if (armlet !== undefined) {
        const currentHp = MyHero.Health
        const isUnholy = MyHero.HasModifier("modifier_item_armlet_unholy_strength")

        // Якщо ХП менше ніж на повзунку
        if (currentHp <= HpSlider.value && !MyHero.HasModifier("modifier_ice_blast")) {
            
            // Якщо армлет готовий до використання
            if (armlet.CanBeCasted()) {
                // Пряма команда на використання предмета без посередників
                if (isUnholy) {
                    // Абуз: подвійне швидке натискання
                    // @ts-ignore
                    MyHero.CastTargetTree(armlet, undefined) 
                    // @ts-ignore
                    MyHero.CastTargetTree(armlet, undefined)
                } else {
                    // @ts-ignore
                    MyHero.CastTargetTree(armlet, undefined)
                }
            }
        }
    }
})

console.log("Скрипт Дениса: Завантажено через альтернативну логіку")
