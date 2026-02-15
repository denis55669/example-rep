import {
    EventsSDK,
    LocalPlayer,
    Menu
} from "github.com/octarine-public/wrapper/index"

// --- СТВОРЮЄМО МЕНЮ ---
const Entry = Menu.AddEntry("Денис")
const CameraSlider = Entry.AddSlider("Дистанція камери", 1200, 2500, 1600)
const AutoArmletToggle = Entry.AddToggle("Авто-Армлет", true)
const HpSlider = Entry.AddSlider("Поріг ХП Армлет", 200, 800, 450)

// --- ОСНОВНИЙ ЦИКЛ ---
EventsSDK.on("PostDataUpdate", () => {
    const MyHero = LocalPlayer?.Hero
    
    // 1. Камера (як на твоїх скрінах)
    if (typeof Camera !== 'undefined') {
        // @ts-ignore
        Camera.Distance = CameraSlider.value
    }

    // 2. Логіка Армлета
    if (!AutoArmletToggle.value || MyHero === undefined || !MyHero.IsAlive) {
        return
    }

    const armlet = MyHero.GetItemByName("item_armlet")
    
    // Перевірка чи предмет готовий і чи це саме Армлет
    if (armlet !== undefined && armlet.CanBeCasted()) {
        const currentHp = MyHero.Health
        const isUnholy = MyHero.HasModifier("modifier_item_armlet_unholy_strength")

        // Якщо ХП впало нижче налаштування в меню
        if (currentHp <= HpSlider.value && !MyHero.HasModifier("modifier_ice_blast")) {
            if (isUnholy) {
                // Швидкий переклик (Вимкнути -> Увімкнути)
                MyHero.CastNoTarget(armlet)
                MyHero.CastNoTarget(armlet)
            } else {
                // Якщо був вимкнений — просто вмикаємо
                MyHero.CastNoTarget(armlet)
            }
        }
    }
})

console.log("Скрипт Дениса успішно завантажено локально!")
