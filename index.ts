import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Denis V7) ---
const Main = Menu.AddEntry("Denis_V7_Elite");
const FeedOn = Main.AddToggle("1. ФИД ВКЛ", false);
const SideDire = Main.AddToggle("2. За Dire (ТЬМА)", false); 
const ArmletOn = Main.AddToggle("3. УМНЫЙ АРМЛЕТ", false);
const ArmletHP = Main.AddSlider("4. Порог ХП", 150, 450, 260);

// База данных опасностей из твоего файла
const DANGER_MODS = [
    "modifier_venomancer_poison_nova", "modifier_queenofpain_shadow_strike",
    "modifier_item_spirit_vessel", "modifier_viper_poison_attack",
    "modifier_pudge_rot", "modifier_huskar_burning_spear",
    "modifier_item_radiance", "modifier_maledict"
];

let lastFeed = 0;
let lastArmlet = 0;
let feedDelay = 5000;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // --- ЛОГИКА АРМЛЕТА (Адаптация из Umbrella Lua) ---
    if (ArmletOn.value && (now - lastArmlet > 130)) {
        // @ts-ignore
        const armlet = Me.GetItem("item_armlet");
        // @ts-ignore
        const isActive = Me.HasModifier("modifier_item_armlet_unholy_strength");
        
        // Проверка на "грязные" дебаффы, которые мешают абузить
        let hasDanger = false;
        for (const mod of DANGER_MODS) {
            // @ts-ignore
            if (Me.HasModifier(mod)) {
                hasDanger = true;
                break;
            }
        }

        if (armlet) {
            // Если ХП мало - абузим
            if (isActive && Me.Health < ArmletHP.value) {
                // Если на нас висит сильный яд, абузить опасно, но мы пробуем максимально быстро
                // @ts-ignore
                armlet.Cast(); 
                // @ts-ignore
                armlet.Cast();
                lastArmlet = now;
            } 
            // Если мы в безопасности и ХП полное - выключаем для регена (как в Safe профиле)
            else if (isActive && Me.Health > (Me.MaxHealth * 0.9) && !hasDanger && !FeedOn.value) {
                // @ts-ignore
                armlet.Cast();
                lastArmlet = now;
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

console.log("Denis V7: Umbrella Logic Integrated!");
