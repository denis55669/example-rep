import {
    EventsSDK,
    LocalPlayer,
    Menu,
    Vector3,
    Unit,
    ExecuteOrder,
    TickSleeper,
    GameState,
    GameRules,
    Ability
} from "github.com/octarine-public/wrapper/index"

const Sleeper = new TickSleeper();

// --- МЕНЮ ---
const UtilityEntry = Menu.AddEntry("Utility");
const BotNode = UtilityEntry.AddNode("Smart Bot V101", "panorama/images/items/tome_of_knowledge_png.vtex_c");

// ГОЛОВНИЙ ПЕРЕМИКАЧ - ВИМКНИ ЙОГО, КОЛИ ГРАЄШ САМ!
const MasterSwitch = BotNode.AddToggle("MASTER SWITCH (Я БОТ)", true);

const EnableBot = BotNode.AddToggle("Logic State", true); // Стан логіки (вмикається сам)
const AutoSkill = BotNode.AddToggle("Force Level Up", true);
const AutoQueue = BotNode.AddToggle("Auto Queue & Disconnect", true);

// --- КООРДИНАТИ ---
const RAD_SPOTS = {
    BOT_XP: new Vector3(6600, -6600, 256),  
    BOT_LANE: new Vector3(6200, -5800, 256), 
    MID_XP: new Vector3(-1100, -1100, 256), 
    MID_LANE: new Vector3(-500, -500, 256),
    TOP_XP: new Vector3(-6600, 5200, 256), 
    TOP_LANE: new Vector3(-5800, 5200, 256)
};

const DIRE_SPOTS = {
    BOT_XP: new Vector3(6600, -4800, 256), 
    BOT_LANE: new Vector3(6000, -5200, 256),
    MID_XP: new Vector3(1100, 1100, 256),
    MID_LANE: new Vector3(500, 500, 256),
    TOP_XP: new Vector3(-4800, 6600, 256), 
    TOP_LANE: new Vector3(-5200, 6000, 256)
};

let lastMoveTick = 0;
let quickbuyAdded = false;

EventsSDK.on("PostDataUpdate", () => {
    // 0. ЯКЩО МАЙСТЕР-СВІТЧ ВИМКНЕНИЙ - МОВЧИМО (Для звичайних ігор)
    if (!MasterSwitch.value) return;

    // 1. АВТО-ПОШУК ТА ДИСКОНЕКТ
    if (AutoQueue.value) {
        // Якщо гра закінчилася (Трон впав або Пост-гейм)
        if (GameState.IsPostGame) {
            EventsSDK.ExecuteCommand("disconnect"); // Вихід в меню
            return;
        }
        
        // Приймаємо гру
        if (GameState.IsMatchFound && !GameState.HasAccepted) {
            EventsSDK.ExecuteCommand("dota_accept_match");
        }

        // Шукаємо гру (All Pick)
        if (!GameState.IsInGame && !GameState.IsSearching && !GameState.IsMatchFound) {
            if (!Sleeper.Sleeping("queue")) {
                // ID 1 = All Pick, ID 3 = Random Draft і т.д.
                // Ставимо All Pick Ranked/Unranked
                EventsSDK.ExecuteCommand("dota_match_game_modes 1"); 
                EventsSDK.ExecuteCommand("dota_match_find_match");
                Sleeper.Sleep(5000, "queue");
                // Скидаємо прапори для нової гри
                quickbuyAdded = false; 
                if (!EnableBot.value) EnableBot.value = true;
            }
        }
    }

    // Якщо ми не в матчі - виходимо
    if (!GameState.IsInGame) return;

    const Me = LocalPlayer?.Hero;
    if (!Me || !Me.IsAlive) return;

    // ==========================================
    // 2. АВТО-СТАРТ (0:00)
    // ==========================================
    // Вмикаємо бота примусово на старті, тільки якщо MasterSwitch увімкнений
    if (Me.Level < 2 && GameRules && GameRules.GameTime < 60) {
        if (!EnableBot.value) EnableBot.value = true;
    }

    // ==========================================
    // 3. СТОП НА 6 РІВНІ (Щоб не банили)
    // ==========================================
    if (Me.Level >= 6) {
        if (EnableBot.value) {
            EnableBot.value = false; // Вимикаємо логіку
            console.log("Level 6 reached. Bot Stopped.");
        }
        return; // Повний стоп
    }

    if (!EnableBot.value) return;

    // ==========================================
    // 4. QUICKBUY (Додаємо в чергу)
    // ==========================================
    // Додаємо ПТ, БФ, МОМ у швидку покупку один раз на старті
    if (!quickbuyAdded && GameRules.GameTime > 0) {
        // Очистити квікбай (опціонально) і додати предмети
        // Команди додавання в квікбай:
        EventsSDK.ExecuteCommand("dota_shop_force_assign_quickbuy item_power_treads"); // PT
        EventsSDK.ExecuteCommand("dota_shop_item_add_to_quickbuy item_bfury"); // BF
        EventsSDK.ExecuteCommand("dota_shop_item_add_to_quickbuy item_mask_of_madness"); // MOM
        
        quickbuyAdded = true;
        console.log("Items added to Quickbuy");
    }

    // ==========================================
    // 5. ПРОКАЧКА (FORCE MODE)
    // ==========================================
    if (AutoSkill.value && Me.AbilityPoints > 0 && !Sleeper.Sleeping("skill")) {
        // Шукаємо БУДЬ-ЯКИЙ скіл, який можна вкачати
        const ability = Me.Abilities.find(a => a.CanLevelUp && !a.IsHidden);
        
        if (ability) {
            // @ts-ignore
            Me.UpgradeAbility(ability);
            Sleeper.Sleep(200, "skill"); // Дуже швидко (0.2 сек), щоб точно вкачав
        }
    }

    // ==========================================
    // 6. РУХ (1 ЛВЛ = КУЩІ, ІНШІ = ЛАЙН)
    // ==========================================
    // Щоб не отримати бан за XP, ми сидимо в кущах ТІЛЬКИ на 1 рівні.
    // З 2 по 5 рівень ми завжди на лінії.
    
    const now = Date.now();
    if (now - lastMoveTick >= 3000) {
        lastMoveTick = now;
        const isRadiant = LocalPlayer.Team === 2;
        const spots = isRadiant ? RAD_SPOTS : DIRE_SPOTS;
        
        // Цикл ліній (зміна кожні 2 рівні)
        const cycle = Math.floor((Me.Level - 1) / 2) % 3;
        
        // ХОВАЄМОСЯ ТІЛЬКИ НА 1 РІВНІ! (Щоб не було бану)
        // На 3 і 5 рівні теж йдемо бити, бо інакше не дадуть XP
        const isHide = (Me.Level === 1); 

        let target: Vector3;
        
        if (cycle === 0) target = isHide ? spots.BOT_XP.Clone() : spots.BOT_LANE.Clone(); // Низ
        else if (cycle === 1) target = isHide ? spots.MID_XP.Clone() : spots.MID_LANE.Clone(); // Мід
        else target = isHide ? spots.TOP_XP.Clone() : spots.TOP_LANE.Clone(); // Верх

        // Рандом
        target.x += (Math.random() * 300 - 150);
        target.y += (Math.random() * 300 - 150);

        try {
            // @ts-ignore
            ExecuteOrder.HoldOrdersTarget = target;
            
            if (!isHide) {
                // РЕЖИМ АГРЕСІЇ (рівні 2, 3, 4, 5)
                // Атакуємо землю, щоб бити кріпів і отримувати XP
                // @ts-ignore
                Me.Attack(target); 
            } else {
                // РЕЖИМ КУЩІВ (рівень 1)
                // @ts-ignore
                Me.MoveTo(target, false, true); 
            }
        } catch (e) {
            // @ts-ignore
            Me.MoveTo(target);
        }
    }
});
