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
    Ability,
    GameRules
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- ЛОКАЛИЗАЦИЯ ---
Menu.Localization.AddLocalizationUnit("russian", new Map([
    ["boost_node", "SMART BOT V88"],
    ["enable_smart", "Включить Ультра-Фарм"],
    ["auto_accept", "Авто-Принятие"],
    ["auto_queue", "Авто-Поиск (RU/AP)"],
    ["auto_items", "Закуп: ПТ -> БФ -> МОМ"],
    ["auto_skill", "Прокачка скиллов"]
]));

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");
const BoostNode = UtilityEntry.AddNode("boost_node", "panorama/images/items/tome_of_knowledge_png.vtex_c");

const EnableBot = BoostNode.AddToggle("enable_smart", false);
const AutoAccept = BoostNode.AddToggle("auto_accept", true);
const AutoQueue = BoostNode.AddToggle("auto_queue", true);
const AutoItems = BoostNode.AddToggle("auto_items", true);
const AutoSkill = BoostNode.AddToggle("auto_skill", true);

// --- КОРРЕКТНЫЕ КООРДИНАТЫ (Глубоко в деревьях) ---
const RAD_SPOTS = {
    BOT_XP: new Vector3(6400, -6500, 256), // Глубоко в лесу снизу
    MID_XP: new Vector3(-1200, -800, 256), // В деревьях за мидом
    TOP_XP: new Vector3(-6500, 5000, 256), // В лесу сверху
    JUNGLE: new Vector3(1000, -4000, 256)
};

const DIRE_SPOTS = {
    BOT_XP: new Vector3(6500, -5000, 256),
    MID_XP: new Vector3(1200, 800, 256),
    TOP_XP: new Vector3(-5000, 6400, 256),
    JUNGLE: new Vector3(4000, 3000, 256)
};

let lastMoveTick = 0;

EventsSDK.on("PostDataUpdate", () => {
    // 1. АВТО-ПРИНЯТИЕ И ПОИСК
    if (AutoAccept.value && GameState.IsMatchFound && !GameState.HasAccepted) {
        EventsSDK.ExecuteCommand("dota_accept_match");
    }
    if (EnableBot.value && AutoQueue.value && !GameState.IsInGame && !GameState.IsSearching) {
        if (!Sleeper.Sleeping("queue")) {
            EventsSDK.ExecuteCommand("dota_match_game_modes 1");
            EventsSDK.ExecuteCommand("dota_match_find_match");
            Sleeper.Sleep(7000, "queue");
        }
    }

    if (!EnableBot.value) return;
    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;
    const now = Date.now();

    // 2. АВТО-СКИЛЛЫ И ЗАКУП
    if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill")) {
        const abilities = Me.Abilities.filter(a => a.CanLevelUp);
        if (abilities.length > 0) {
            // @ts-ignore
            Me.UpgradeAbility(abilities[Math.floor(Math.random() * abilities.length)]);
            Sleeper.Sleep(1000, "skill");
        }
    }
    if (AutoItems.value && !Sleeper.Sleeping("buy")) {
        const items = ["item_power_treads", "item_bfury", "item_mask_of_madness"];
        for (const i of items) {
            if (!Me.GetItemByName(i)) {
                // @ts-ignore
                Me.PurchaseItem(i);
                Sleeper.Sleep(5000, "buy");
                break;
            }
        }
    }

    // 3. ЛОГИКА ДВИЖЕНИЯ (УЛЬТРА ЦИКЛ)
    if (now - lastMoveTick >= 2000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        // Приоритет: Деф трона
        const ancient = EntityManager.GetEntitiesByClass("npc_dota_fortress").find(e => e.IsMyTeam);
        // @ts-ignore
        if (ancient && ancient.HealthPercent < 100) {
            // @ts-ignore
            Me.MoveTo(ancient.Position);
            return;
        }

        let target: Vector3;
        // Режим: Непарный лвл = ПРЯТАТЬСЯ, Парный лвл = ТОЛКАТЬ (кроме 1 лвла)
        const isHidingMode = (Me.Level % 2 !== 0); 

        // Выбор линии
        if (Me.Level < 2) target = spots.BOT_XP.Clone();
        else if (Me.Level < 6) target = spots.MID_XP.Clone();
        else if (Me.Level < 10) target = spots.TOP_XP.Clone();
        else {
            // ЛЕС (10+ лвл)
            target = spots.JUNGLE.Clone();
            target.x += (Math.random() * 1500 - 750);
            target.y += (Math.random() * 1500 - 750);
            // @ts-ignore
            Me.MoveTo(target);
            return;
        }

        if (!isHidingMode) {
            // РЕЖИМ АГРЕССИИ (Парные уровни): Выходим из деревьев в центр линии
            // Сдвигаем таргет к центру карты
            target.x = target.x * 0.7; 
            target.y = target.y * 0.7;
            
            // Пытаемся найти ближайшего крипа для атаки
            const enemyCreep = EntityManager.GetEntitiesByClass("npc_dota_creature").find(e => e.IsEnemy && e.IsAlive && e.Distance(Me) < 1000);
            if (enemyCreep) {
                // @ts-ignore
                Me.Attack(enemyCreep);
                return;
            }
        }

        // Рандом в точке
        target.x += (Math.random() * 200 - 100);
        target.y += (Math.random() * 200 - 100);

        // ИСПОЛЬЗУЕМ ДВИЖОК ОТ V87
        const dist = Me.Distance(target);
        try {
            if (dist > 1800) {
                // @ts-ignore
                Me.MoveTo(target);
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
});
