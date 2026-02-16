import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    TickSleeper,
    GameState,
    EntityManager,
    Ability
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");

// МОДУЛЬ 1: ФИДЕР (ВСЕГДА В КОДЕ)
const BadGuyNode = UtilityEntry.AddNode("Bad Guy", "panorama/images/items/shadow_amulet_png.vtex_c");
const FeedNode = BadGuyNode.AddNode("Feed", "panorama/images/spellicons/skeleton_king_reincarnation_png.vtex_c");
const RunToRadiant = FeedNode.AddToggle("Feed RADIANT", false);
const RunToDire = FeedNode.AddToggle("Feed DIRE", false);

// МОДУЛЬ 2: СМАРТ БОТ
const BoostNode = UtilityEntry.AddNode("Smart Bot", "panorama/images/items/tome_of_knowledge_png.vtex_c");
const EnableBot = BoostNode.AddToggle("Enable Movement", false);
const AutoItems = BoostNode.AddToggle("Auto Buy (PT-BF-MOM)", true);
const AutoSkill = BoostNode.AddToggle("Auto Level Skills", true);

// --- КООРДИНАТЫ ---
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

const RAD_SPOTS = [
    new Vector3(6400, -6300, 256), // BOT Trees
    new Vector3(-800, -600, 256),  // MID Trees
    new Vector3(-6300, 5500, 256), // TOP Trees
    new Vector3(1000, -4000, 256)  // JUNGLE
];

const DIRE_SPOTS = [
    new Vector3(6400, -5200, 256), // BOT Trees
    new Vector3(800, 600, 256),    // MID Trees
    new Vector3(-5500, 6300, 256), // TOP Trees
    new Vector3(4000, 3000, 256)   // JUNGLE
];

let lastMoveTick = 0;
let lastFeedTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // ==========================================
    // 1. ЛОГИКА ФИДЕРА (ТВОЙ ОРИГИНАЛ)
    // ==========================================
    if (RunToRadiant.value || RunToDire.value) {
        let target = RunToRadiant.value ? BASE_RADIANT.Clone() : BASE_DIRE.Clone();
        if (now - lastFeedTick >= 100) {
            lastFeedTick = now;
            target.x += (Math.random() * 800 - 400);
            target.y += (Math.random() * 800 - 400);
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            // @ts-ignore
            Me.MoveTo(target, false, true);
        }
        return; 
    }

    // ==========================================
    // 2. ЛОГИКА БОТА (ДВИЖОК V87)
    // ==========================================
    if (EnableBot.value) {
        // Авто-скиллы и закуп
        if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill")) {
            const abilities = Me.Abilities.filter(a => a.CanLevelUp);
            if (abilities.length > 0) {
                // @ts-ignore
                Me.UpgradeAbility(abilities[Math.floor(Math.random() * abilities.length)]);
                Sleeper.Sleep(1000, "skill");
            }
        }
        if (AutoItems.value && !Sleeper.Sleeping("buy")) {
            const i = !Me.GetItemByName("item_power_treads") ? "item_power_treads" : !Me.GetItemByName("item_bfury") ? "item_bfury" : !Me.GetItemByName("item_mask_of_madness") ? "item_mask_of_madness" : null;
            if (i) { 
                // @ts-ignore
                Me.PurchaseItem(i); Sleeper.Sleep(5000, "buy"); 
            }
        }

        // ДВИЖЕНИЕ (РАБОЧИЙ МЕТОД V87)
        if (now - lastMoveTick >= 3000) {
            lastMoveTick = now;
            const isRadiant = LocalPlayer.Team === 2;
            const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
            
            let target: Vector3;
            if (Me.Level < 2) target = spots[0].Clone();
            else if (Me.Level < 6) target = spots[1].Clone();
            else if (Me.Level < 10) target = spots[2].Clone();
            else target = spots[3].Clone();

            // ЛОГИКА «ВЫХОДА» ИЗ ДЕРЕВЬЕВ
            const isPushing = (Me.Level % 2 === 0); // Парные уровни (2, 4, 6, 8) - идем бить
            if (isPushing && Me.Level < 10) {
                target.x = target.x * 0.8; // Сдвигаем ближе к линии
                target.y = target.y * 0.8;
            }

            target.x += (Math.random() * 400 - 200);
            target.y += (Math.random() * 400 - 200);

            const dist = Me.Distance(target);
            try {
                if (dist > 1500) {
                    // @ts-ignore
                    Me.MoveTo(target); // Обычный выход с базы
                } else {
                    // @ts-ignore
                    ExecuteOrder.HoldOrdersTarget = target;
                    // @ts-ignore
                    Me.MoveTo(target, false, true); // Bypass для кустов
                }
            } catch (e) {
                // @ts-ignore
                Me.MoveTo(target);
            }
        }
    }
});
