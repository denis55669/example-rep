import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Denis V8) ---
const Main = Menu.AddEntry("Denis_V8_Fixed");
const FeedOn = Main.AddToggle("1. ФИД ВКЛ", false);
const SideDire = Main.AddToggle("2. За Dire (ТЬМА)", false); 
const ArmletOn = Main.AddToggle("3. АБУЗ АРМЛЕТА", false);
const ArmletHP = Main.AddSlider("4. Порог ХП", 100, 500, 280);

let lastFeed = 0;
let lastArmlet = 0;
let feedDelay = 5000;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // --- ЛОГИКА АРМЛЕТА (Исправленная под Octarine) ---
    if (ArmletOn.value && (now - lastArmlet > 150)) {
        // @ts-ignore
        const armlet = Me.GetItem("item_armlet");
        if (armlet) {
            // Проверяем, включен ли армлет сейчас (модификатор из твоего Lua)
            // @ts-ignore
            const isToggledOn = Me.HasModifier("modifier_item_armlet_unholy_strength");

            // Если ХП меньше порога и армлет включен — переключаем!
            if (Me.Health < ArmletHP.value && isToggledOn) {
                // @ts-ignore
                armlet.Cast(); // Выключить
                // @ts-ignore
                setTimeout(() => { armlet.Cast(); }, 50); // Включить через 50мс
                lastArmlet = now;
                console.log("Armlet Abused!");
            }
        }
    }

    // --- ТВОЙ РАБОЧИЙ ФИД ---
    if (FeedOn.value && (now - lastFeed > feedDelay)) {
        lastFeed = now;
        feedDelay = Math.floor(Math.random() * (8000 - 4000) + 4000);

        const target = SideDire.value 
            ? new Vector3(-7200 + (Math.random()*600-300), -6600 + (Math.random()*600-300), 384) 
            : new Vector3(7200 + (Math.random()*600-300), 6500 + (Math.random()*600-300), 384);

        // @ts-ignore
        Me.MoveTo(target);
    }
});

console.log("Denis V8: Armlet Fixed & Ready!");
