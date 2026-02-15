import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Denis V9) ---
const Main = Menu.AddEntry("Denis_V9_Hard");
const FeedOn = Main.AddToggle("1. ФИД ВКЛ", false);
const SideDire = Main.AddToggle("2. За Dire (ТЬМА)", false); 
const ArmletOn = Main.AddToggle("3. АБУЗ АРМЛЕТА", false);
const ArmletHP = Main.AddSlider("4. Порог ХП", 100, 500, 270);

let lastFeed = 0;
let lastArmlet = 0;
let feedDelay = 5000;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // --- ЛОГИКА АРМЛЕТА (Direct Console Command) ---
    if (ArmletOn.value && (now - lastArmlet > 200)) {
        // Проверяем наличие баффа
        // @ts-ignore
        const isToggledOn = Me.HasModifier("modifier_item_armlet_unholy_strength");

        if (Me.Health < ArmletHP.value && isToggledOn) {
            lastArmlet = now;
            
            // Прямой прожим первого слота (item slot 0)
            // Выключаем и включаем через консоль игры
            // @ts-ignore
            EventsSDK.ExecuteCommand("dota_item_execute 0"); 
            // @ts-ignore
            setTimeout(() => { EventsSDK.ExecuteCommand("dota_item_execute 0"); }, 30);
            
            console.log("!!! ARMLET FORCE TOGGLE !!!");
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

console.log("Denis V9: Hard Console Mode Loaded!");
