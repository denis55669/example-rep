import {
    EventsSDK,
    LocalPlayer,
    Menu
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ ---
const Entry = Menu.AddEntry("Денис")
const AutoArmletToggle = Entry.AddToggle("Авто-Армлет", true)
const HpSlider = Entry.AddSlider("Поріг ХП Армлет", 200, 800, 450)

// --- ЛОГИКА ---
EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero
    
    // Базовые проверки
    if (!AutoArmletToggle.value || MyHero === undefined || !MyHero.IsAlive) {
        return
    }

    // Ищем армлет во всех слотах
    const armlet = MyHero.GetItemByName("item_armlet")
    
    if (armlet !== undefined && armlet.CanBeCasted()) {
        const currentHp = MyHero.Health
        // Проверяем включен ли он (Unholy Strength)
        const isUnholy = MyHero.HasModifier("modifier_item_armlet_unholy_strength")

        // Если ХП меньше порога и нет дебаффа Аппарата
        if (currentHp <= HpSlider.value && !MyHero.HasModifier("modifier_ice_blast")) {
            
            // Если включен — выключаем и включаем заново (абуз)
            if (isUnholy) {
                // Пытаемся использовать метод Cast() напрямую, если CastNoTarget не сработал
                // @ts-ignore
                armlet.Cast() 
                // @ts-ignore
                armlet.Cast()
            } else {
                // Если был выключен — просто включаем
                // @ts-ignore
                armlet.Cast()
            }
        }
    }
})

console.log("Скрипт Дениса: Попытка №2 (Direct Cast)");
