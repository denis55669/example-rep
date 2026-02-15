import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    EntityManager
} from "github.com/octarine-public/wrapper/index"

// Новое ID меню, чтобы ничего не прыгало
const DenisV4 = Menu.AddEntry("Denis_Final_v4");
const FeedActive = DenisV4.AddToggle("FEED_ON", false);
const TargetDire = DenisV4.AddToggle("Target_is_Dire", false);
const FeedTeammates = DenisV4.AddToggle("Feed_Teammates", true);

const ArmletActive = DenisV4.AddToggle("Armlet_Abuse", false);
const ArmletHPValue = DenisV4.AddList("Armlet_HP", ["150", "200", "250", "300", "350"], 2);

let nextTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    const now = Date.now();
    if (now < nextTick) return; 
    nextTick = now + 200; // Ограничиваем до 5 проверок в секунду для Xeon [cite: 2025-10-12]

    // --- 1. АРМЛЕТ (Список вместо слайдера, чтобы не прыгал)
    if (ArmletActive.value) {
        const hpLimit = [150, 200, 250, 300, 350][ArmletHPValue.value];
        // @ts-ignore
        const armlet = Me.GetItem("item_armlet");
        // @ts-ignore
        if (armlet && Me.Health < hpLimit && Me.HasModifier("modifier_item_armlet_unholy_strength")) {
            // @ts-ignore
            armlet.Cast(); armlet.Cast();
        }
    }

    // --- 2. ФИДЕР (Используем консоль для обхода Humanizer)
    if (FeedActive.value) {
        // Каждые 4 секунды принудительно шлем команду
        if (!globalThis.lastMove) globalThis.lastMove = 0;
        if (now - globalThis.lastMove > 4000) {
            globalThis.lastMove = now;

            const x = TargetDire.value ? 7200 : -7200;
            const y = TargetDire.value ? 6500 : -6600;

            // Прямая команда в обход защиты Octarine
            // @ts-ignore
            EventsSDK.ExecuteCommand(`dota_unit_moveto ${x} ${y}`);

            if (FeedTeammates.value) {
                const units = EntityManager.GetEntitiesByClass("CDOTA_BaseNPC_Hero");
                for (const u of units) {
                    // @ts-ignore
                    if (u && u !== Me && u.IsAlive && u.IsControllable) {
                        // @ts-ignore
                        u.MoveTo(new Vector3(x, y, 384));
                    }
                }
            }
        }
    }
});

console.log("Denis_Final_v4 Loaded. Фид только при FEED_ON!");
