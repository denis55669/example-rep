import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// --- МЕНЮ (Змінив назву, щоб уникнути конфліктів) ---
const XMenu = Menu.AddEntry("Denis_Cheat_V3"); 

const FeedEn = XMenu.AddToggle("RUN TO FEED", false);
const SideDire = XMenu.AddToggle("Target: DIRE", false); 
const AllyFeed = XMenu.AddToggle("Move Allies", true);

const ArmletEn = XMenu.AddToggle("Auto Armlet", false);
// Використовуємо список, щоб не було "стрибків" слайдера
const ArmletHP = XMenu.AddList("Armlet HP", ["150", "200", "250", "300", "350"], 2);

let lastF = 0;
let lastA = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();

    // 1. ЛОГІКА АРМЛЕТА
    if (ArmletEn.value && (now - lastA > 150)) {
        const vals = [150, 200, 250, 300, 350];
        const threshold = vals[ArmletHP.value]; // Беремо число зі списку
        
        // @ts-ignore
        const armlet = Me.GetItem("item_armlet");
        // @ts-ignore
        if (armlet && Me.Health < threshold && Me.HasModifier("modifier_item_armlet_unholy_strength")) {
            // @ts-ignore
            armlet.Cast(); armlet.Cast(); 
            lastA = now;
        }
    }

    // 2. ЛОГІКА ФІДУ (Примусова команда кожні 3 сек)
    if (FeedEn.value && (now - lastF > 3000)) {
        lastF = now;
        
        const pos = SideDire.value 
            ? new Vector3(7200, 6500, 384) 
            : new Vector3(-7200, -6600, 384);

        // ПРЯМА КОМАНДА (обхід Humanizer)
        // @ts-ignore
        Me.MoveTo(pos);

        if (AllyFeed.value) {
            const ents = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero");
            for (const h of ents) {
                // @ts-ignore
                if (h && h !== Me && h.IsAlive && h.IsControllable) {
                    // @ts-ignore
                    h.MoveTo(pos);
                }
            }
        }
    }
});

console.log("Denis_Cheat_V3: Loaded!");
