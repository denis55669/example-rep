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
    
    // Перевірки
    if (!AutoArmletToggle.value || MyHero === undefined || !MyHero.IsAlive) {
        return
    }

    // Шукаємо армлет
    const armlet = MyHero.GetItemByName("item_armlet")
    
    if (armlet !== undefined && armlet.CanBeCasted()) {
        const currentHp = MyHero.Health
        const isUnholy = MyHero.HasModifier("modifier_item_armlet_unholy_strength")

        // Якщо ХП впало і немає апарата
        if (currentHp <= HpSlider.value && !MyHero.HasModifier("modifier_ice_blast")) {
            
            if (isUnholy) {
                // Використовуємо метод castNoTarget (з маленької) або CastNoTarget (з великої)
                // Спробуємо через загальну команду героя
                MyHero.CastNoTarget(armlet)
                MyHero.CastNoTarget(armlet)
            } else {
                MyHero.CastNoTarget(armlet)
            }
        }
    }
})

console.log("Скрипт Дениса: Спроба через CastNoTarget");
