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

// МОДУЛЬ 1: ФИДЕР (ТВОЙ ОРИГИНАЛ - ВСЕГДА ТУТ)
const BadGuyNode = UtilityEntry.AddNode("Bad Guy", "panorama/images/items/shadow_amulet_png.vtex_c");
const FeedNode = BadGuyNode.AddNode("Feed", "panorama/images/spellicons/skeleton_king_reincarnation_png.vtex_c");
const RunToRadiant = FeedNode.AddToggle("Feed RADIANT", false);
const RunToDire = FeedNode.AddToggle("Feed DIRE", false);

// МОДУЛЬ 2: СМАРТ БОТ (SVEN EDITION)
const BoostNode = UtilityEntry.AddNode("Smart Bot", "panorama/images/items/tome_of_knowledge_png.vtex_c");
const EnableBot = BoostNode.AddToggle("Enable Movement", false);
const AutoItems = BoostNode.AddToggle("Auto Buy (PT-BF-MOM)", false);
const AutoSkill = BoostNode.AddToggle("Auto Level Skills (Sven Focus)", false);

// --- КООРДИНАТЫ ---
const BASE_RADIANT = new Vector3(-7200, -6600, 384);
const BASE_DIRE = new Vector3(7200, 6500, 384);

// XP Spots (Глубоко в деревьях)
const RAD_TREES = [
    new Vector3(6500, -6500, 256), // BOT Trees
    new Vector3(-1100, -700, 256), // MID Trees
    new Vector3(-6500, 5000, 256), // TOP Trees
    new Vector3(1000, -4000, 256)  // JUNGLE
];
const DIRE_TREES = [
    new Vector3(6500, -5000, 256), // BOT Trees
    new Vector3(1100, 700, 256),   // MID Trees
    new Vector3(-5000, 6500, 256), // TOP Trees
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
    // 2. ЛОГИКА БОТА (SVEN UPGRADED)
    // ==========================================
    if (EnableBot.value) {
        
        // --- АВТО-СКИЛЛЫ (SVEN FOCUS: GREAT CLEAVE) ---
        if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill")) {
            const cleave = Me.GetAbilityByName("sven_great_cleave");
            const warcry = Me.GetAbilityByName("sven_warcry");
            const stun = Me.GetAbilityByName("sven_storm_bolt");
            const ult = Me.GetAbilityByName("sven_gods_strength");

            // Приоритет: Ульта -> Пассивка (Сплеш) -> Варкрай -> Стан
            const targetAbility = (ult?.CanLevelUp) ? ult : (cleave?.CanLevelUp) ? cleave : (warcry?.CanLevelUp) ? warcry : stun;
            
            if (targetAbility && targetAbility.CanLevelUp) {
                // @ts-ignore
                Me.UpgradeAbility(targetAbility);
                Sleeper.Sleep(2000, "skill"); // Увеличен слипер чтобы не мешать ходьбе
            }
        }

        // --- АВТО-ЗАКУП ---
        if (AutoItems.value && !Sleeper.Sleeping("buy")) {
            const item = !Me.GetItemByName("item_power_treads") ? "item_power_treads" : !Me.GetItemByName("item_bfury") ? "item_bfury" : !Me.GetItemByName("item_mask_of_madness") ? "item_mask_of_madness" : null;
            if (item) { 
                // @ts-ignore
                Me.PurchaseItem(item); Sleeper.Sleep(10000, "buy"); 
            }
        }

        // --- ДВИЖЕНИЕ (ЦИКЛ КУЩИ/ЛИНИЯ) ---
        if (now - lastMoveTick >= 3000) {
            lastMoveTick = now;
            const isRadiant = LocalPlayer.Team === 2;
            const spots = isRadiant ? RAD_TREES : DIRE_TREES;
            
            let target: Vector3;
            // 1 лвл - Низ, 2-5 лвл - Мид, 6-9 лвл - Верх, 10+ Лес
            if (Me.Level < 2) target = spots[0].Clone();
            else if (Me.Level < 6) target = spots[1].Clone();
            else if (Me.Level < 10) target = spots[2].Clone();
            else target = spots[3].Clone();

            // ЛОГИКА ЦИКЛА: Прятаться (Нечетные лвл) / Толкать (Четные лвл)
            const isHiding = (Me.Level % 2 !== 0); 
            if (!isHiding && Me.Level < 10) {
                // Если не прячемся - выходим на линию (умножаем координаты, чтобы сместить к центру)
                target.x = target.x * 0.75; 
                target.y = target.y * 0.75;
                
                // Атакуем ближайшего крипа если мы в режиме "Толкать"
                const creep = EntityManager.GetEntitiesByClass("npc_dota_creature").find(e => e.IsEnemy && e.IsAlive && e.Distance(Me) < 800);
                if (creep) {
                    // @ts-ignore
                    Me.Attack(creep);
                    return;
                }
            }

            target.x += (Math.random() * 300 - 150);
            target.y += (Math.random() * 300 - 150);

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
