import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3
} from "github.com/octarine-public/wrapper/index"

// --- ПЛАСКЕ МЕНЮ (Без вкладень, щоб не лагало) ---
const Main = Menu.AddEntry("Denis_V5"); // Тільки одна папка

// Пункти йдуть один за одним
const FeedOn = Main.AddToggle("1. УВІМКНУТИ ФІД", false);
const SideDire = Main.AddToggle("2. Фід за DIRE", false); 
const ArmletOn = Main.AddToggle("3. Увімкнути АРМЛЕТ", false);
const ArmletHP = Main.AddSlider("4. Поріг ХП", 150, 450, 250);

// Базові дані
const RadiantFountain = { x: -7200, y: -6600, z: 384 };
const DireFountain = { x: 7200, y: 6500, z: 384 };
let lastFeed = 0;
let lastArmlet = 0;
let feedDelay = 5000;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // --- АРМЛЕТ АБУЗ ---
    if (ArmletOn.value && (now - lastArmlet > 140)) {
        // @ts-ignore
        const item = Me.GetItem("item_armlet");
        // @ts-ignore
        const active = Me.HasModifier("modifier_item_armlet_unholy_strength");
        
        if (item && active && Me.Health < ArmletHP.value) {
            // @ts-ignore
            item.Cast(); item.Cast();
            lastArmlet = now;
        }
    }

    // --- ТВІЙ РОБОЧИЙ ФІД ---
    if (FeedOn.value && (now - lastFeed > feedDelay)) {
        lastFeed = now;
        feedDelay = Math.floor(Math.random() * (8000 - 4000) + 4000);

        const base = SideDire.value ? RadiantFountain : DireFountain;
        const target = new Vector3(
            base.x + (Math.random() * 600 - 300),
            base.y + (Math.random() * 600 - 300),
            base.z
        );

        // @ts-ignore
        Me.MoveTo(target);
    }
});

console.log("Denis V5: Flat Menu Loaded!");
