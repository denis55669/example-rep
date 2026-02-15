import {
    EventsSDK,
    LocalPlayer,
    Menu
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Только Армлет) ---
const Entry = Menu.AddEntry("Денис")
const AutoArmletToggle = Entry.AddToggle("Авто-Армлет", true)
const HpSlider = Entry.AddSlider("Поріг ХП Армлет", 200, 800, 450)

// --- ЛОГІКА ---
EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero
    
    // Если выключено, герой мертв или это не твой герой — ничего не делаем
    if (!AutoArmletToggle.value || MyHero === undefined || !MyHero.IsAlive) {
        return
    }

    // Ищем Армлет
    const armlet = MyHero.GetItemByName("item_armlet")
    
    if (armlet !== undefined && armlet.CanBeCasted()) {
        const currentHp = MyHero.Health
        const isUnholy = MyHero.HasModifier("modifier_item_armlet_unholy_strength")

        // Абуз при низком ХП (по значению ползунка)
        if (currentHp <= HpSlider.value && !MyHero.HasModifier("modifier_ice_blast")) {
            if (isUnholy) {
                // Выключаем и включаем (Double Cast)
                MyHero.CastNoTarget(armlet)
                MyHero.CastNoTarget(armlet)
            } else {
                // Если был выключен — просто включаем
                MyHero.CastNoTarget(armlet)
            }
        }
    }
})

console.log("Скрипт Дениса: Камера удалена, Армлет готов!");
